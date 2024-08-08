import { createRoot } from 'react-dom/client'
import React from 'react'
import App from '../admin/admin-login'
import './app.styl'

const root = createRoot(document.getElementById('container') as HTMLElement)
root.render(<App />)
