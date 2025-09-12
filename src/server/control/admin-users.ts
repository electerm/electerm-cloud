import { UserModel, DataModel, TokenModel } from '../models/db'
import { User } from '../models/user-model'

function formatUser (user: User): Object {
  return {
    id: user.id,
    name: user.name,
    tokenLimit: user.tokenLimit,
    tokensCount: user.tokenIds.split(',').filter(t => t !== '').length,
    email: user.email,
    githubLogin: user.githubLogin,
    avatarUrl: user.avatarUrl,
    status: user.status
  }
}

export async function listUsers (start: string, limit: number, id: string): Promise<Object> {
  if (id !== '') {
    const user = await UserModel.get(id)
    return {
      user: formatUser(user)
    }
  }
  const users = start === ''
    ? await UserModel
      .scan()
      .limit(limit)
      .exec()
    : await UserModel
      .scan()
      .startAt({
        id: start
      })
      .limit(limit)
      .exec()
  return {
    users: users.map((user: User) => {
      return formatUser(user)
    }),
    count: users.count,
    lastKey: users.lastKey
  }
}

export async function delUser (userId: string): Promise<void> {
  const user = await UserModel.get(userId)
  if (user.dataIds !== '') {
    await DataModel.batchDelete(
      user.dataIds.split(',').filter(d => d !== '')
    )
  }
  if (user.tokenIds !== '') {
    await TokenModel.batchDelete(
      user.tokenIds.split(',').filter(t => t !== '')
    )
  }
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
