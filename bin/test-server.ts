import express from 'express'
import morgan from 'morgan'
import { resolve } from 'path'
import route from './vite/route'

const cwd = process.cwd()
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
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
