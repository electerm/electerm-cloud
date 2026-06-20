// login page, only support login with github account

import React, { useEffect, useState, JSX } from 'react'
import { GithubFilled } from '@ant-design/icons'
import {
  Button,
  Spin
} from 'antd'
import fetch from '../common/fetch'
import Me from '../me/me'
import Links from '../common/links'
import Footer from '../common/footer'
import LangSelect from '../locales/lang-select'
import Logo from '../common/logo'
import { t } from '../locales/lang'

declare global {
  interface Window {
    et: {
      loginUrl?: string
    }
  }
}

export default function Login (): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  async function getUser (): Promise<void> {
    setLoading(true)
    await fetch('/api/get-user')
      .then(res => {
        setUser(res.user)
      })
      .catch(e => {
        console.log(e)
      })
    setLoading(false)
  }

  function handleLogin (): void {
    setLoading(true)
    window.fetch('/api/get-login-url')
      .then(async res => await res.json())
      .then(data => {
        window.location.href = data.loginUrl
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }

  function handleLogout (): void {
    localStorage.removeItem('token')
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
      <Me {...meProps} />
    )
  }
  return (
    <div className='wrap'>
      <div className='pd1y'>
        <LangSelect />
      </div>
      <Logo />
      <Spin spinning={loading}>
        <div className='pd3y'>
          <Button
            type='primary'
            icon={<GithubFilled />}
            onClick={handleLogin}
            size='large'
          >
            {t('loginWithGitHub')}
          </Button>
          <p className='login-agreement-notice'>
            {t('loginAgreeNotice')}
            {' '}
            <a href='/agreement' target='_blank' rel='noreferrer'>
              {t('agreement')}
            </a>
          </p>
        </div>
      </Spin>
      <Links />
      <Footer />
    </div>
  )
}
