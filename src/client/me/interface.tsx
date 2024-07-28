export interface TokenDef {
  id: string
  lastUseTime: string
  useCount: number
}

export interface TokenDef1 extends TokenDef {
  show: false
}
