// user-model.ts
import { Item } from 'dynamoose/dist/Item'

export interface AdminUser extends Item {
  id: string
  name: string
  githubId: string
  email: string
  githubLogin: string
  avatarUrl?: string
}

export const adminUserSchema = {
  id: {
    type: String,
    hashKey: true
  },
  name: {
    type: String
  },
  githubId: {
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
  }
}
