import { UserModel, DataModel, TokenModel } from '../models/db'
import { User } from '../models/user-model'

export async function listUsers (start: string, limit: number): Promise<Object> {
  const users = await UserModel
    .scan()
    .startAt({
      id: start
    })
    .limit(limit)
    .exec()
  return {
    users,
    count: users.count,
    lastKey: users.lastKey
  }
}

export async function delUser (userId: string): Promise<void> {
  const user = await UserModel.get(userId)
  await DataModel.batchDelete(user.dataIds.split(','))
  await TokenModel.batchDelete(user.tokenIds.split(','))
  return await UserModel.delete(userId)
}

enum Status {
  Active = 'active',
  Disabled = 'disabled'
}

interface Update {
  tokenLimit?: number
  status?: Status
}

function validate (update: Update): void {
  if (
    typeof update.tokenLimit !== 'number' ||
    update.tokenLimit < 1 ||
    update.tokenLimit > 100
  ) {
    throw new Error('Limit must be between 1 and 100.')
  }
}

export async function updateUser (id: string, update: Update): Promise<User> {
  validate(update)
  return await UserModel.update({ id }, update)
}
