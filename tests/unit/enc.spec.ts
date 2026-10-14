/* eslint-env jest */

import crypto from 'crypto'
import { enc, dec } from '../../src/server/control/enc'

const PASSWORD = 'test-jwt-secret'
const iv = crypto.randomBytes(12)
const salt = crypto.randomBytes(16).toString('hex')

async function scryptAsync (password: string, salt: string, keylen: number): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, (err: Error | null, result: Buffer) => {
      if (err !== null) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

describe('enc/dec (aes-256-gcm, base64)', () => {
  it('round-trips arbitrary content, including multibyte text', async () => {
    const str = JSON.stringify({ a: 1, b: '中文内容 😀', nested: { c: [1, 2, 3] } })
    const { encrypted, iv: ivStr, salt: s } = await enc(str, PASSWORD, iv, salt)
    expect(encrypted.startsWith('g2:')).toBe(true)
    const back = await dec(encrypted, ivStr, s, PASSWORD)
    expect(back).toBe(str)
  })

  it('base64 output is ~1.37x, not 2x like hex', async () => {
    const str = 'x'.repeat(30000)
    const { encrypted } = await enc(str, PASSWORD, iv, salt)
    // base64 of 30000 bytes = 40000 chars + 24-char tag + 3-char marker
    expect(encrypted.length).toBeGreaterThan(30000)
    expect(encrypted.length).toBeLessThan(30000 * 1.5)
  })

  it('uses a fresh iv and salt per call by default', async () => {
    const a = await enc('same', PASSWORD)
    const b = await enc('same', PASSWORD)
    expect(a.iv).not.toBe(b.iv)
    expect(a.salt).not.toBe(b.salt)
    expect(a.encrypted).not.toBe(b.encrypted)
  })

  it('wrong password throws', async () => {
    const { encrypted, iv: ivStr, salt: s } = await enc('secret', PASSWORD, iv, salt)
    await expect(dec(encrypted, ivStr, s, 'wrong-password')).rejects.toThrow()
  })

  it('tampered ciphertext throws (auth tag)', async () => {
    const { encrypted, iv: ivStr, salt: s } = await enc('secret', PASSWORD, iv, salt)
    const flipped = encrypted[4] === 'A' ? 'B' : 'A'
    const tampered = encrypted.slice(0, 4) + flipped + encrypted.slice(5)
    await expect(dec(tampered, ivStr, s, PASSWORD)).rejects.toThrow()
  })

  it('truncated payload throws', async () => {
    const { encrypted, iv: ivStr, salt: s } = await enc('secret', PASSWORD, iv, salt)
    await expect(dec(encrypted.slice(0, 10), ivStr, s, PASSWORD)).rejects.toThrow()
  })

  it('empty string round-trips', async () => {
    const { encrypted, iv: ivStr, salt: s } = await enc('', PASSWORD, iv, salt)
    expect(await dec(encrypted, ivStr, s, PASSWORD)).toBe('')
  })

  // legacy-format compatibility (g1 hex gcm / unmarked aes-192-cbc records
  // still in DynamoDB) is covered in enc-compat.spec.ts

  it('a 206KB sync payload stays under the 400KB item limit after encoding', async () => {
    // the exact size that failed in production with hex server-side encoding
    const payload = `{"description":"sync electerm data","files":{"bookmarks.json":{"content":"${'g'.repeat(205000)}"}}}`
    const { encrypted } = await enc(payload, PASSWORD, iv, salt)
    // with the old hex encoding this was ~410KB and DynamoDB rejected it
    expect(encrypted.length).toBeGreaterThan(206 * 1024)
    expect(encrypted.length).toBeLessThan(400 * 1024)
  })
})
