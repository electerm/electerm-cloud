// user-model.ts
import { AdminUser, adminUserSchema } from './admin-user-model'

export interface User extends AdminUser {
  tokenIds: string
  dataIds: string
  tokenLimit: number
  status: string
}

export const userSchema = Object.assign({}, adminUserSchema, {
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
  },
  tokenIds: {
    type: String,
    default: ''
  },
  tokenLimit: {
    type: Number,
    default: 1
  },
  dataIds: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'active'
  }
})
