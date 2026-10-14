// Creates test users directly in DynamoDB.
//
// Usage:
//   npm run adu             # local db by default; for prod set prod AWS_* creds
//                            # in .env and unset DYNAMODB_ENDPOINT_URL

import { UserModel } from '../models/db'

const generateUserData = (index: number): Object => {
  const username = `testuser_${index}`
  return {
    id: `github-${username}`,
    name: username,
    email: `${username}@example.com`,
    githubId: username,
    githubLogin: username,
    avatarUrl: 'https://avatars.githubusercontent.com/u/123456789'
  }
}

async function populateUsers (count = 30): Promise<void> {
  console.log('Starting user creation...')
  for (let i = 0; i < count; i++) {
    const userData = generateUserData(i + 1)
    try {
      await UserModel.create(userData)
      console.log('succeed', i + 1)
    } catch (err) {
      console.log((err as Error).message)
    }
  }
  console.log(`Completed! Created ${count} users.`)
}

populateUsers()
  .then(() => console.log('Script completed.'))
  .catch((err: Error) => {
    console.error('Something went wrong:', err.message)
    process.exit(1)
  })
