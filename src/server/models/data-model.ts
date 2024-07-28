// data-model.ts

import { Item } from 'dynamoose/dist/Item'

export interface Data extends Item {
  id: string
  iv: string
  data: string
}

export const dataSchema = {
  id: {
    type: String,
    hashKey: true
  },
  data: {
    type: String
  },
  iv: {
    type: String
  }
}
