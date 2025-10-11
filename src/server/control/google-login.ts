// google-login-handler.ts
import axios from 'axios'
import { UserModel } from '../models/db'
import { User } from '../models/user-model'
import { createToken } from './token'
import { createData } from './data-control'
import { updateStatics } from './statics'

interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
}

const clientId = process.env.CLIENT_ID_GOOGLE
const secret = process.env.CLIENT_SECRET_GOOGLE

async function getGoogleAccessToken (code: string): Promise<string> {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: clientId,
    client_secret: secret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? 'http://127.0.0.1:5678/api/google-login-callback'
  }, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  return response.data.access_token
}

async function getGoogleUser (accessToken: string): Promise<GoogleUser> {
  const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return response.data
}

async function findOrCreateUser (googleUser: GoogleUser): Promise<User> {
  // Try to find the user by Google ID
  const id = 'google-' + googleUser.id
  let user = await UserModel.get({ id })
  if (user === undefined || user === null) {
    // If user doesn't exist, create a new one
    const data = await createData('{}', id)
    const token = await createToken(id, data.id)
    user = await UserModel.create({
      id,
      name: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.id,
      avatarUrl: googleUser.picture,
      tokenIds: token.id,
      dataIds: data.id
    })
    await updateStatics('userCount', 1)
    await updateStatics('tokenCount', 1)
    return user
  } else {
    // Update user info if changed
    if (user.googleAccountEmail !== googleUser.email || user.name !== googleUser.name || user.avatarUrlGoogle !== googleUser.picture) {
      await UserModel.update({ id }, {
        name: googleUser.name,
        googleId: googleUser.id,
        email: googleUser.email,
        avatarUrl: googleUser.picture
      })
    }
    return user
  }
}

export async function handleGoogleLogin (code: string): Promise<User> {
  const accessToken = await getGoogleAccessToken(code)
  const googleUser = await getGoogleUser(accessToken)
  return await findOrCreateUser(googleUser)
}
