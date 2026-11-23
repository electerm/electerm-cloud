import React, { useEffect, useSyncExternalStore } from 'react'
import { ConfigProvider, theme } from 'antd'

function subscribe (listener: () => void): () => void {
  document.addEventListener('themechange', listener)
  return () => document.removeEventListener('themechange', listener)
}

export default function ThemeProvider ({ children }: React.PropsWithChildren): React.JSX.Element {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme !== 'light')
  const config = React.useMemo(() => ({
    algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: dark ? '#60a5fa' : '#2563eb',
      colorBgBase: dark ? '#0f172a' : '#ffffff',
      colorTextLightSolid: dark ? '#07111f' : '#ffffff'
    }
  }), [dark])

  // Standalone Ant Design dialogs and messages render outside the app root.
  useEffect(() => { ConfigProvider.config({ theme: config }) }, [config])
  return <ConfigProvider theme={config}>{children}</ConfigProvider>
}
