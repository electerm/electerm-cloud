import { createRoot } from 'react-dom/client'
import React from 'react'
import App from '../login/login'
import ThemeProvider from '../common/theme-provider'
import './app.styl'
// import './style.scss'

const root = createRoot(document.getElementById('container') as HTMLElement)
root.render(<ThemeProvider><App /></ThemeProvider>)
