// Wipes all records from every table (AdminUser, User, Token, Data).
//
// Usage:
//   ALLOW_DESTRUCTIVE=true npm run cdb

import {
  AdminUserModel,
  UserModel,
  TokenModel,
  DataModel
} from '../models/db'
import { assertDestructiveOk, dbTargetLabel } from './db-common'

const tables: Array<[string, any]> = [
  ['AdminUser', AdminUserModel],
  ['User', UserModel],
  ['Token', TokenModel],
  ['Data', DataModel]
]

async function clear (): Promise<void> {
  assertDestructiveOk('admin-clear-db')
  console.log('db target:', dbTargetLabel())
  for (const [name, Model] of tables) {
    const allItems = await Model.scan().attributes(['id']).exec()
    const ids = allItems.map((item: any) => item.id) as string[]
    await Model.batchDelete(ids)
    console.log(`cleared ${name}: ${ids.length} records`)
  }
}

clear()
  .then(() => console.log('Script completed.'))
  .catch((err: Error) => {
    console.error('Something went wrong:', err.message)
    process.exit(1)
  })
