import express from 'express'
import morgan from 'morgan'
import { resolve } from 'path'
import route from './vite/route'

const cwd = process.cwd()
const app = express()

// Mirror the Vercel production body limit (4.5MB) the same way
// bin/vite/dev-server.ts does. express.json defaults to 100KB, which is *below*
// the 280KB sync payload cap, so leaving the default here makes this server
// reject uploads the real one accepts — and hides the sync handler's own 413
// behind body-parser's.
app.use(express.urlencoded({ extended: true, limit: '4.5mb' }))
app.use(express.json({ limit: '4.5mb' }))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

// API routes
route(app)

// Static files from public/
app.use(express.static(resolve(cwd, 'public')))

const DEV_HOST = process.env.DEV_HOST ?? '127.0.0.1'
const DEV_PORT = Number(process.env.DEV_PORT ?? 5589)

app.listen(DEV_PORT, DEV_HOST, () => {
  console.log(`server runs on http://${DEV_HOST}:${DEV_PORT}`)
})
