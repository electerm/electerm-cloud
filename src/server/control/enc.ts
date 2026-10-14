/**
 * data encrypt/decrypt
 *
 * New records are written with AES-256-GCM (authenticated): any tampering
 * with the stored ciphertext is detected on read instead of silently
 * decrypting to garbage.
 *
 * Records written by older versions used AES-192-CBC with no MAC. They stay
 * readable: dec() dispatches on the 'g1:' format marker, so existing data
 * needs no re-encryption migration. Note this means rolling back to the old
 * code after a GCM write would mis-read the new records, so deploy dec-side
 * compatibility first.
 */

import crypto from 'crypto'

const gcmMarker = 'g1:'

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
  let encrypted = cipher.update(str, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  encrypted += cipher.getAuthTag().toString('hex')
  // marker + ciphertext + 16-byte auth tag (hex)
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
  if (encrypted.startsWith(gcmMarker)) {
    // authenticated format: fail loudly on tampered ciphertext or tag
    const key = await scryptAsync(password, salt, 32)
    const body = encrypted.slice(gcmMarker.length)
    const tag = Buffer.from(body.slice(-32), 'hex')
    const data = body.slice(0, -32)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    let decrypted = decipher.update(data, 'hex', 'utf8')
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
