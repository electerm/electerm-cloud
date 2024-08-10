import { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'
import { UserModel, AdminUserModel } from '../models/db'
import { User } from '../models/user-model'
import { AdminUser } from '../models/admin-user-model'

interface JwtPayload {
  id: string
}

const jwtSecret = process.env.JWT_SECRET ?? ''

export async function verifyJwtAndCheckId (req: VercelRequest, res: VercelResponse, isAdmin: boolean = false): Promise<User | AdminUser | null> {
  try {
    const authHeader = req.headers.authorization

    if (authHeader === undefined || authHeader === '') {
      res.status(401).send('No authorization header found')
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2) {
      res.status(401).send('JWT: Invalid authorization header format')
      return null
    }

    const token = parts[1]
    if (token === '') {
      res.status(401).send('JWT: No token found in the authorization header')
      return null
    }

    const decodedPayload = jwt.verify(token, jwtSecret) as JwtPayload
    const { id } = decodedPayload
    const Cls = isAdmin ? AdminUserModel : UserModel
    const user = await Cls.get({ id })
    if (user === undefined || user === null) {
      res.status(401).send('JWT: User not found')
      return null
    }

    return user
  } catch (error) {
    console.error('JWT verification error:', error)
    res.status(500).send('JWT verification error:' + (error as Error).message)
    return null
  }
}

export function sign (id: string): string {
  return jwt.sign(
    {
      id
    },
    jwtSecret,
    {
      expiresIn: '120y',
      algorithm: 'HS256'
    }
  )
}

export function decode (code: string): string {
  // console.log('code, jwtSecret', code, jwtSecret)
  const decodedPayload = jwt.verify(code, jwtSecret) as JwtPayload
  const { id } = decodedPayload
  return id
}

export async function verifyJwt (req: VercelRequest, res: VercelResponse): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization
    if (authHeader === undefined || authHeader === '') {
      res.status(401).send('No authorization header found')
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2) {
      res.status(401).send('JWT: Invalid authorization header format')
      return null
    }

    const token = parts[1]
    if (token === '') {
      res.status(401).send('JWT: No token found in the authorization header')
      return null
    }
    return decode(token)
  } catch (error) {
    res.status(500).send('JWT verification error:' + (error as Error).message)
    return null
  }
}
