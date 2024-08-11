// login page, only support login with github account

import React, { useEffect, useState, JSX } from 'react'
import { GithubFilled } from '@ant-design/icons'
import {
  Button,
  Checkbox,
  Modal,
  Spin
} from 'antd'
import fetch from '../common/fetch'
import Me from '../me/me'
import AgreeMent from './agreement'
import Links from '../common/links'
import Footer from '../common/footer'

declare global {
  interface Window {
    et: {
      loginUrl: string
    }
  }
}

export default function Login (): JSX.Element {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  async function getUser (): Promise<void> {
    setLoading(true)
    await fetch('/api/get-user')
      .then(res => {
        setUser(res.user)
        // console.log(res)
      })
      .catch(e => {
        console.log(e)
      })
    setLoading(false)
  }

  function openAgreement (): void {
    Modal.confirm({
      title: 'Agreement',
      content: <AgreeMent />,
      okText: 'Agree',
      cancelText: 'Disagree',
      onCancel: () => {
        localStorage.setItem('agreed', 'no')
        setAgreed(false)
      },
      onOk: () => {
        localStorage.setItem('agreed', 'yes')
        setAgreed(true)
      }
    })
  }

  function handleLogin (): void {
    if (!agreed) {
      return openAgreement()
    }
    setLoading(true)
    window.location.href = window.et.loginUrl
  }

  function handleLogout (): void {
    localStorage.removeItem('token')
    setUser(null)
  }

  useEffect(() => {
    void getUser()
    document.getElementById('content-loading')?.remove()
    setAgreed(
      localStorage.getItem('agreed') === 'yes'
    )
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
      <div className='pd3y'>
        <img
          src='https://electerm.html5beta.com/electerm.png'
          alt=''
        />
        <p className='pd1y'>
          Electerm Cloud: sync your electerm data to cloud
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
          <p>
            <Checkbox onChange={openAgreement} checked={agreed}>
              I have read and agree to the agreement
            </Checkbox>
            <span className='mg1l'>
              <span
                onClick={openAgreement}
                className='pointer'
              >
                Agreement
              </span>
            </span>
          </p>
        </div>
      </Spin>
      <Links />
      <Footer />
    </div>
  )
}
