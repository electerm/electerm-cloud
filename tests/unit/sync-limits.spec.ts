/* eslint-env jest */

import crypto from 'crypto'
import { enc } from '../../src/server/control/enc'
import {
  MAX_SYNC_PAYLOAD,
  MAX_SYNC_PAYLOAD_KB,
  SYNC_WARN_RATIO,
  TOO_LARGE_MSG,
  isItemTooLarge,
  isThrottled,
  payloadBytes,
  storedItemBytes
} from '../../src/server/control/sync-limits'

const PASSWORD = 'test-jwt-secret'

// DynamoDB item accounting for the Data table, spelled out once so the
// prediction in sync-limits.ts is checked against the real enc() output
// rather than against itself.
const PER_ITEM_OVERHEAD = 100
const ID_LEN = 21 // nanoid
const USER_ID_LEN = 21 // nanoid
const IV_HEX_LEN = 24 // 12 bytes
const SALT_HEX_LEN = 32 // 16 bytes
const GCM_TAG_B64_LEN = 24 // 16 bytes

function actualItemBytes (encrypted: string): number {
  return PER_ITEM_OVERHEAD +
    (2 + ID_LEN) +
    (6 + USER_ID_LEN) +
    (2 + IV_HEX_LEN) +
    (4 + SALT_HEX_LEN) +
    (4 + encrypted.length) // the 'data' attribute
}

// Deterministic, so the gzip ratio is stable across runs.
function bookmarkPayload (count: number): string {
  const bms = []
  for (let i = 0; i < count; i++) {
    bms.push({
      id: `bm${i}`,
      title: `server-${i}`,
      host: `10.0.${i % 250}.${(i * 7) % 250}`,
      username: 'deploy',
      authType: 'password',
      password: `pw-${i.toString(36)}`,
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
      'bookmarks.json': { content: JSON.stringify(bms) }
    }
  })
}

/**
 * The shape a client-side sync password produces: 'gcm:iv:salt:tag:' + hex.
 * Hex carries 4 bits of entropy per character, so it barely compresses — the
 * worst realistic case, and the one that has to stay inside the item cap.
 * Built to an exact byte length so the cap can be tested at the boundary.
 */
function incompressiblePayload (totalBytes: number): string {
  const prefix = '{"files":{"bookmarks.json":{"content":"gcm:'
  const suffix = '"}}}'
  const hexLen = totalBytes - prefix.length - suffix.length
  const hex = crypto.randomBytes(Math.ceil(hexLen / 2))
    .toString('hex')
    .slice(0, hexLen)
  return prefix + hex + suffix
}

describe('payloadBytes', () => {
  test('counts UTF-8 bytes, not characters', () => {
    const s = JSON.stringify({ title: '服务器-北京' })
    expect(payloadBytes(s)).toBe(Buffer.byteLength(s, 'utf8'))
    expect(payloadBytes(s)).toBeGreaterThan(s.length)
  })

  test('is 0 for an empty payload', () => {
    expect(payloadBytes('')).toBe(0)
  })

  test('is exact for the generated fixtures', () => {
    expect(payloadBytes(incompressiblePayload(1024))).toBe(1024)
    expect(payloadBytes(incompressiblePayload(MAX_SYNC_PAYLOAD)))
      .toBe(MAX_SYNC_PAYLOAD)
  })
})

