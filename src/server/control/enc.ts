/**
 * data encrypt/decrypt
 *
 * New records are written with AES-256-GCM (authenticated): any tampering
 * with the stored ciphertext is detected on read instead of silently
 * decrypting to garbage.
 *
 * Encoding matters for two different limits, and only the first one is about
 * storage:
 *
 *   1. Item size. DynamoDB caps a stored item at 400KB. Hex output (~2x)
 *      pushed a 206KB payload to a ~412KB item — over the limit, surfacing as
 *      an opaque 500. Base64 (~1.37x) fixed that.
 *   2. Write cost. Item size is also the price of the write: DynamoDB charges
 *      1 WCU per KB of item, so a 164KB item needs ~161 WCU in a single
 *      write. A table provisioned below that rejects the write with
 *      ProvisionedThroughputExceededException, which looks like a random 500
 *      to the client. Compressing first cuts a JSON sync payload by roughly
 *      5-10x, taking the write down with it.
 *
 * Four on-disk formats coexist, dispatched by marker, so existing data needs
 * no re-encryption migration:
 *   - 'g3:' gzip + base64 aes-256-gcm  (current, when gzip is smaller)
 *   - 'g2:' base64 aes-256-gcm         (current, when gzip is not smaller)
 *   - 'g1:' hex aes-256-gcm            (written before the base64 switch)
 *   - no marker, hex aes-192-cbc       (legacy, unauthenticated)
 * Note rolling back to pre-g1 code after a g1/g2/g3 write would mis-read new
 * records, so deploy dec-side compatibility first.
 *
 * Gzip is applied to the plaintext *before* encryption (compress-then-encrypt)
 * and is kept only when it actually shrinks the payload, so a record is never
 * larger than what the previous format would have written.
 */

import crypto from 'crypto'
import { gzipSync, gunzipSync } from 'zlib'

const gzipMarker = 'g3:'
const gcmMarker = 'g2:'
const gcmHexMarker = 'g1:'

// 16-byte auth tag rendered as base64 (24 chars, padded) / hex (32 chars)
const tagLen: Record<string, number> = {
  [gzipMarker]: 24,
  [gcmMarker]: 24,
  [gcmHexMarker]: 32
}

// A g3 record always inflates back to a sync payload, which api/sync.ts caps
// at 280KB. Bound the inflate anyway, so a hand-crafted gzip bomb stored
// through the API cannot expand without limit on read.
const MAX_DECOMPRESSED = 8 * 1024 * 1024

async function scryptAsync (password: string, salt: string, keylen: number): Promise<Buffer> {
  return await new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, keylen, (err: Error | null, result: Buffer) => {
      if (err !== null) {
        reject(err)
      }
      resolve(result)
    })
  )
}

export const enc = async function (
  str: string = '',
  password: string = process.env.JWT_SECRET as string,
  iv: Buffer = crypto.randomBytes(12),
  salt: string = crypto.randomBytes(16).toString('hex')
): Promise<{ encrypted: string, iv: string, salt: string }> {
  const raw = Buffer.from(str, 'utf8')
  const gzipped = gzipSync(raw)
  // Pay for gzip only when it wins: small records (the '{}' seed, tiny
  // payloads) would otherwise grow, since gzip framing alone costs ~20 bytes.
  const useGzip = gzipped.length < raw.length
  const marker = useGzip ? gzipMarker : gcmMarker
  const key = await scryptAsync(password, salt, 32)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(useGzip ? gzipped : raw).toString('base64')
  encrypted += cipher.final().toString('base64')
  encrypted += cipher.getAuthTag().toString('base64')
  // marker + ciphertext + 16-byte auth tag (base64)
  return { encrypted: marker + encrypted, iv: iv.toString('hex'), salt }
}

export const dec = async function (
  encrypted: string = '',
  ivStr: string,
  salt: string,
  password: string = process.env.JWT_SECRET as string,
  algorithm: string = 'aes-192-cbc'
): Promise<string> {
  const iv = Buffer.from(ivStr, 'hex')
  const marker = encrypted.startsWith(gzipMarker)
    ? gzipMarker
    : encrypted.startsWith(gcmMarker)
      ? gcmMarker
      : encrypted.startsWith(gcmHexMarker) ? gcmHexMarker : ''
  if (marker !== '') {
    // authenticated format: fail loudly on tampered ciphertext or tag
    const encoding = marker === gcmHexMarker ? 'hex' : 'base64'
    const key = await scryptAsync(password, salt, 32)
    const body = encrypted.slice(marker.length)
    const tag = Buffer.from(body.slice(-tagLen[marker]), encoding)
    const data = body.slice(0, -tagLen[marker])
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    // decrypt to bytes, not to a string: a g3 plaintext is gzip, which is
    // binary and would not survive a utf8 round-trip
    const plain = Buffer.concat([
      decipher.update(data, encoding),
      decipher.final()
    ])
    return marker === gzipMarker
      ? gunzipSync(plain, { maxOutputLength: MAX_DECOMPRESSED }).toString('utf8')
      : plain.toString('utf8')
  }
  // legacy unauthenticated format (records written before GCM)
  const key = await scryptAsync(password, salt, 24)
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
