import React, { useState, useEffect } from 'react'
import {
  Button,
  message,
  Form
} from 'antd'
import {
  LogoutOutlined,
  UserOutlined,
  MailFilled,
  GithubFilled
} from '@ant-design/icons'
import fetch from '../common/fetch'
import Links from '../me/links'
import Footer from '../me/footer'
import Users from './users'
import { UserDef } from './interface'

export default function Admin (props: any): JSX.Element {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState('')
  const [editing, setEditing] = useState('')
  const [editingUserId, setEditingUserId] = useState('')
  const [users, setUsers] = useState<UserDef[]>([])
  const {
    user,
    handleLogout
  } = props

  function getUsers (): void {
    setLoading('all')
    fetch('/api/user', {}, 'GET')
      .then((res) => {
        setLoading('')
        setUsers(res.users)
      })
      .catch(e => {
        setLoading('')
        console.log(e)
        void message.error('get token list failed')
      })
  }

  function delUser (id: string): void {
    setLoading(id)
    fetch('/api/user', {}, 'DELETE')
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

  const githubUrl = `https://github.com/${user.githubLogin as string}`
  const usersProps = {
    users,
    delUser,
    form,
    loading,
    editing,
    editingUserId,
    onSave,
    onSelectEdit,
    onCancel
  }

  useEffect(() => {
    void getUsers()
  }, [])

  return (
    <div className='wrap pd2x'>
      <div className='pd1b alignright'>
        <Button
          type='primary'
          onClick={handleLogout}
          icon={<LogoutOutlined />}
        >
          Logout
        </Button>
      </div>
      <h1>Electerm Cloud <sup className='color-red font14'>Beta</sup></h1>
      <div className='pd2y content'>
        <div className='pd1y'>
          <img src={user.avatarUrl} alt='' className='avatar iblock' />
        </div>
        <div>
          <UserOutlined /> Name: <b>{user.name}</b>
        </div>
        <div>
          <MailFilled /> Email: <b>{user.email}</b>
        </div>
        <div className='pd3b'>
          <GithubFilled /> Github: <b><a target='_blank' rel='noreferrer' href={githubUrl}>{githubUrl}</a></b>
        </div>
        <Users {...usersProps} />
      </div>
      <div className='pd3y'>
        <img
          src='https://electerm.html5beta.com/electerm.png'
          alt=''
          className='logo iblock'
        />
      </div>
      <Links />
      <Footer />
    </div>
  )
}
