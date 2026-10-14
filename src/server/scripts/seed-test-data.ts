// Seeds a local DynamoDB with the data integration tests need.
// Everything is idempotent - safe to re-run.
//
// Creates:
//   - AdminUser  github-<ADMIN_GITHUB_LOGIN>     (for /api/admin)
//   - Statics    userCount / tokenCount / tokenUseCount
//   - User + Data + Token, where the Token id is decoded from the TEST_TOKEN
//     JWT in .env (so tests/e2e/sync.spec.js can authenticate with it)
//
// Usage:
//   npm run seed

import { decode } from '../control/jwt'
import {
  AdminUserModel,
  UserModel,
  TokenModel,
  DataModel,
  StaticsModel
} from '../models/db'

const adminGithubLogin = process.env.ADMIN_GITHUB_LOGIN
const testToken = process.env.TEST_TOKEN

const e2eUserId = 'test-user-e2e'
const e2eDataId = 'test-data-e2e'

function exists<T> (item: T | undefined | null): item is T {
  return item !== undefined && item !== null
}

async function ensureAdminUser (): Promise<void> {
  if (adminGithubLogin === undefined || adminGithubLogin === '') {
    throw new Error('ADMIN_GITHUB_LOGIN env is required')
  }
  const id = `github-${adminGithubLogin}`
  if (exists(await AdminUserModel.get(id))) {
    console.log('admin user exists:', id)
    return
  }
  await AdminUserModel.create({
    id,
    name: adminGithubLogin,
    githubLogin: adminGithubLogin,
    email: `${adminGithubLogin}@example.com`,
    avatarUrl: '',
    githubId: '0'
  })
  console.log('admin user created:', id)
}

async function ensureStatics (): Promise<void> {
  const rows: Array<[string, number]> = [
    ['userCount', 1],
    ['tokenCount', 1],
    ['tokenUseCount', 0]
  ]
  for (const [id, value] of rows) {
    if (exists(await StaticsModel.get(id))) {
      console.log('statics exists:', id)
      continue
    }
    await StaticsModel.create({ id, value })
    console.log('statics created:', id)
  }
}

async function ensureTestUser (tokenId: string): Promise<void> {
  if (exists(await UserModel.get(e2eUserId))) {
    console.log('test user exists:', e2eUserId)
  } else {
    await UserModel.create({
      id: e2eUserId,
      name: 'test user e2e',
      githubId: 'e2e',
      githubLogin: 'e2e-user',
      email: 'e2e@example.com',
      avatarUrl: '',
      tokenIds: tokenId,
      dataIds: e2eDataId,
      tokenLimit: 10,
      status: 'active'
    })
    console.log('test user created:', e2eUserId)
  }

  if (exists(await DataModel.get(e2eDataId))) {
    console.log('test data exists:', e2eDataId)
  } else {
    await DataModel.create({
      id: e2eDataId,
      userId: e2eUserId,
      data: '{}',
      iv: '',
      salt: ''
    })
    console.log('test data created:', e2eDataId)
  }

  if (exists(await TokenModel.get(tokenId))) {
    console.log('test token exists:', tokenId)
  } else {
    await TokenModel.create({
      id: tokenId,
      userId: e2eUserId,
      name: 'e2e-token',
      dataId: e2eDataId,
      useCount: 0,
      lastUseTime: new Date()
    })
    console.log('test token created:', tokenId)
  }
}

async function seed (): Promise<void> {
  if (testToken === undefined || testToken === '' || !testToken.startsWith('ey')) {
    throw new Error('TEST_TOKEN env must be a JWT (used as the e2e user sync token)')
  }
  const tokenId = decode(testToken)
  await ensureAdminUser()
  await ensureStatics()
  await ensureTestUser(tokenId)
}

seed()
  .then(() => console.log('Script completed.'))
  .catch((err: Error) => {
    console.error('Something went wrong:', err.message)
    process.exit(1)
  })
