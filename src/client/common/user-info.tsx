import React from 'react'
import {
  UserOutlined,
  MailFilled,
  GithubFilled
} from '@ant-design/icons'
import { t } from '../locales/lang'

export default function UserInfo (props: any): JSX.Element {
  const { user } = props
  const githubUrl = `https://github.com/${user.githubLogin as string}`

  return (
    <div>
      <h1>Electerm Cloud <sup className='color-red font14'>Beta</sup></h1>
      <div className='pd2y content'>
        <div className='pd1y'>
          <img src={user.avatarUrl} alt='' className='avatar iblock' />
        </div>
        <div>
          <UserOutlined /> {t('name')}: <b>{user.name}</b>
        </div>
        <div>
          <MailFilled /> {t('email')}: <b>{user.email}</b>
        </div>
        <div className='pd3b'>
          <GithubFilled /> GitHub: <b><a target='_blank' rel='noreferrer' href={githubUrl}>{githubUrl}</a></b>
        </div>
      </div>
    </div>
  )
}
