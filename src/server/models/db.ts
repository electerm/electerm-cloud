// db.ts

import * as dynamoose from 'dynamoose'
import { User, userSchema } from './user-model'
import { Token, tokenSchema } from './token-model'
import { Data, dataSchema } from './data-model'

// Common schema options
const commonSchemaOptions = {
  timestamps: true
}

const tableNamePrefix = process.env.DYNAMO_TABLE_PREFIX ?? 'ElectermCloud'

// Create schemas
const userSchemaInstance = new dynamoose.Schema(userSchema, commonSchemaOptions)
const tokenSchemaInstance = new dynamoose.Schema(tokenSchema, commonSchemaOptions)
const dataSchemaInstance = new dynamoose.Schema(dataSchema, commonSchemaOptions)

// Create and export models
export const UserModel = dynamoose.model<User>('User', userSchemaInstance, {
  tableName: tableNamePrefix + 'User'
})
export const TokenModel = dynamoose.model<Token>('Token', tokenSchemaInstance, {
  tableName: tableNamePrefix + 'Token'
})
export const DataModel = dynamoose.model<Data>('Data', dataSchemaInstance, {
  tableName: tableNamePrefix + 'Data'
})
