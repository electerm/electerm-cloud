/* eslint-env jest */

import crypto from 'crypto'
import { enc, dec } from '../../src/server/control/enc'

const PASSWORD = 'test-jwt-secret'
const iv = crypto.randomBytes(12)
const salt = crypto.randomBytes(16).toString('hex')

interface Bookmark {
  id: string
  title: string
  host: string
  username: string
  authType: string
  password: string
  port: number
  type: string
  encode: string
  envLang: string
  term: string
  enableSsh: boolean
  enableSftp: boolean
  sshTunnels: unknown[]
  connectionHoppings: unknown[]
  quickCommands: unknown[]
  terminalBackground: {
    terminalBackgroundFilterOpacity: number
    terminalBackgroundFilterBlur: number
  }
}

/**
 * A realistic electerm sync payload — the shape actually stored in DynamoDB.
 * Deterministic (no random passwords) so the gzip ratio is stable across runs.
 * 400 bookmarks is the size that made production fail: the JSON has enough
 * repetition that gzip takes it to roughly 6% of the original.
 */
function realisticPayload (count = 400): string {
  const bookmarks: Bookmark[] = []
  for (let i = 0; i < count; i++) {
    bookmarks.push({
      id: `bm${i}`,
      title: `server-${i}`,
      host: `10.0.${i % 250}.${(i * 7) % 250}`,
      username: 'deploy',
      authType: 'password',
      password: `pw-${i.toString(36).padStart(6, '0')}`,
      port: 22,
      type: 'ssh',
      encode: 'utf-8',
      envLang: 'en_US.UTF-8',
      term: 'xterm-256color',
      enableSsh: true,
      enableSftp: true,
      sshTunnels: [],
      connectionHoppings: [],
      quickCommands: [],
      terminalBackground: {
        terminalBackgroundFilterOpacity: 1,
        terminalBackgroundFilterBlur: 0
      }
    })
  }
  return JSON.stringify({
    description: 'sync electerm data',
    files: {
      'bookmarks.json': { content: JSON.stringify(bookmarks) },
      'bookmarkGroups.json': {
        content: JSON.stringify([{
          id: 'default',
          title: 'default',
          bookmarkIds: bookmarks.map(b => b.id)
        }])
      },
      'electerm-status.json': {
        content: JSON.stringify({
          lastSyncTime: 1792043752200,
          electermVersion: '5.6.0',
          deviceName: 'test-mac'
        })
      }
    }
  })
}

describe('enc/dec (aes-256-gcm, gzip + base64)', () => {
  it('round-trips arbitrary content, including multibyte text', async () => {
    const str = JSON.stringify({ a: 1, b: '中文内容 😀', nested: { c: [1, 2, 3] } })
    const { encrypted, iv: ivStr, salt: s } = await enc(str, PASSWORD, iv, salt)
    // 54 bytes: gzip framing alone costs ~20, so this stays on plain base64
    expect(encrypted.startsWith('g2:')).toBe(true)
    expect(await dec(encrypted, ivStr, s, PASSWORD)).toBe(str)
  })

  it('gzips a realistic sync payload and marks it g3', async () => {
    const str = realisticPayload()
    const { encrypted, iv: ivStr, salt: s } = await enc(str, PASSWORD, iv, salt)
    expect(encrypted.startsWith('g3:')).toBe(true)
    expect(await dec(encrypted, ivStr, s, PASSWORD)).toBe(str)
  })

  it('shrinks a realistic payload enough to cut the DynamoDB write cost', async () => {
    // item size is the price of the write, not just of the storage: DynamoDB
    // charges 1 WCU per KB of item, so the ~160KB item this used to produce
    // needed ~161 WCU in a single write and got throttled on a small table
    const str = realisticPayload()
    const { encrypted } = await enc(str, PASSWORD, iv, salt)
    const rawKB = Buffer.byteLength(str, 'utf8') / 1024
    const storedKB = encrypted.length / 1024
    expect(storedKB).toBeLessThan(rawKB / 5)
    // comfortably inside any sane provisioned write capacity
    expect(encrypted.length).toBeLessThan(32 * 1024)
  })

  it('never inflates a record gzip cannot shrink', async () => {
    // gzip framing alone costs ~20 bytes, so small records stay on g2 rather
    // than growing. '{}' matters in particular: it is the Data schema default.
    for (const str of ['', '{}', 'secret', '{"a":1}', '中文', 'empty']) {
      const { encrypted } = await enc(str, PASSWORD, iv, salt)
      expect(encrypted.startsWith('g2:')).toBe(true)
    }
  })

  it('keeps using base64, not hex, on the g2 path', async () => {
    // 'secret' = 6 bytes -> 8 base64 chars + 24-char tag + 3-char marker = 35.
    // hex would be 12 + 32 + 3 = 47. Hex is what pushed items over 400KB.
    const { encrypted } = await enc('secret', PASSWORD, iv, salt)
    expect(encrypted.length).toBeLessThan(40)
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

  it('tampered ciphertext throws (auth tag), g2 and g3 alike', async () => {
    for (const str of ['secret', realisticPayload(40)]) {
      const { encrypted, iv: ivStr, salt: s } = await enc(str, PASSWORD, iv, salt)
      const flipped = encrypted[4] === 'A' ? 'B' : 'A'
      const tampered = encrypted.slice(0, 4) + flipped + encrypted.slice(5)
      await expect(dec(tampered, ivStr, s, PASSWORD)).rejects.toThrow()
    }
  })

  it('truncated payload throws', async () => {
    const { encrypted, iv: ivStr, salt: s } = await enc('secret', PASSWORD, iv, salt)
    await expect(dec(encrypted.slice(0, 10), ivStr, s, PASSWORD)).rejects.toThrow()
  })

  it('empty string round-trips', async () => {
    const { encrypted, iv: ivStr, salt: s } = await enc('', PASSWORD, iv, salt)
    expect(await dec(encrypted, ivStr, s, PASSWORD)).toBe('')
  })

  it('a gzip payload is not readable without the password', async () => {
    const str = realisticPayload()
    const { encrypted, iv: ivStr, salt: s } = await enc(str, PASSWORD, iv, salt)
    await expect(dec(encrypted, ivStr, s, 'wrong-password')).rejects.toThrow()
  })

  it('the payload that failed in production now stores far under the item limit', async () => {
    // production report: client-side gcm encryption turned bookmarks.json into
    // ~206KB of hex; with hex server-side encoding the stored item hit ~412KB
    // and DynamoDB rejected it. base64 fixed the cap, gzip fixes the write cost.
    const content = 'gcm:' + 'a1b2c3d4'.repeat(25500)
    const payload = JSON.stringify({
      description: 'sync electerm data',
      files: {
        'bookmarks.json': { content },
        'bookmarks.order.json': { content: 'empty' },
        'profiles.json': { content: 'gcm:' + 'e5f6a7b8'.repeat(100) }
      }
    })
    const { encrypted, iv: ivStr, salt: s } = await enc(payload, PASSWORD, iv, salt)
    expect(encrypted.startsWith('g3:')).toBe(true)
    expect(encrypted.length).toBeLessThan(400 * 1024)
    expect(await dec(encrypted, ivStr, s, PASSWORD)).toBe(payload)
  })

  // legacy-format compatibility (g2 base64 / g1 hex gcm / unmarked aes-192-cbc
  // records still in DynamoDB) is covered in enc-compat.spec.ts
})
