import getData from '../../api/get-data'
import sync from '../../api/sync'
import githubLogin from '../../api/github-login-callback'
import token from '../../api/token'
import getUser from '../../api/get-user'
import { Request, Response, Application } from 'express'
import { VercelRequest, VercelResponse } from '@vercel/node'

type VercelHandler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

function convertToExpressHandler (vercelHandler: VercelHandler) {
  return async (req: Request, res: Response) => {
    try {
      await vercelHandler(req as VercelRequest, res as unknown as VercelResponse)
    } catch (error) {
      console.error(error)
      res.status(500).send('Internal Server Error')
    }
  }
}


export default function (app: Application) {
  app.post('/api/get-data', convertToExpressHandler(getData))
  app.post('/api/sync', convertToExpressHandler(sync))
  app.get('/api/github-login-callback', convertToExpressHandler(githubLogin))
  app.all('/api/token', convertToExpressHandler(token))
  app.post('/api/get-user', convertToExpressHandler(getUser))
}
