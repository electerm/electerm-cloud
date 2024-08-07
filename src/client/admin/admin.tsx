import React, { useState, useEffect } from 'react'
import {
  message,
  Form
} from 'antd'
import fetch from '../common/fetch'
import Links from '../common/links'
import Footer from '../common/footer'
import Users from './users'
import { UserDef } from './interface'
import Logout from '../common/logout'
import UserInfo from '../common/user-info'
import Logo from '../common/logo'

export default function Admin (props: any): JSX.Element {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState('')
  const [editing, setEditing] = useState('')
  const [count, setCount] = useState(0)
  const [start, setStart] = useState('')
  // const [limit, setLimit] = useState(10)
  const [editingUserId, setEditingUserId] = useState('')
  const [users, setUsers] = useState<UserDef[]>([])
  const [txt, setTxt] = useState('')
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

  function searchUser (): void {
    setLoading('all')
    fetch(`/api/user?id=${txt}`, undefined, 'GET')
      .then((res) => {
        setLoading('')
        setUsers([res.user])
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
    setTxt(oldTxt => {
      if (oldTxt !== txt && txt === '') {
        getUsers()
        return txt
      }
      return oldTxt
    })
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
    onChangeSearch
  }

  useEffect(() => {
    void getUsers()
  }, [])

  return (
    <div className='wrap pd2x'>
      <Logout handleLogout={handleLogout} />
      <UserInfo user={user} />
      <Users {...usersProps} />
      <Logo />
      <Links />
      <Footer />
    </div>
  )
}
