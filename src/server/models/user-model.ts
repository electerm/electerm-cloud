// user-model.ts
import { Item } from 'dynamoose/dist/Item'

export interface User extends Item {
  id: string
  githubId: string
  name: string
  email: string
  githubLogin: string
  avatarUrl?: string
  tokenIds: string
  dataIds: string
  tokenLimit: number
}

export const userSchema = {
  id: {
    type: String,
    hashKey: true
  },
  name: {
    type: String
  },
  githubLogin: {
    type: String
  },
  email: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  tokenIds: {
    type: String,
    default: ''
  },
  tokenLimit: {
    type: Number,
    default: 3
  },
  dataIds: {
    type: String,
    default: ''
  }
}

export const userSchemaOptions = {
  timestamps: true
}
