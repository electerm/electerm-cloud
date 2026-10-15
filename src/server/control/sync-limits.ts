/**
 * Upload limits for the sync API, in one place so the reject path, the warning
 * path and the client-side pre-check cannot drift apart.
 *
 * Two ceilings are in play, and compressing the payload moved only one of them:
 *
 *   1. Raw payload size. Checked *before* anything is encrypted, so it bounds
 *      the work a single request can force the server to do (the whole body is
 *      held in memory, then gzipped, then base64'd). Unaffected by gzip.
 *   2. Stored item size. This is the *compressed* payload, base64'd. DynamoDB
 *      charges 1 WCU per KB of it and caps it at 400KB. gzip cut this by ~14x
 *      on a real bookmark payload (188KB -> 11KB), which is why syncs stopped
 *      being throttled.
 *
 * Because ceiling 1 sits in front of ceiling 2, the largest document a user
 * can sync is still MAX_SYNC_PAYLOAD — compression made the *write* cheap, not
 * the *upload* bigger. Raise this number to raise the document size.
 */

import { gzipSync } from 'zlib'

// DynamoDB caps a stored item at 400KB. Two layers inflate the payload: the
// electerm client hex-encodes bookmarks/profiles when a sync password is set
// (~2x), and the server re-encrypts at rest (gzip + base64, ~1.37x). 280KB
// leaves headroom under the 400KB item cap in every combination.
export const MAX_SYNC_PAYLOAD = 280 * 1024

export const MAX_SYNC_PAYLOAD_KB = MAX_SYNC_PAYLOAD / 1024

// Warn once a payload is this close to the cap, so the client can say
// something useful before the upload is refused outright.
export const SYNC_WARN_RATIO = 0.8

export const TOO_LARGE_MSG =
  `sync data too large, max ${MAX_SYNC_PAYLOAD_KB}KB`

/**
 * Byte length of the JSON body the client actually sends. Not `String.length`:
 * bookmark titles, hostnames and passwords are routinely non-ASCII, and the
 * wire is UTF-8.
 */
export function payloadBytes (payload: string): number {
  return Buffer.byteLength(payload, 'utf8')
}

/**
 * Exact stored-item size for a payload, without touching the database.
 *
 * Mirrors enc(): gzip when it wins, base64, plus the 'g3:'/'g2:' marker and
 * the 16-byte GCM tag. Attribute overhead is DynamoDB's 100 bytes per item
 * plus id (2+21) + userId (6+21) + iv (2+24) + salt (4+32) + the 'data'
 * attribute name (4) = 116.
 */
export function storedItemBytes (payload: string): number {
  const raw = Buffer.from(payload, 'utf8')
  const gz = gzipSync(raw).length
  const body = gz < raw.length ? gz : raw.length
  // data value = marker(3) + base64(body) + base64(16-byte tag = 24 chars)
  return 216 + 3 + Math.ceil(body / 3) * 4 + 24
}

/**
 * DynamoDB rejects oversized items with a ValidationException whose message
 * mentions the item size. Matched on message text only — the error class
 * differs between the raw SDK and dynamoose's wrappers.
 */
export function isItemTooLarge (e: unknown): boolean {
  const msg = String((e as { message?: unknown })?.message ?? '')
  return /item size|maximum allowable|too large/i.test(msg)
}

/**
 * The table is provisioned (not on-demand), so a write larger than the
 * provisioned capacity — or one that arrives before the burst bucket has
 * refilled — comes back as ProvisionedThroughputExceededException. On its own
 * that surfaces as an opaque platform 500, which is what made this look like a
 * random sync failure. Recognise it so the caller can answer with something a
 * user can act on.
 */
export function isThrottled (e: unknown): boolean {
  const err = e as {
    name?: unknown
    __type?: unknown
    ThrottlingReasons?: unknown
    message?: unknown
  }
  const name = String(err?.name ?? '')
  const type = String(err?.__type ?? '')
  if (name === 'ProvisionedThroughputExceededException') {
    return true
  }
  if (type.includes('ProvisionedThroughputExceeded')) {
    return true
  }
  if (Array.isArray(err?.ThrottlingReasons) && err.ThrottlingReasons.length > 0) {
    return true
  }
  return /provisioned throughput|throughput exceeds|throttl/i.test(
    String(err?.message ?? '')
  )
}
