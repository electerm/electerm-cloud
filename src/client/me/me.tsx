import React, { useState, useEffect, useRef } from 'react'
import {
  Button,
  Modal,
  message,
  Alert
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
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  JavaScriptOutlined
} from '@ant-design/icons'
import AutoFocusInput from '../common/auto-focus-input'

interface JsonType {
  [key: string]: any
}

// Marker of the client-side cipher format, see electerm src/app/lib/enc.js:
// 'gcm:<iv_hex>:<salt_hex>:<authtag_hex>:<ciphertext_hex>'. Sync data carrying
// this prefix was encrypted in the electerm client before upload and cannot
// be read here — by design, the server never sees the sync password.
const GCM_PREFIX = 'gcm:'
// A full ciphertext is a wall of hex; show a head + length so the user can
// see the data IS encrypted without rendering hundreds of KB of hex.
const CIPHER_PREVIEW_LEN = 80

function isEncryptedContent (content: unknown): content is string {
  return typeof content === 'string' && content.startsWith(GCM_PREFIX)
}

/**
 * Turn the stored sync payload into something previewable:
 * - tolerates non-JSON input (shows it raw instead of throwing)
 * - collects the file names that hold client-side ciphertext
 * - shortens long ciphertext values to a head + length marker
 */
function buildPreview (text: string): { pretty: string, encryptedFiles: string[] } {
  let obj: unknown
  try {
    obj = JSON.parse(text)
  } catch (e) {
    return { pretty: text, encryptedFiles: [] }
  }
  const encryptedFiles: string[] = []
  const files = (obj as JsonType | null | undefined)?.files
  if (files !== undefined && files !== null && typeof files === 'object' && !Array.isArray(files)) {
    for (const [name, file] of Object.entries(files as JsonType)) {
      const content = (file as JsonType | undefined)?.content
      if (isEncryptedContent(content)) {
        encryptedFiles.push(name)
        if (content.length > CIPHER_PREVIEW_LEN) {
          ;(file as JsonType).content = `${content.slice(0, CIPHER_PREVIEW_LEN)}… (${content.length} chars)`
        }
      }
    }
  }
  return { pretty: JSON.stringify(parseNestedJSON(obj as Object), null, 2), encryptedFiles }
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
  const deleteConfirmRef = useRef('')
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
    const { pretty, encryptedFiles } = buildPreview(text)
    Modal.info({
      title: t('previewData'),
      icon: <JavaScriptOutlined />,
      content: (
        <div>
          {encryptedFiles.length > 0 && (
            <Alert
              type='info'
              showIcon
              className='mg1b'
              message={t('dataEncrypted')}
              description={
                <span>
                  {t('dataEncryptedDesc')}
                  <b>{encryptedFiles.join(', ')}</b>
                </span>
              }
            />
          )}
          <div className='wordbreak pd1 data-preview-wrap'>
            <pre>
              {pretty}
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

  function onChangeDeleteConfirm (e: any): void {
    deleteConfirmRef.current = e.target.value
  }

  async function deleteAccount (): Promise<void> {
    setLoading('delete')
    try {
      await fetch('/api/me', undefined, 'DELETE')
      setLoading('')
      void message.success(t('accountDeleted'))
      handleLogout()
    } catch (e) {
      setLoading('')
      console.log(e)
      void message.error((e as Error).message)
      throw e
    }
  }

  function renderDeleteConfirm (): JSX.Element {
    return (
      <div>
        <p className='color-red'>{t('deleteAccountWarn')}</p>
        <p>
          {t('typeToConfirm')}: <b>{user.githubLogin}</b>
        </p>
        <AutoFocusInput
          onChange={onChangeDeleteConfirm}
          placeholder={user.githubLogin}
        />
      </div>
    )
  }

  function handleDeleteAccount (): void {
    deleteConfirmRef.current = ''
    Modal.confirm({
      title: t('deleteAccount'),
      icon: <ExclamationCircleOutlined className='color-red' />,
      content: renderDeleteConfirm(),
      okText: t('delete'),
      okButtonProps: { danger: true },
      cancelText: t('cancel'),
      onOk: async () => {
        if (deleteConfirmRef.current !== user.githubLogin) {
          void message.error(t('confirmInputMismatch'))
          throw new Error('mismatch')
        }
        return await deleteAccount()
      }
    })
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
      <div className='danger-zone pd2y'>
        <h2 className='danger-zone-title'>{t('dangerZone')}</h2>
        <p className='color-grey'>{t('dangerZoneDesc')}</p>
        <Button
          danger
          icon={<DeleteOutlined />}
          loading={loading === 'delete'}
          onClick={handleDeleteAccount}
        >
          {t('deleteAccount')}
        </Button>
      </div>
      <Logo />
      <Links />
      <Footer />
    </div>
  )
}
