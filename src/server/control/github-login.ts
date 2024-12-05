// github-login-handler.ts
import axios from 'axios'
import { UserModel, AdminUserModel } from '../models/db'
import { User } from '../models/user-model'
import { AdminUser } from '../models/admin-user-model'
import { createToken } from './token'
import { createData } from './data-control'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { updateStatics } from './statics'

axios.defaults.proxy = false

interface GitHubUser {
  id: string
  login: string
  name: string
  email: string | null | undefined
  avatar_url: string
}

const clientId = process.env.CLIENT_ID
const secret = process.env.CLIENT_SECRET
const adminLogin = process.env.ADMIN_GITHUB_LOGIN

function extendOptions (): undefined | { httpsAgent: any } {
  const proxy = process.env.PROXY ?? false
  if (proxy === false) {
    return
  }
  const proxyStr = 'socks5://127.0.0.1:1080' // Replace with your SOCKS5 proxy details
  // const httpAgent = new SocksProxyAgent(proxyStr)
  const httpsAgent = new SocksProxyAgent(proxyStr)
  return { httpsAgent }
}

async function getGitHubAccessToken (code: string): Promise<string> {
  const response = await axios.post('https://github.com/login/oauth/access_token', {
    client_id: clientId,
    client_secret: secret,
    code
  }, {
    headers: { Accept: 'application/json' },
    ...extendOptions()
  })
  return response.data.access_token
}

async function getGitHubUser (accessToken: string): Promise<GitHubUser> {
  const response = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `token ${accessToken}` }
  })
  return response.data
}

async function findOrCreateUser (githubUser: GitHubUser, isAdmin: boolean): Promise<User | AdminUser> {
  // Try to find the user by GitHub ID
  const id = 'github-' + githubUser.login
  const Cls = isAdmin ? AdminUserModel : UserModel
  if (isAdmin && adminLogin !== githubUser.login) {
    throw new Error('Invalid admin login')
  }
  let user = await Cls.get({ id })
  if (user === undefined || user === null) {
    // If user doesn't exist, create a new one
    const data = await createData('{}', id)
    const token = await createToken(id, data.id)
    const obj = {
      id,
      githubId: githubUser.id + '',
      name: githubUser.name ?? githubUser.login,
      githubLogin: githubUser.login,
      email: githubUser.email ?? '',
      avatarUrl: githubUser.avatar_url
    }
    if (isAdmin) {
      return await AdminUserModel.create(obj)
    }

    user = await UserModel.create({
      ...obj,
      tokenIds: token.id,
      dataIds: data.id
    })
    await updateStatics('userCount', 1)
    await updateStatics('tokenCount', 1)
    return user
  } else {
    if (user.email !== (githubUser.email ?? '')) {
      await Cls.update({ id }, {
        name: githubUser.name ?? githubUser.login,
        githubId: githubUser.id + '',
        email: githubUser.email ?? '',
        avatarUrl: githubUser.avatar_url
      })
    }
    return user
  }
}

export async function handleGitHubLogin (code: string, isAdmin: boolean = false): Promise<User | AdminUser> {
  const accessToken = await getGitHubAccessToken(code)
  const githubUser = await getGitHubUser(accessToken)
  return await findOrCreateUser(githubUser, isAdmin)
}
