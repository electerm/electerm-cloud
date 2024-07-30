import React, { useState, useEffect } from 'react'
import {
  Button,
  message
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
  const [loading, setLoading] = useState('')
  const [users, setUsers] = useState<UserDef[]>([])
  const {
    user,
    handleLogout
  } = props

  function getUsers (): void {
    setLoading('all')
    fetch('/api/token', {}, 'GET')
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
    fetch('/api/users', {}, 'DELETE')
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

  const githubUrl = `https://github.com/${user.githubLogin as string}`
  const usersProps = {
    users,
    delUser,
    loading
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
