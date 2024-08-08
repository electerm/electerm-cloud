/**
 * data encrypt/decrypt
 */

import crypto from 'crypto'

const algorithmDefault = 'aes-192-cbc'

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
  algorithm: string = algorithmDefault,
  iv: Buffer = crypto.randomBytes(16)
): Promise<{ encrypted: string, iv: string }> {
  const key = await scryptAsync(password, 'salt', 24)
  // Use `crypto.randomBytes` to generate a random iv instead of the static iv
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(str, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return { encrypted, iv: iv.toString('hex') }
}

export const dec = async function (
  encrypted: string = '',
  ivStr: string,
  password: string = process.env.JWT_SECRET as string,
  algorithm: string = algorithmDefault
): Promise<string> {
  const iv = Buffer.from(ivStr, 'hex')
  // Use the async `crypto.scrypt()` instead.
  const key = await scryptAsync(password, 'salt', 24)
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  // Encrypted using same algorithm, key and iv.
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