describe('storedItemBytes', () => {
  test('predicts the exact item size the real enc() produces', async () => {
    for (const count of [1, 40, 400]) {
      const payload = bookmarkPayload(count)
      const { encrypted } = await enc(payload, PASSWORD)
      expect(storedItemBytes(payload)).toBe(actualItemBytes(encrypted))
    }
  })

  test('predicts correctly for incompressible payloads too', async () => {
    const payload = incompressiblePayload(200 * 1024)
    const { encrypted } = await enc(payload, PASSWORD)
    expect(storedItemBytes(payload)).toBe(actualItemBytes(encrypted))
  })

  test('predicts correctly at the exact cap', async () => {
    const payload = incompressiblePayload(MAX_SYNC_PAYLOAD)
    const { encrypted } = await enc(payload, PASSWORD)
    expect(storedItemBytes(payload)).toBe(actualItemBytes(encrypted))
  })

  test('a payload at the cap still fits the 400KB DynamoDB item limit, worst case', () => {
    // Incompressible content is the worst case: gzip cannot shrink it, so the
    // stored item is at its largest relative to the payload.
    const item = storedItemBytes(incompressiblePayload(MAX_SYNC_PAYLOAD))
    expect(item).toBeLessThan(400 * 1024)
  })

  test('gzip makes a realistic bookmark payload cheap to write', () => {
    const payload = bookmarkPayload(400)
    const item = storedItemBytes(payload)
    expect(item).toBeLessThan(payloadBytes(payload) / 5)
    // 1 WCU per KB of item, so this is the per-write cost.
    expect(Math.ceil(item / 1024)).toBeLessThan(20)
  })

  test('does not inflate a payload that gzip cannot help', () => {
    // The adaptive marker means a tiny record is stored raw, never larger
    // than the previous format would have written.
    const raw = payloadBytes('{}')
    const expected = PER_ITEM_OVERHEAD + (2 + ID_LEN) + (6 + USER_ID_LEN) +
      (2 + IV_HEX_LEN) + (4 + SALT_HEX_LEN) +
      (4 + 3 + Math.ceil(raw / 3) * 4 + GCM_TAG_B64_LEN)
    expect(storedItemBytes('{}')).toBe(expected)
  })
})

describe('limits', () => {
  test('the quoted max is the payload cap', () => {
    expect(MAX_SYNC_PAYLOAD_KB).toBe(280)
    expect(TOO_LARGE_MSG).toBe('sync data too large, max 280KB')
  })

  test('the warn threshold is below the cap', () => {
    expect(SYNC_WARN_RATIO).toBeGreaterThan(0)
    expect(SYNC_WARN_RATIO).toBeLessThan(1)
  })
})

describe('isItemTooLarge', () => {
  test('recognises the DynamoDB ValidationException wording', () => {
    expect(isItemTooLarge({
      message: 'Item size to update has exceeded the maximum allowed size'
    })).toBe(true)
    expect(isItemTooLarge({
      message: 'Item size has exceeded the maximum allowable size'
    })).toBe(true)
  })

  test('ignores unrelated errors', () => {
    expect(isItemTooLarge(new Error('RequestId: abc'))).toBe(false)
    expect(isItemTooLarge(undefined)).toBe(false)
    expect(isItemTooLarge({})).toBe(false)
  })
})

describe('isThrottled', () => {
  // The exact shape reported by the AWS SDK, as it appeared in the Vercel logs.
  const realThrottle = {
    name: 'ProvisionedThroughputExceededException',
    $fault: 'client',
    $metadata: { httpStatusCode: 400, attempts: 3 },
    ThrottlingReasons: [{
      reason: 'TableWriteProvisionedThroughputExceeded',
      resource: 'arn:aws:dynamodb:us-east-1:489011764402:table/ElectermCloudProdData'
    }],
    __type: 'com.amazonaws.dynamodb.v20120810#ProvisionedThroughputExceededException',
    message: 'The level of configured provisioned throughput for the table was exceeded.'
  }

  test('recognises the error that caused the opaque 500s', () => {
    expect(isThrottled(realThrottle)).toBe(true)
  })

  test('recognises it by name alone', () => {
    expect(isThrottled({
      name: 'ProvisionedThroughputExceededException'
    })).toBe(true)
  })

  test('recognises it by __type alone', () => {
    expect(isThrottled({
      __type: 'com.amazonaws.dynamodb.v20120810#ProvisionedThroughputExceededException'
    })).toBe(true)
  })

  test('recognises it by ThrottlingReasons alone', () => {
    expect(isThrottled({
      ThrottlingReasons: [{ reason: 'TableWriteProvisionedThroughputExceeded' }]
    })).toBe(true)
  })

  test('recognises the generic throttling wording', () => {
    expect(isThrottled({ message: 'Throughput exceeds the current capacity' })).toBe(true)
  })

  test('ignores unrelated errors', () => {
    expect(isThrottled(new Error('user disabled'))).toBe(false)
    expect(isThrottled(undefined)).toBe(false)
    expect(isThrottled({})).toBe(false)
    // An empty ThrottlingReasons array is not a throttle.
    expect(isThrottled({ ThrottlingReasons: [] })).toBe(false)
    // The item-size error must not be mistaken for a throttle.
    expect(isThrottled({
      message: 'Item size to update has exceeded the maximum allowed size'
    })).toBe(false)
  })
})
