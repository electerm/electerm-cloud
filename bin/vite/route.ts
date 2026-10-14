import getData from '../../api/get-data'
import sync from '../../api/sync'
import githubLogin from '../../api/github-login-callback'
import getLoginUrl from '../../api/get-login-url'
import token from '../../api/token'
import adminTokens from '../../api/admin-tokens'
import getAdminUser from '../../api/get-admin-user'
import getUser from '../../api/get-user'
import user from '../../api/user'
import logout from '../../api/logout'
import statics from '../../api/statics'
import country from '../../api/country'
import { Request, Response, Application, RequestHandler } from 'express'
import { VercelRequest, VercelResponse } from '@vercel/node'

type VercelHandler = (req: VercelRequest, res: VercelResponse) => Promise<void>

function convertToExpressHandler (vercelHandler: VercelHandler): RequestHandler {
  return (req: Request, res: Response): void => {
    vercelHandler(req as VercelRequest, res as unknown as VercelResponse)
      .catch((error: unknown) => {
        console.error(error)
        res.status(500).send('Internal Server Error')
      })
  }
}

export default function (app: Application): void {
  app.post('/api/get-data', convertToExpressHandler(getData))
  app.all('/api/sync', convertToExpressHandler(sync))
  app.get('/api/github-login-callback', convertToExpressHandler(githubLogin))
  app.get('/api/get-login-url', convertToExpressHandler(getLoginUrl))
  app.all('/api/user', convertToExpressHandler(user))
  app.all('/api/token', convertToExpressHandler(token))
  app.all('/api/admin-tokens', convertToExpressHandler(adminTokens))
  app.post('/api/get-user', convertToExpressHandler(getUser))
  app.post('/api/logout', convertToExpressHandler(logout))
  app.post('/api/token', convertToExpressHandler(token))
  app.post('/api/get-admin-user', convertToExpressHandler(getAdminUser))
  app.get('/api/statics', convertToExpressHandler(statics))
  app.get('/api/country', convertToExpressHandler(country))
}
