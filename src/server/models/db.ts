// db.ts

import * as dynamoose from 'dynamoose'
import { User, userSchema } from './user-model'
import { AdminUser, adminUserSchema } from './admin-user-model'
import { Token, tokenSchema } from './token-model'
import { Data, dataSchema } from './data-model'
import { Statics, staticsSchema } from './statics-model'

// Common schema options
const commonSchemaOptions = {
  timestamps: true
}

const tableNamePrefix = process.env.DYNAMO_TABLE_PREFIX ?? 'ElectermCloud'

// Create schemas
const userSchemaInstance = new dynamoose.Schema(userSchema, commonSchemaOptions)
const userAdminSchemaInstance = new dynamoose.Schema(adminUserSchema, commonSchemaOptions)
const tokenSchemaInstance = new dynamoose.Schema(tokenSchema, commonSchemaOptions)
const dataSchemaInstance = new dynamoose.Schema(dataSchema, commonSchemaOptions)

// Create and export models
export const UserModel = dynamoose.model<User>('User', userSchemaInstance, {
  tableName: tableNamePrefix + 'User'
})
export const AdminUserModel = dynamoose.model<AdminUser>('AdminUser', userAdminSchemaInstance, {
  tableName: tableNamePrefix + 'AdminUser'
})
export const TokenModel = dynamoose.model<Token>('Token', tokenSchemaInstance, {
  tableName: tableNamePrefix + 'Token'
})
export const DataModel = dynamoose.model<Data>('Data', dataSchemaInstance, {
  tableName: tableNamePrefix + 'Data'
})
export const StaticsModel = dynamoose.model<Statics>('Statics', staticsSchema, {
  tableName: tableNamePrefix + 'Statics'
})
