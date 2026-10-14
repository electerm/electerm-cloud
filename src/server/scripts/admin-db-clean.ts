// Cleans orphaned records directly in DynamoDB:
//   - deletes users without tokens
//   - deletes tokens not referenced by any remaining user
//   - deletes data records not referenced by any remaining user
//   - recomputes the userCount / tokenCount statics
//
// Usage:
//   ALLOW_DESTRUCTIVE=true npm run cl
//
// Targets whatever db the env points at (local when DYNAMODB_ENDPOINT_URL is
// set, otherwise the AWS default credentials - make sure those are the ones
// you intend).

import {
  UserModel,
  TokenModel,
  DataModel,
  StaticsModel
} from '../models/db'
import { assertDestructiveOk, dbTargetLabel } from './db-common'

async function cleanDb (): Promise<void> {
  assertDestructiveOk('admin-db-clean')
  console.log('db target:', dbTargetLabel())

  const users = await UserModel.scan().exec()
  const usersToDelete: string[] = []
  const validUsers: any[] = []
  for (const user of users) {
    const userTokenIds = user.tokenIds.split(',').filter(t => t !== '')
    if (userTokenIds.length === 0) {
      usersToDelete.push(user.id)
      console.log('User without tokens to be deleted:', user.id)
    } else {
      validUsers.push(user)
    }
  }
  const tokenIds = validUsers.reduce((acc: string[], user: any) => {
    return acc.concat(user.tokenIds.split(',').filter((t: string) => t !== ''))
  }, [])
  const dataIds = validUsers.reduce((acc: string[], user: any) => {
    return acc.concat(user.dataIds.split(',').filter((d: string) => d !== ''))
  }, [])
  console.log('tokenIds', tokenIds)
  console.log('dataIds', dataIds)

  const tokens = await TokenModel.scan().exec()
  let tokenCount = tokens.length
  const userCount = validUsers.length
  console.log('valid user count', userCount)
  console.log('users to delete count', usersToDelete.length)

  // Delete users without tokens first
  for (const userId of usersToDelete) {
    console.log('deleting user id', userId)
    await UserModel.delete(userId).catch((err: Error) => {
      console.log(err.message)
    })
  }

  const tokensToDel: string[] = []
  for (const token of tokens) {
    console.log('token id', token.id)
    if (!tokenIds.includes(token.id)) {
      tokensToDel.push(token.id)
      tokenCount--
    }
  }
  console.log('token count', tokenCount)
  for (const id of ['userCount', 'tokenCount']) {
    const value = id === 'userCount' ? userCount : tokenCount
    await StaticsModel.update({ id }, { value }).catch((err: Error) => {
      console.log(err.message)
    })
  }
  for (const tokenId of tokensToDel) {
    console.log('deleting token id', tokenId)
    await TokenModel.delete(tokenId).catch((err: Error) => {
      console.log(err.message)
    })
  }

  const datas = await DataModel.scan().exec()
  console.log('datas count', datas.length)

  // Clean up orphaned data (data not referenced by valid users)
  for (const data of datas) {
    if (!dataIds.includes(data.id)) {
      console.log('deleting orphaned data id', data.id)
      await DataModel.delete(data.id).catch((err: Error) => {
        console.log(err.message)
      })
    }
  }
}

cleanDb()
  .then(() => console.log('Script completed.'))
  .catch((err: Error) => {
    console.error('Something went wrong:', err.message)
    process.exit(1)
  })
