import getData from '../../api/get-data'
import sync from '../../api/sync'
import githubLogin from '../../api/github-login-callback'
import token from '../../api/token'
import me from '../../api/me'
import admin from '../../api/admin'
import auth from '../../api/auth'
import getUser from '../../api/user'
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
  app.all('/api/user', convertToExpressHandler(getUser))
  app.all('/api/token', convertToExpressHandler(token))
  app.all('/api/me', convertToExpressHandler(me))
  app.all('/api/admin', convertToExpressHandler(admin))
  app.all('/api/auth', convertToExpressHandler(auth))
  app.get('/api/country', convertToExpressHandler(country))
}
