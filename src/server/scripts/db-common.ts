// Shared helpers for admin db scripts.

// The destructive scripts refuse to run unless explicitly allowed, so a stray
// `npm run cdb` against prod credentials cannot wipe the database.
export function assertDestructiveOk (scriptName: string): void {
  if (process.env.ALLOW_DESTRUCTIVE !== 'true') {
    console.error(`${scriptName} is destructive and needs ALLOW_DESTRUCTIVE=true`)
    process.exit(1)
  }
}

// Human-readable description of the db the current env points at.
export function dbTargetLabel (): string {
  return process.env.DYNAMODB_ENDPOINT_URL !== undefined
    ? `local (${process.env.DYNAMODB_ENDPOINT_URL})`
    : 'AWS default credentials (PRODUCTION if those are prod creds)'
}
