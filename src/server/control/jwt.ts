import { VercelRequest, VercelResponse } from '@vercel/node'
import jwt, { SignOptions } from 'jsonwebtoken'
import { UserModel, AdminUserModel } from '../models/db'
import { User } from '../models/user-model'
import { AdminUser } from '../models/admin-user-model'
import { checkCsrf, getSessionToken } from './session'

interface JwtPayload {
  id: string
}

// Browser channel: httpOnly session cookie.
// Desktop / API / legacy-web channel: Authorization header.
// Either one authenticates; the desktop client has no cookie jar, so the
// header path must keep working forever.
function extractAuth (req: VercelRequest): { token: string, fromCookie: boolean } {
  const cookieToken = getSessionToken(req)
  if (cookieToken !== '') {
    return { token: cookieToken, fromCookie: true }
  }
  const authHeader = req.headers.authorization
  if (typeof authHeader !== 'string' || authHeader === '') {
    return { token: '', fromCookie: false }
  }
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[1] === '') {
    return { token: '', fromCookie: false }
  }
  return { token: parts[1], fromCookie: false }
}

// Fail hard: a missing secret would let anyone forge HS256 tokens signed with
// an empty key. Existing tokens stay valid - this only guards the unset case.
function getJwtSecret (): string {
  const secret = process.env.JWT_SECRET
  if (secret === undefined || secret === '') {
    throw new Error('JWT_SECRET env is required')
  }
  return secret
}

const jwtSecret: string = getJwtSecret()

// Keep the historical default so tokens already issued to users/apps keep
// working; set JWT_EXPIRES_IN to shorten the lifetime for new tokens.
const expiresIn = (process.env.JWT_EXPIRES_IN ?? '120y') as SignOptions['expiresIn']

export async function verifyJwtAndCheckId (req: VercelRequest, res: VercelResponse, isAdmin: boolean = false): Promise<User | AdminUser | null> {
  try {
    const { token, fromCookie } = extractAuth(req)
    if (token === '') {
      res.status(401).send('No session cookie or authorization header found')
      return null
    }
    if (fromCookie && !checkCsrf(req, res)) {
      return null
    }

    const decodedPayload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256']
    }) as JwtPayload
    const { id } = decodedPayload
    const Cls = isAdmin ? AdminUserModel : UserModel
    const user = await Cls.get({ id })
    if (user === undefined || user === null) {
      res.status(401).send('JWT: User not found')
      return null
    }

    return user
  } catch (error) {
    // Do not leak why verification failed (expired vs forged vs malformed)
    console.error('JWT verification error:', error)
    res.status(401).send('JWT verification failed')
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
      expiresIn,
      algorithm: 'HS256'
    }
  )
}

export function decode (code: string): string {
  const decodedPayload = jwt.verify(code, jwtSecret, {
    algorithms: ['HS256']
  }) as JwtPayload
  const { id } = decodedPayload
  return id
}

export async function verifyJwt (req: VercelRequest, res: VercelResponse): Promise<string | null> {
  try {
    const { token, fromCookie } = extractAuth(req)
    if (token === '') {
      res.status(401).send('No session cookie or authorization header found')
      return null
    }
    if (fromCookie && !checkCsrf(req, res)) {
      return null
    }
    return decode(token)
  } catch (error) {
    console.error('JWT verification error:', error)
    res.status(401).send('JWT verification failed')
    return null
  }
}
