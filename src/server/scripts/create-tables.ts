// Creates the 5 DynamoDB tables (hash key: id) on a LOCAL DynamoDB.
// Refuses to run unless DYNAMODB_ENDPOINT_URL is set, so it can never be
// pointed at the production AWS database by accident.
//
// Usage:
//   npm run ct

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb'

if (process.env.DYNAMODB_ENDPOINT_URL === undefined) {
  console.error('DYNAMODB_ENDPOINT_URL is not set. This script only creates tables on a local DynamoDB.')
  process.exit(1)
}

const prefix = process.env.DYNAMO_TABLE_PREFIX ?? 'ElectermCloud'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local'
  }
})

// table name suffix -> model table, same as src/server/models/db.ts
const tables = [
  'User',
  'AdminUser',
  'Token',
  'Data',
  'Statics'
]

async function tableExists (name: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }))
    return true
  } catch (err) {
    if ((err as Error).name === 'ResourceNotFoundException') {
      return false
    }
    throw err
  }
}

async function createTables (): Promise<void> {
  for (const table of tables) {
    const name = prefix + table
    if (await tableExists(name)) {
      console.log(`table exists: ${name}`)
      continue
    }
    await client.send(new CreateTableCommand({
      TableName: name,
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }))
    console.log(`table created: ${name}`)
  }
}

createTables()
  .then(() => console.log('Script completed.'))
  .catch((err: Error) => {
    console.error('Something went wrong:', err.message)
    process.exit(1)
  })
