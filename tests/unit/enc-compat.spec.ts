/* eslint-env jest */

/**
 * Backward-compatibility regression tests for the at-rest encryption format.
 *
 * Records already stored in DynamoDB were written by older versions of
 * enc.ts. Every historical encoder is reproduced here (copied from the git
 * commits below) and the current dec() must read all of them — existing sync
 * data must never need a re-encryption migration.
 *
 * Every fixture is a frozen copy, including the newest one. Delegating a
 * fixture to the live enc() would make the test assert whatever enc() happens
 * to emit rather than the format dec() is supposed to understand, and it would
 * silently stop testing the old format the moment enc() changed. It also
 * verifies dec() against the format definition instead of against enc(), which
 * would otherwise be circular.
 *
 * Format history (all dispatched by marker, see src/server/control/enc.ts):
 *   ea157fd Init          raw hex aes-192-cbc, hardcoded salt 'salt', no salt stored
 *   b65ac1d salt support  raw hex aes-192-cbc, random salt stored per record
 *   e53c6a6 Code improve  'g1:' + hex aes-256-gcm
 *   cdc294d Limit size    'g2:' + base64 aes-256-gcm
 *   (current)             'g3:' + gzip + base64 aes-256-gcm
 *                         (falls back to g2 when gzip would not shrink)
 *
 * The dec() call shapes below mirror src/server/control/data-control.ts,
 * including the `data.salt ?? 'salt'` fallback for Init-era records that
 * predate the salt column (encInit therefore returns salt 'salt', exactly
 * what getData passes for those records).
 */

import crypto from 'crypto'
import { gzipSync } from 'zlib'
import { enc, dec } from '../../src/server/control/enc'

const PASSWORD = 'test-jwt-secret'

