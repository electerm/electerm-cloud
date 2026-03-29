// data-model.ts

import { Item } from 'dynamoose/dist/Item'

export interface Data extends Item {
  id: string
  iv: string
  salt: string
  userId: string
  data: string
}

export const dataSchema = {
  id: {
    type: String,
    hashKey: true
  },
  data: {
    type: String,
    default: '{}'
  },
  userId: {
    type: String
  },
  iv: {
    type: String
  },
  salt: {
    type: String
  }
}
