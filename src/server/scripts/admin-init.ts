// Creates the admin user record directly in DynamoDB.
//
// Usage:
//   npm run init            # local db (DYNAMODB_ENDPOINT_URL set in .env)
//   # for prod: set prod AWS_* creds in .env and unset DYNAMODB_ENDPOINT_URL

import { AdminUserModel } from '../models/db'

const adminGithubLogin = process.env.ADMIN_GITHUB_LOGIN

async function initAdminUser (): Promise<void> {
  if (adminGithubLogin === undefined || adminGithubLogin === '') {
    throw new Error('ADMIN_GITHUB_LOGIN env is required')
  }
  const adminUserData = {
    id: `github-${adminGithubLogin}`,
    name: adminGithubLogin,
    githubLogin: adminGithubLogin,
    email: `${adminGithubLogin}@example.com`, // set a real email if needed
    avatarUrl: '',
    githubId: '0'
  }
  await AdminUserModel.create(adminUserData)
  console.log('Admin user created successfully:', adminUserData.id)
}

initAdminUser()
  .then(() => console.log('Script completed.'))
  .catch((err: Error) => {
    console.error('Something went wrong:', err.message)
    process.exit(1)
  })
