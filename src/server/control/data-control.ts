import { DataModel } from '../models/db'
import { Data } from '../models/data-model'
import { nanoid } from 'nanoid'
import { enc, dec } from './enc'

export async function createData (data: string, userId: string): Promise<Data> {
  const { encrypted, iv } = await enc(data)
  return await DataModel.create({
    id: nanoid(),
    data: encrypted,
    userId,
    iv
  })
}

export async function getData (id: string): Promise<{ id: string, data: string, userId: string }> {
  const data = await DataModel.get(id)
  if (data.data !== '{}') {
    const decryptedData = await dec(data.data, data.iv)
    data.data = decryptedData
  }
  return {
    id: data.id,
    data: data.data,
    userId: data.userId
  }
}

export async function updateData (id: string, data: string): Promise<string> {
  const { encrypted, iv } = await enc(data)
  await DataModel.update({
    id
  }, {
    data: encrypted,
    iv
  })
  return 'ok'
}
