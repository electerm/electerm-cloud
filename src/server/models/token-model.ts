// token-model.ts
import { Item } from 'dynamoose/dist/Item'

export interface Token extends Item {
  id: string
  userId: string
  name: string
  dataId: string
  lastUseTime: Date
  useCount: number
}

export const tokenSchema = {
  id: {
    type: String,
    hashKey: true
  },
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: 'Token noname'
  },
  dataId: {
    type: String,
    required: true
  },
  lastUseTime: {
    type: Date,
    default: () => new Date()
  },
  useCount: {
    type: Number,
    default: 0
  }
}
