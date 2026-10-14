import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyJwtAndCheckId, decode } from '../src/server/control/jwt'
import { listTokens, delToken, reToken, newToken, editTokenName } from '../src/server/control/token'
import { User } from '../src/server/models/user-model'

function tokenLimitExceeded (user: User): boolean {
  return user.tokenIds.split(',').filter(d => d).length >= user.tokenLimit
}

export default async function token (req: VercelRequest, res: VercelResponse): Promise<void> {
  const user = await verifyJwtAndCheckId(req, res) as User
  if (user === null) {
    return
  }
  const {
    method
  } = req
  const {
    id,
    name
  } = req.body
  if (method === 'GET') {
    const ids = user.tokenIds.split(',')
    const tokens = await listTokens(ids)
    res.send({
      tokens
    })
    return
  }
  let tokenId = ''
  if (id !== undefined) {
    try {
      tokenId = decode(id as string)
    } catch {
      res.status(400).send('Invalid token id')
      return
    }
  }
  function handleError (err: Error): void {
    console.log(err)
    res.status(500).send(err.message)
  }
  if (name !== undefined && name.length > 120) {
    res.status(400).send('name too long')
    return
  }
  if (method === 'DELETE') {
    await delToken(tokenId, user)
      .then(() => {
        res.send({ ok: true })
      })
      .catch(handleError)
  } else if (method === 'PATCH') {
    if (name !== undefined) {
      await editTokenName(tokenId, name as string, user)
        .then(r => {
          res.send(r)
        })
        .catch(handleError)
      return
    }
    await reToken(tokenId, user)
      .then(token => {
        res.send({ token })
      })
      .catch(handleError)
  } else if (method === 'POST') {
    if (tokenLimitExceeded(user)) {
      res.status(403).send('token limit exceeded')
      return
    }
    await newToken(user, user.id, name)
      .then(token => {
        res.send({ token })
      })
      .catch(handleError)
  } else {
    res.status(404).send('404 not found')
  }
}
