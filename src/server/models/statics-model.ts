// data-model.ts

import { Item } from 'dynamoose/dist/Item'

export interface Statics extends Item {
  id: string
  value: number
}

export const staticsSchema = {
  id: {
    type: String,
    hashKey: true
  },
  value: {
    type: Number
  }
}
