/* eslint-env jest */

/**
 * Backward-compatibility regression tests for the at-rest encryption format.
 *
 * Records already stored in DynamoDB were written by older versions of
 * enc.ts. Every historical encoder is reproduced here (copied from the git
 * commits below) and the current dec() must read all of them — existing sync
 * data must never need a re-encryption migration.
 *
 * Format history (all dispatched by marker, see src/server/control/enc.ts):
 *   ea157fd Init          raw hex aes-192-cbc, hardcoded salt 'salt', no salt stored
 *   b65ac1d salt support  raw hex aes-192-cbc, random salt stored per record
 *   e53c6a6 Code improve  'g1:' + hex aes-256-gcm
 *   (current)             'g2:' + base64 aes-256-gcm
 *
 * The dec() call shapes below mirror src/server/control/data-control.ts,
 * including the `data.salt ?? 'salt'` fallback for Init-era records that
 * predate the salt column (encInit therefore returns salt 'salt', exactly
 * what getData passes for those records).
 */

import crypto from 'crypto'
import { enc, dec } from '../../src/server/control/enc'

const PASSWORD = 'test-jwt-secret'

interface Record {
  encrypted: string
  iv: string
  salt: string
}

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

// --- ea157fd (Init): aes-192-cbc, hardcoded salt 'salt', 16-byte iv ---------
// the original enc() stored no salt column; getData passes data.salt ?? 'salt'
async function encInit (str: string): Promise<Record> {
  const key = await scryptAsync(PASSWORD, 'salt', 24)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-192-cbc', key, iv)
  let encrypted = cipher.update(str, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return { encrypted, iv: iv.toString('hex'), salt: 'salt' }
}

// --- b65ac1d (salt support): aes-192-cbc, random salt stored per record -----
async function encSaltCbc (str: string): Promise<Record> {
  const salt = crypto.randomBytes(16).toString('hex')
  const key = await scryptAsync(PASSWORD, salt, 24)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-192-cbc', key, iv)
  let encrypted = cipher.update(str, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return { encrypted, iv: iv.toString('hex'), salt }
}

// --- e53c6a6 (Code improve): 'g1:' + hex aes-256-gcm, 12-byte iv ------------
async function encGcmHex (str: string): Promise<Record> {
  const iv = crypto.randomBytes(12)
  const salt = crypto.randomBytes(16).toString('hex')
  const key = await scryptAsync(PASSWORD, salt, 32)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(str, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  encrypted += cipher.getAuthTag().toString('hex')
  return { encrypted: 'g1:' + encrypted, iv: iv.toString('hex'), salt }
}

// --- current: 'g2:' + base64 aes-256-gcm ------------------------------------
async function encGcmBase64 (str: string): Promise<Record> {
  const out = await enc(str, PASSWORD)
  return out
}

// a realistic electerm sync payload, the kind of record actually stored
const SYNC_PAYLOAD = JSON.stringify({
  description: 'sync electerm data',
  files: {
    'bookmarks.json': { content: '[{"id":"bm1","host":"1.2.3.4"}]' },
    'bookmarks.order.json': { content: 'empty' },
    'profiles.json': { content: '[{"id":"pf1"}]' },
    'quickCommands.json': { content: '[]' },
    'electerm-status.json': { content: '{"lastSyncTime":1750000000000}' }
  }
})

describe('dec() backward compatibility with stored records', () => {
  it('reads Init-era records (ea157fd: unmarked hex cbc, salt falls back to "salt")', async () => {
    const old = await encInit(SYNC_PAYLOAD)
    expect(await dec(old.encrypted, old.iv, old.salt, PASSWORD)).toBe(SYNC_PAYLOAD)
  })

  it('reads Init-era empty records', async () => {
    const old = await encInit('')
    expect(await dec(old.encrypted, old.iv, old.salt, PASSWORD)).toBe('')
  })

  it('reads salt-era records (b65ac1d: unmarked hex cbc, stored salt)', async () => {
    const old = await encSaltCbc(SYNC_PAYLOAD)
    expect(await dec(old.encrypted, old.iv, old.salt, PASSWORD)).toBe(SYNC_PAYLOAD)
  })

  it('reads g1-era records (e53c6a6: hex aes-256-gcm)', async () => {
    const old = await encGcmHex(SYNC_PAYLOAD)
    expect(await dec(old.encrypted, old.iv, old.salt, PASSWORD)).toBe(SYNC_PAYLOAD)
  })

  it('reads current g2 records (base64 aes-256-gcm)', async () => {
    const cur = await encGcmBase64(SYNC_PAYLOAD)
    expect(await dec(cur.encrypted, cur.iv, cur.salt, PASSWORD)).toBe(SYNC_PAYLOAD)
  })

  it('marker dispatch is unambiguous: legacy hex output can never carry a marker', async () => {
    // hex output only contains [0-9a-f], so it can never start with 'g1:'/'g2:'
    for (let i = 0; i < 20; i++) {
      const old = await encSaltCbc(`payload-${i}-${'z'.repeat(i)}`)
      expect(old.encrypted.startsWith('g1:')).toBe(false)
      expect(old.encrypted.startsWith('g2:')).toBe(false)
    }
  })

  it('old records can be re-encrypted by the current enc and read back (updateData flow)', async () => {
    // user hits sync: server reads an old record, client edits, server rewrites
    const old = await encInit(SYNC_PAYLOAD)
    const plain = await dec(old.encrypted, old.iv, old.salt, PASSWORD)
    const updated = JSON.stringify({ ...JSON.parse(plain), files: { 'bookmarks.json': { content: '[]' } } })
    const now = await enc(updated, PASSWORD)
    expect(now.encrypted.startsWith('g2:')).toBe(true)
    expect(await dec(now.encrypted, now.iv, now.salt, PASSWORD)).toBe(updated)
  })

  it('re-encrypting preserves byte-identical plaintext across all legacy formats', async () => {
    for (const encoder of [encInit, encSaltCbc, encGcmHex, encGcmBase64]) {
      const old = await encoder(SYNC_PAYLOAD)
      const plain = await dec(old.encrypted, old.iv, old.salt, PASSWORD)
      expect(plain).toBe(SYNC_PAYLOAD)
    }
  })

  it('wrong password throws on gcm-era records (authenticated)', async () => {
    for (const encoder of [encGcmHex, encGcmBase64]) {
      const old = await encoder(SYNC_PAYLOAD)
      await expect(
        dec(old.encrypted, old.iv, old.salt, 'wrong-password')
      ).rejects.toThrow()
    }
  })

  it('wrong password never returns the original on legacy cbc records (no mac, best effort)', async () => {
    // cbc has no auth tag: a wrong key either trips pkcs#7 padding in final()
    // or yields garbage. Either way the plaintext must not survive.
    for (const encoder of [encInit, encSaltCbc]) {
      const old = await encoder(SYNC_PAYLOAD)
      let out: string | undefined
      try {
        out = await dec(old.encrypted, old.iv, old.salt, 'wrong-password')
      } catch {
        out = undefined
      }
      expect(out).not.toBe(SYNC_PAYLOAD)
    }
  })
})
