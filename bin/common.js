const { config } = require('dotenv')
const { readFileSync } = require('fs')
const { resolve } = require('path')

config()

exports.cwd = process.cwd()
exports.env = process.env
const packPath = resolve(exports.cwd, 'package.json')
exports.pack = JSON.parse(readFileSync(packPath, 'utf-8'))
exports.version = exports.pack.version
