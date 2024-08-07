import React, { useState, useEffect } from 'react'
import {
  Button,
  Modal,
  message
} from 'antd'
import fetch from '../common/fetch'
import downLoadJson from '../common/download'
import Links from '../common/links'
import Footer from '../common/footer'
import Tokens from './tokens'
import Logout from '../common/logout'
import UserInfo from '../common/user-info'
import Logo from '../common/logo'
import { TokenDef, TokenDef1 } from './interface'

export default function Me (props: any): JSX.Element {
  const [txt, setTxt] = useState('')
  const [loading, setLoading] = useState('')
  const [tokens, setTokens] = useState<TokenDef1[]>([])
  const {
    user,
    handleLogout
  } = props

  function downloadData (content: string = txt): void {
    downLoadJson(content, 'electerm-data.json')
  }

  function onPreview (text: string): void {
    setTxt(text)
    Modal.info({
      title: 'Preview',
      content: (
        <div>
          <p>
            <pre>
              <code>
                {JSON.stringify(text, null, 2)}
              </code>
            </pre>
          </p>
          <p>
            <Button
              onClick={() => downloadData()}
            >
              Download
            </Button>
            <Button
              onClick={copyData}
              className='mg1l'
            >
              Copy
            </Button>
          </p>
        </div>
      )
    })
  }

  function preview (id: string): void {
    fetch('/api/get-data', { id })
      .then(res => {
        setTxt(res.text)
        onPreview(res.text)
      })
      .catch(e => {
        console.log(e)
        void message.error('download data failed')
      })
  }

  function download (id: string): void {
    fetch('/api/get-data', { id })
      .then(res => {
        downloadData(res.text)
      })
      .catch(e => {
        console.log(e)
        void message.error('download data failed')
      })
  }

  function handleAdd (): void {
    setLoading('add')
    fetch('/api/token', {}, 'POST')
      .then(res => {
        setLoading('')
        const newToken = res.token as TokenDef
        setTokens(tokens => {
          return [
            ...tokens,
            {
              ...newToken,
              show: false
            }
          ]
        })
      })
      .catch(e => {
        setLoading('')
        console.log(e)
        void message.error(e.message)
      })
  }

  function toggleTokenShow (id: string): void {
    setTokens((tokens: TokenDef1[]): TokenDef1[] => {
      return tokens.map((d: TokenDef1) => {
        if (d.id === id) {
          const r = {
            ...d,
            show: !d.show
          }
          return r as TokenDef1
        }
        return d
      })
    })
  }

  function getTokens (): void {
    setLoading('all')
    fetch('/api/token', undefined, 'GET')
      .then((res) => {
        setLoading('')
        setTokens(res.tokens.map((t: TokenDef) => {
          return {
            ...t,
            show: false
          }
        }))
      })
      .catch(e => {
        setLoading('')
        console.log(e)
        void message.error('get token list failed')
      })
  }

  function delToken (id: string): void {
    setLoading(id)
    fetch('/api/token', {
      id
    }, 'DELETE')
      .then(() => {
        setLoading('')
        setTokens(tokens => tokens.filter(d => d.id !== id))
      })
      .catch(e => {
        setLoading('')
        console.log(e)
        void message.error('del token failed')
      })
  }

  function reToken (id: string): void {
    setLoading(id)
    fetch('/api/token', { id }, 'PATCH')
      .then(res => {
        setLoading('')
        const newToken = res.token as TokenDef
        setTokens(tokens => tokens.map((d) => {
          if (d.id === id) {
            return { ...d, ...newToken }
          }
          return d
        }))
      })
      .catch(e => {
        setLoading('')
        console.log(e)
        void message.error('regenerate token failed')
      })
  }

  function copyData (): void {
    void navigator.clipboard.writeText(txt)
    void message.success('Data Copied')
  }

  const tokensProps = {
    tokens,
    reToken,
    delToken,
    loading,
    toggleTokenShow,
    downloadData: download,
    previewData: preview,
    handleAdd
  }

  useEffect(() => {
    void getTokens()
  }, [])

  return (
    <div className='wrap pd2x'>
      <Logout handleLogout={handleLogout} />
      <UserInfo user={user} />
      <div className='pd2y'>
        <Tokens {...tokensProps} />
      </div>
      <Logo />
      <Links />
      <Footer />
    </div>
  )
}
