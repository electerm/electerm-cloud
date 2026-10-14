export interface UserDef {
  id: string
  lastUseTime: string
  tokenLimit: number
  tokensCount: number
  githubLogin: string
  name: string
  email: string
  avatarUrl: string
  status: 'active' | 'disabled'
}

export interface TokenDef {
  id: string
  name: string
  useCount: number
  lastUseTime: string
  dataId: string
}
