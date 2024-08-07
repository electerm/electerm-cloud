// token-control.ts

import { nanoid } from 'nanoid'
import { TokenModel, UserModel, DataModel } from '../models/db'
import { User } from '../models/user-model'
import { Token } from '../models/token-model'
import { sign } from './jwt'
import { createData } from './data-control'

export async function createToken (userId: string, dataId: string): Promise<Token> {
  return await TokenModel.create({
    id: nanoid(),
    userId,
    useCount: 0,
    dataId,
    lastUseTime: new Date()
  })
}

export async function newToken (user: User, userId: string): Promise<Token> {
  const data = await createData('{}', userId)
  const token = await TokenModel.create({
    id: nanoid(),
    userId,
    useCount: 0,
    dataId: data.id,
    lastUseTime: new Date()
  })
  await UserModel.update({ id: user.id }, {
    tokenIds: user.tokenIds.split(',').concat([token.id]).join(','),
    dataIds: user.dataIds.split(',').concat([data.id]).join(',')
  })
  return token
}

export async function getToken (id: string): Promise<Token> {
  const token = await TokenModel.get({
    id
  })
  await TokenModel.update({ id }, {
    lastUseTime: new Date(),
    useCount: token.useCount + 1
  })
  return token
}

export async function listTokens (ids: string[]): Promise<Object[]> {
  const arr = await TokenModel.batchGet(ids, {
    attributes: ['id', 'lastUseTime', 'useCount', 'dataId']
  })
  return arr.map(d => {
    return {
      id: sign(d.id),
      lastUseTime: d.lastUseTime,
      useCount: d.useCount,
      dataId: d.dataId
    }
  })
}

export async function delToken (id: string, user: User): Promise<void> {
  const token = await TokenModel.get(id)
  await DataModel.delete(token.dataId)
  const newTokenIds = user.tokenIds.split(',').filter(d => d !== id).join(',')
  const newDataIds = user.dataIds.split(',').filter(d => d !== token.dataId).join(',')
  await UserModel.update({ id: user.id }, {
    tokenIds: newTokenIds,
    dataIds: newDataIds
  })
  await TokenModel.delete(id)
}

export async function reToken (id: string, user: User): Promise<Object> {
  const token = await TokenModel.get(id)
  await TokenModel.delete(id)
  const obj = await createToken(token.userId, token.dataId)
  const newTokenIds = user.tokenIds.replace(id, obj.id)
  await UserModel.update({ id: user.id }, {
    tokenIds: newTokenIds
  })
  return {
    id: sign(obj.id),
    lastUseTime: obj.lastUseTime,
    useCount: obj.useCount,
    dataId: obj.dataId
  }
}
