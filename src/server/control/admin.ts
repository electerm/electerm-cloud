import {
  AdminUserModel
} from '../models/db'

export async function dbOperation (func: string, params: any[]): Promise<any> {
  // Perform the requested operation
  switch (func) {
    case 'create':
      return await AdminUserModel.create(params[0])

    case 'get':
      return await AdminUserModel.get(params[0])

    case 'update':
      return AdminUserModel.update(params[0], params[1])

    case 'delete':
      return AdminUserModel.delete(params[0])

    case 'list':
      return AdminUserModel.scan()

    default:
      throw new Error(`Invalid function: ${func}`)
  }
}
