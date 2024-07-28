
import { resolve } from 'path'

export const env = process.env
export const cwd = process.cwd()
export const viewPath = resolve(cwd, 'src/views')