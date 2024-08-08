// login page, only support login with github account

import React, { useEffect, useState, JSX } from 'react'
import { GithubFilled } from '@ant-design/icons'
import {
  Button,
  Spin
} from 'antd'
import fetch from '../common/fetch'
import Links from '../common/links'
import Footer from '../common/footer'
import Admin from './admin'

declare global {
  interface Window {
    et: {
      loginUrl: string
    }
  }
}

export default function AdminLogin (): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  async function getUser (): Promise<void> {
    setLoading(true)
    await fetch('/api/get-admin-user')
      .then(res => {
        setUser(res.user)
        console.log(res)
      })
      .catch(e => {
        console.log(e)
      })
    setLoading(false)
  }

  function handleLogin (): void {
    window.location.href = window.et.loginUrl
  }

  function handleLogout (): void {
    localStorage.removeItem('tokenElecterm')
    setUser(null)
  }

  useEffect(() => {
    void getUser()
    document.getElementById('content-loading')?.remove()
  }, [])
  if (user !== null) {
    const meProps = {
      user,
      handleLogout
    }
    return (
      <Admin {...meProps} />
    )
  }
  return (
    <div className='wrap'>
      <div className='pd3y'>
        <img
          src='https://electerm.html5beta.com/electerm.png'
          alt=''
        />
        <p className='pd1y'>
          Electerm Cloud Admin
        </p>
      </div>
      <Spin spinning={loading}>
        <div className='pd3y'>
          <Button
            type='primary'
            icon={<GithubFilled />}
            onClick={handleLogin}
            size='large'
          >
            Login with GitHub
          </Button>
        </div>
      </Spin>
      <Links />
      <Footer />
    </div>
  )
}
