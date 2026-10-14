// Initializes the Statics records directly in DynamoDB.
//
// Usage:
//   npm run st              # local db by default; for prod set prod AWS_* creds
//                            # in .env and unset DYNAMODB_ENDPOINT_URL

import { StaticsModel } from '../models/db'

const initialStaticsData = [
  { id: 'userCount', value: 4 },
  { id: 'tokenCount', value: 5 },
  { id: 'tokenUseCount', value: 13 }
  // Add any other initial statics you want to track
]

async function initStaticsDb (): Promise<void> {
  console.log('Starting Statics database initialization...')
  for (const staticData of initialStaticsData) {
    try {
      await StaticsModel.create(staticData)
      console.log(`Created Statics entry: ${staticData.id}`)
    } catch (err) {
      // already exists is fine, keep going
      console.error(`Error creating Statics entry ${staticData.id}:`, (err as Error).message)
    }
  }
  console.log('Statics database initialization completed.')
}

initStaticsDb()
  .then(() => console.log('Script completed.'))
  .catch((err: Error) => {
    console.error('Something went wrong:', err.message)
    process.exit(1)
  })
