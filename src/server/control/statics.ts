// statics.ts

import { StaticsModel } from '../models/db'
import { Statics } from '../models/statics-model'

interface StaticResult {
  [key: string]: number
}

export async function getStatics (id: string): Promise<number> {
  const statics = await StaticsModel.get(id)
  return statics.value
}

export async function updateStatics (id: string, value: number): Promise<void> {
  const inst = await StaticsModel.get(id)
  if (inst === undefined) {
    await StaticsModel.create({
      id,
      value
    })
    return
  }
  await StaticsModel.update(
    { id },
    {
      value: inst.value + value
    }
  )
}

export async function getAllStatics (): Promise<Object> {
  const allStats = await StaticsModel.scan().exec()
  return allStats.reduce((acc: StaticResult, stat: Statics) => {
    acc[stat.id] = stat.value
    return acc
  }, {})
}
