import React, { useState, useEffect, useRef } from 'react'
import {
  Button,
  Modal,
  Input,
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
import { t } from '../locales/lang'
import './token.styl'
import {
  CopyOutlined,
  DownloadOutlined,
  JavaScriptOutlined
} from '@ant-design/icons'
import AutoFocusInput from '../common/auto-focus-input'

interface JsonType {
  [key: string]: any
}

function parseNestedJSON (obj: Object | string | null): Object | string | null {
  if (typeof obj !== 'object' || obj === null) {
    // Try to parse strings that look like JSON
    if (typeof obj === 'string' && (obj.startsWith('{') || obj.startsWith('['))) {
      try {
        return parseNestedJSON(JSON.parse(obj))
      } catch (e) {
        // If parsing fails, return the original string
        return obj
      }
    }
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => parseNestedJSON(item))
  }

  const result: JsonType = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = parseNestedJSON(value)
  }
  return result
}

export default function Me (props: any): JSX.Element {
  const [txt, setTxt] = useState('')
  const tokenNameRef = useRef('')
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
    const prettyStr = JSON.stringify(parseNestedJSON(JSON.parse(text)), null, 2)
    Modal.info({
      title: t('previewData'),
      icon: <JavaScriptOutlined />,
      content: (
        <div>
          <div className='wordbreak pd1 data-preview-wrap'>
            <pre>
              {prettyStr}
            </pre>
          </div>
          <p>
            <Button
              onClick={() => downloadData()}
              icon={<DownloadOutlined />}
            >
              {t('download')}
            </Button>
            <Button
              onClick={copyData}
              icon={<CopyOutlined />}
              className='mg1l'
            >
              {t('copy')}
            </Button>
          </p>
        </div>
      )
    })
  }

  function preview (id: string): void {
    setLoading(id)
    fetch('/api/get-data', { id })
      .then(res => {
        setTxt(res.text)
        onPreview(res.text)
        setLoading('')
      })
      .catch(e => {
        console.log(e)
        setLoading('')
        void message.error('download data failed')
      })
  }

  function download (id: string): void {
    setLoading(id)
    fetch('/api/get-data', { id })
      .then(res => {
        downloadData(res.text)
        setLoading('')
      })
      .catch(e => {
        console.log(e)
        setLoading('')
        void message.error('download data failed')
      })
  }

  function onChangeTokenName (e: any): void {
    const v = e.target.value
    tokenNameRef.current = v
  }

  function renderTokenNameInput (name: string = ''): JSX.Element {
    tokenNameRef.current = name
    return (
      <div>
        <AutoFocusInput
          onChange={onChangeTokenName}
          key={Date.now()}
          placeholder={t('tokenName')}
          defaultValue={name}
          autoFocus
        />
      </div>
    )
  }

  function handleAdd (): void {
    Modal.confirm({
      title: 'Create a new token',
      content: renderTokenNameInput(''),
      okText: t('save'),
      cancelText: t('cancel'),
      onOk: addToken
    })
  }

  function addToken (): void {
    setLoading('add')
    fetch('/api/token', {
      name: tokenNameRef.current
    }, 'POST')
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

  function editToken (id: string): void {
    setLoading(id)
    const name = tokenNameRef.current
    fetch('/api/token', { id, name }, 'PATCH')
      .then(res => {
        setLoading('')
        setTokens(tokens => tokens.map((d) => {
          if (d.id === id) {
            return { ...d, name }
          }
          return d
        }))
      })
      .catch(e => {
        setLoading('')
        console.log(e)
        void message.error('edit token name failed')
      })
  }

  function copyData (): void {
    void navigator.clipboard.writeText(txt)
    void message.success('Data Copied')
  }

  function onEdit (id: string, name: string): void {
    Modal.confirm({
      title: 'Edit token',
      content: renderTokenNameInput(name),
      onOk: () => {
        editToken(id)
      }
    })
  }

  const tokensProps = {
    tokens,
    reToken,
    delToken,
    loading,
    toggleTokenShow,
    downloadData: download,
    previewData: preview,
    handleAdd,
    onEdit
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
