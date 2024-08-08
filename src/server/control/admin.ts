import {
  AdminUserModel,
  UserModel,
  TokenModel,
  DataModel
} from '../models/db'

const models = {
  AdminUser: AdminUserModel,
  User: UserModel,
  Token: TokenModel,
  Data: DataModel
}

async function clearDb (Model: typeof AdminUserModel | typeof UserModel | typeof TokenModel | typeof DataModel): Promise<any> {
  const allItems = await Model.scan().attributes(['id']).exec()
  const ids = allItems.map(item => item.id)
  return await Model.batchDelete(ids)
}

export async function dbOperation (tableName: string, func: string, params: any[]): Promise<any> {
  const Model = models[tableName as keyof typeof models]

  if (Model === undefined) {
    throw new Error(`Invalid table name: ${tableName}`)
  }

  switch (func) {
    case 'create':
      return await (Model as typeof AdminUserModel).create(params[0])
    case 'get':
      return await Model.get(params[0])
    case 'update':
      return (Model as typeof AdminUserModel).update(params[0], params[1])
    case 'delete':
      return Model.delete(params[0])
    case 'list':
      return await Model.scan().exec()
    case 'clear':
      return await clearDb(Model)
    default:
      throw new Error(`Invalid function: ${func}`)
  }
}
