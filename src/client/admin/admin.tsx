import React, { useState, useEffect } from 'react'
import {
  message,
  Form
} from 'antd'
import fetch from '../common/fetch'
import Links from '../common/links'
import Footer from '../common/footer'
import Users from './users'
import { UserDef, TokenDef } from './interface'
import Logout from '../common/logout'
import UserInfo from '../common/user-info'
import Logo from '../common/logo'
import Statics from './statics'

export default function Admin (props: any): JSX.Element {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState('')
  const [statics, setStatics] = useState({})
  const [editing, setEditing] = useState('')
  const [count, setCount] = useState(0)
  const [start, setStart] = useState('')
  // const [limit, setLimit] = useState(10)
  const [editingUserId, setEditingUserId] = useState('')
  const [users, setUsers] = useState<UserDef[]>([])
  const [txt, setTxt] = useState('')
  const [tokensUserId, setTokensUserId] = useState('')
  const [tokens, setTokens] = useState<TokenDef[]>([])
  const [tokensLoading, setTokensLoading] = useState(false)
  const {
    user,
    handleLogout
  } = props

  function getUsers (): void {
    setLoading('all')
    fetch(`/api/user?start=${start}&limit=20`, undefined, 'GET')
      .then((res) => {
        setLoading('')
        setUsers(oldUsers => [...oldUsers, ...res.users])
        setCount(res.count)
        setStart(
          res.lastKey !== undefined
            ? res.lastKey.id
            : ''
        )
      })
      .catch(e => {
        setLoading('')
        console.log(e)
        void message.error('get token list failed')
      })
  }

  function getStatics (): void {
    fetch('/api/admin?fn=statics', undefined, 'GET')
      .then((res) => {
        setStatics(res)
      })
      .catch(e => {
        console.log(e)
      })
  }

  function searchUser (): void {
    setLoading('all')
    fetch(`/api/user?id=${txt}`, undefined, 'GET')
      .then((res) => {
        setLoading('')
        if (res.user !== undefined) {
          setUsers([res.user])
          setCount(1)
        } else {
          setUsers([]) // Set to empty array if no user found
          setCount(0)
          void message.info('No user found') // Optionally inform the user
        }
      })
      .catch(e => {
        setLoading('')
        console.log(e)
        void message.error('search user failed')
      })
  }

  function delUser (id: string): void {
    setLoading(id)
    fetch('/api/user', { id }, 'DELETE')
      .then(() => {
        setLoading('')
        setUsers(users.filter(d => d.id !== id))
      })
      .catch(e => {
        setLoading('')
        console.log(e)
        void message.error('del token failed')
      })
  }

  function getTokens (id: string): void {
    if (tokensUserId === id) {
      setTokensUserId('')
      return
    }
    setTokensUserId(id)
    setTokensLoading(true)
    setTokens([])
    fetch(`/api/admin?fn=tokens&userId=${id}`, undefined, 'GET')
      .then((res) => {
        setTokensLoading(false)
        setTokens(res.tokens)
      })
      .catch(e => {
        setTokensLoading(false)
        console.log(e)
        void message.error('get tokens failed')
      })
  }

  function delToken (userId: string, id: string): void {
    setTokensLoading(true)
    fetch('/api/admin?fn=tokens', { userId, id }, 'DELETE')
      .then(() => {
        setTokensLoading(false)
        setTokens(tokens.filter(d => d.id !== id))
      })
      .catch(e => {
        setTokensLoading(false)
        console.log(e)
        void message.error('del token failed')
      })
  }

  function reToken (userId: string, id: string): void {
    setTokensLoading(true)
    fetch('/api/admin?fn=tokens', { userId, id }, 'PATCH')
      .then((res) => {
        setTokensLoading(false)
        setTokens(tokens.map(d => d.id === id ? res.token : d))
      })
      .catch(e => {
        setTokensLoading(false)
        console.log(e)
        void message.error('regenerate token failed')
      })
  }

  function onSave (id: string, update: Object): void {
    setEditing(id)
    fetch('/api/user', { id, update }, 'PATCH')
      .then(() => {
        setEditing('')
        setEditingUserId('')
        setUsers(users.map(d => {
          if (d.id === id) {
            return {
              ...d,
              ...update
            }
          }
          return d
        }))
        void message.success('update user successful')
      })
      .catch(e => {
        setEditing('')
        console.log(e)
        void message.error('update user failed')
      })
  }

  function onSelectEdit (user: UserDef): void {
    setEditingUserId(user.id)
  }

  function onCancel (): void {
    setEditingUserId('')
  }

  function onChangeSearch (txt: string): void {
    setTxt(txt)
  }

  const usersProps = {
    users,
    delUser,
    form,
    loading,
    editing,
    editingUserId,
    onSave,
    onSelectEdit,
    onCancel,
    count,
    start,
    handleSearchUser: searchUser,
    handleGetUsers: getUsers,
    txt,
    onChangeSearch,
    tokensUserId,
    tokens,
    tokensLoading,
    getTokens,
    delToken,
    reToken
  }

  useEffect(() => {
    void getUsers()
    void getStatics()
  }, [])

  return (
    <div className='wrap pd2x'>
      <Logout handleLogout={handleLogout} />
      <UserInfo user={user} />
      <Statics statics={statics} />
      <Users {...usersProps} />
      <Logo />
      <Links />
      <Footer />
    </div>
  )
}