interface EncryptedRecord {
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
async function encInit (str: string): Promise<EncryptedRecord> {
  const key = await scryptAsync(PASSWORD, 'salt', 24)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-192-cbc', key, iv)
  let encrypted = cipher.update(str, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return { encrypted, iv: iv.toString('hex'), salt: 'salt' }
}

// --- b65ac1d (salt support): aes-192-cbc, random salt stored per record -----
async function encSaltCbc (str: string): Promise<EncryptedRecord> {
  const salt = crypto.randomBytes(16).toString('hex')
  const key = await scryptAsync(PASSWORD, salt, 24)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-192-cbc', key, iv)
  let encrypted = cipher.update(str, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return { encrypted, iv: iv.toString('hex'), salt }
}

// --- e53c6a6 (Code improve): 'g1:' + hex aes-256-gcm, 12-byte iv ------------
async function encGcmHex (str: string): Promise<EncryptedRecord> {
  const iv = crypto.randomBytes(12)
  const salt = crypto.randomBytes(16).toString('hex')
  const key = await scryptAsync(PASSWORD, salt, 32)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(str, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  encrypted += cipher.getAuthTag().toString('hex')
  return { encrypted: 'g1:' + encrypted, iv: iv.toString('hex'), salt }
}

// --- cdc294d (Limit data size): 'g2:' + base64 aes-256-gcm, no compression --
async function encGcmBase64 (str: string): Promise<EncryptedRecord> {
  const iv = crypto.randomBytes(12)
  const salt = crypto.randomBytes(16).toString('hex')
  const key = await scryptAsync(PASSWORD, salt, 32)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(str, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  encrypted += cipher.getAuthTag().toString('base64')
  return { encrypted: 'g2:' + encrypted, iv: iv.toString('hex'), salt }
}

// --- current: 'g3:' + gzip + base64 aes-256-gcm -----------------------------
async function encGzipBase64 (str: string): Promise<EncryptedRecord> {
  const iv = crypto.randomBytes(12)
  const salt = crypto.randomBytes(16).toString('hex')
  const key = await scryptAsync(PASSWORD, salt, 32)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const gz = gzipSync(Buffer.from(str, 'utf8'))
  let encrypted = cipher.update(gz).toString('base64')
  encrypted += cipher.final().toString('base64')
  encrypted += cipher.getAuthTag().toString('base64')
  return { encrypted: 'g3:' + encrypted, iv: iv.toString('hex'), salt }
}

// the live encoder, used only to check that whatever it emits today is
// readable — never as a fixture for a historical format
async function encCurrent (str: string): Promise<EncryptedRecord> {
  return await enc(str, PASSWORD)
}

// a small electerm sync payload
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

// a realistically large payload — the size that made production fail. Enough
// repeated keys and structure that gzip takes it to a few percent.
function largeSyncPayload (count = 400): string {
  const bookmarks: Array<Record<string, unknown>> = []
  for (let i = 0; i < count; i++) {
    bookmarks.push({
      id: `bm${i}`,
      title: `server-${i}`,
      host: `10.0.${i % 250}.${(i * 7) % 250}`,
      username: 'deploy',
      authType: 'password',
      port: 22,
      type: 'ssh',
      enableSsh: true,
      enableSftp: true,
      sshTunnels: []
    })
  }
  return JSON.stringify({
    description: 'sync electerm data',
    files: {
      'bookmarks.json': { content: JSON.stringify(bookmarks) },
      'electerm-status.json': {
        content: '{"lastSyncTime":1792043752200,"electermVersion":"5.6.0"}'
      }
    }
  })
}

const LARGE_SYNC_PAYLOAD = largeSyncPayload()

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

  it('reads g2-era records (cdc294d: base64 aes-256-gcm)', async () => {
    const old = await encGcmBase64(SYNC_PAYLOAD)
    expect(await dec(old.encrypted, old.iv, old.salt, PASSWORD)).toBe(SYNC_PAYLOAD)
  })

  it('reads current g3 records (gzip + base64 aes-256-gcm)', async () => {
    const cur = await encGzipBase64(LARGE_SYNC_PAYLOAD)
    expect(await dec(cur.encrypted, cur.iv, cur.salt, PASSWORD)).toBe(LARGE_SYNC_PAYLOAD)
  })

  it('reads a g3 record whose plaintext is smaller than gzip framing', async () => {
    // enc() never writes this, but dec() must not care how a record was made
    const cur = await encGzipBase64('')
    expect(await dec(cur.encrypted, cur.iv, cur.salt, PASSWORD)).toBe('')
  })

  it('marker dispatch is unambiguous: legacy hex output can never carry a marker', async () => {
    // hex output only contains [0-9a-f], so it can never start with 'g1:'/'g2:'/'g3:'
    for (let i = 0; i < 20; i++) {
      const old = await encSaltCbc(`payload-${i}-${'z'.repeat(i)}`)
      expect(old.encrypted.startsWith('g1:')).toBe(false)
      expect(old.encrypted.startsWith('g2:')).toBe(false)
      expect(old.encrypted.startsWith('g3:')).toBe(false)
    }
  })

  it('old records can be re-encrypted by the current enc and read back (updateData flow)', async () => {
    // user hits sync: server reads an old record, client edits, server rewrites
    const old = await encInit(SYNC_PAYLOAD)
    const plain = await dec(old.encrypted, old.iv, old.salt, PASSWORD)
    const updated = JSON.stringify({ ...JSON.parse(plain), files: { 'bookmarks.json': { content: '[]' } } })
    const now = await enc(updated, PASSWORD)
    expect(await dec(now.encrypted, now.iv, now.salt, PASSWORD)).toBe(updated)
  })

  it('rewriting an old record upgrades it to g3 without changing the plaintext', async () => {
    const old = await encGcmBase64(LARGE_SYNC_PAYLOAD)
    const plain = await dec(old.encrypted, old.iv, old.salt, PASSWORD)
    const now = await encCurrent(plain)
    expect(now.encrypted.startsWith('g3:')).toBe(true)
    // the whole point: same data, a fraction of the item, a fraction of the WCU
    expect(now.encrypted.length).toBeLessThan(old.encrypted.length / 5)
    expect(await dec(now.encrypted, now.iv, now.salt, PASSWORD)).toBe(plain)
  })

  it('re-encrypting preserves byte-identical plaintext across all formats', async () => {
    for (const encoder of [encInit, encSaltCbc, encGcmHex, encGcmBase64, encGzipBase64]) {
      const old = await encoder(SYNC_PAYLOAD)
      const plain = await dec(old.encrypted, old.iv, old.salt, PASSWORD)
      expect(plain).toBe(SYNC_PAYLOAD)
    }
  })

  it('the live enc() always emits something dec() can read back', async () => {
    // guards the pair, not a format: whichever marker enc() picks today, the
    // stored record must round-trip
    for (const payload of ['', '{}', SYNC_PAYLOAD, LARGE_SYNC_PAYLOAD]) {
      const now = await encCurrent(payload)
      expect(now.encrypted.startsWith('g2:') || now.encrypted.startsWith('g3:')).toBe(true)
      expect(await dec(now.encrypted, now.iv, now.salt, PASSWORD)).toBe(payload)
    }
  })

  it('wrong password throws on gcm-era records (authenticated)', async () => {
    for (const encoder of [encGcmHex, encGcmBase64, encGzipBase64]) {
      const old = await encoder(LARGE_SYNC_PAYLOAD)
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

  it('tampered g3 ciphertext throws instead of inflating to garbage', async () => {
    const old = await encGzipBase64(LARGE_SYNC_PAYLOAD)
    const flipped = old.encrypted[4] === 'A' ? 'B' : 'A'
    const tampered = old.encrypted.slice(0, 4) + flipped + old.encrypted.slice(5)
    await expect(dec(tampered, old.iv, old.salt, PASSWORD)).rejects.toThrow()
  })

  it('refuses to inflate a g3 record past the decompression bound', async () => {
    // a hand-crafted gzip bomb stored through the API must not expand without
    // limit on read; the bound sits far above any legitimate sync payload
    const bomb = await encGzipBase64('0'.repeat(9 * 1024 * 1024))
    expect(bomb.encrypted.length).toBeLessThan(64 * 1024)
    await expect(dec(bomb.encrypted, bomb.iv, bomb.salt, PASSWORD)).rejects.toThrow()
  })
})
