import { createRoot } from 'react-dom/client'
import React from 'react'
import App from '../agreement/agreement'
import './app.styl'

const root = createRoot(document.getElementById('container') as HTMLElement)
root.render(<App />)
