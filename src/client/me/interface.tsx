export interface TokenDef {
  id: string
  lastUseTime: string
  useCount: number
  dataId: string
  name: string
}

export interface TokenDef1 extends TokenDef {
  show: false
}
