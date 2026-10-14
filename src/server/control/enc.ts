/**
 * data encrypt/decrypt
 *
 * New records are written with AES-256-GCM (authenticated): any tampering
 * with the stored ciphertext is detected on read instead of silently
 * decrypting to garbage.
 *
 * Encoding matters for size: DynamoDB caps a stored item at 400KB, and sync
 * payloads are large (the electerm client already gcm-encrypts bookmarks and
 * profiles before upload, ~2x with hex framing). Hex output on top of that
 * pushed a 206KB payload to a ~412KB item — over the limit, surfacing as an
 * opaque 500. New records therefore use base64 (~1.37x) instead of hex (2x).
 *
 * Three on-disk formats coexist, dispatched by marker, so existing data
 * needs no re-encryption migration:
 *   - 'g2:' base64 aes-256-gcm   (current)
 *   - 'g1:' hex aes-256-gcm      (written before the base64 switch)
 *   - no marker, hex aes-192-cbc (legacy, unauthenticated)
 * Note rolling back to pre-g1 code after a g2 write would mis-read new
 * records, so deploy dec-side compatibility first.
 */

import crypto from 'crypto'

const gcmMarker = 'g2:'
const gcmHexMarker = 'g1:'

// 16-byte auth tag rendered as base64 (24 chars, padded) / hex (32 chars)
const tagLen: Record<string, number> = {
  [gcmMarker]: 24,
  [gcmHexMarker]: 32
}

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
  const key = await scryptAsync(password, salt, 32)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(str, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  encrypted += cipher.getAuthTag().toString('base64')
  // marker + ciphertext + 16-byte auth tag (base64)
  return { encrypted: gcmMarker + encrypted, iv: iv.toString('hex'), salt }
}

export const dec = async function (
  encrypted: string = '',
  ivStr: string,
  salt: string,
  password: string = process.env.JWT_SECRET as string,
  algorithm: string = 'aes-192-cbc'
): Promise<string> {
  const iv = Buffer.from(ivStr, 'hex')
  const marker = encrypted.startsWith(gcmMarker)
    ? gcmMarker
    : encrypted.startsWith(gcmHexMarker) ? gcmHexMarker : ''
  if (marker !== '') {
    // authenticated format: fail loudly on tampered ciphertext or tag
    const encoding = marker === gcmMarker ? 'base64' : 'hex'
    const key = await scryptAsync(password, salt, 32)
    const body = encrypted.slice(marker.length)
    const tag = Buffer.from(body.slice(-tagLen[marker]), encoding)
    const data = body.slice(0, -tagLen[marker])
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    let decrypted = decipher.update(data, encoding, 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
  // legacy unauthenticated format (records written before GCM)
  const key = await scryptAsync(password, salt, 24)
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
