import React from 'react'
import { createPortal } from 'react-dom'

export default function AppControls ({ children }: React.PropsWithChildren): React.JSX.Element {
  const toolbar = document.getElementById('app-controls')
  return toolbar === null ? <>{children}</> : createPortal(children, toolbar)
}
