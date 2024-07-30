import React from 'react'
import {
  Avatar,
  Popconfirm,
  List,
  Spin
} from 'antd'
import {
  CloseCircleFilled
} from '@ant-design/icons'

import { UserDef } from './interface'

const { Item } = List
const { Meta } = Item

export default function Users (props: any): JSX.Element {
  const {
    user,
    delUser
  } = props
  const {
    id,
    name,
    tokensCount,
    avatarUrl,
    email,
    githubLogin
  } = user as UserDef

  function del (): void {
    delUser(id)
  }

  // function edit (update: Object): void {
  //   editUser(id, update)
  // }
  const githubUrl = `https://github.com/${githubLogin}`
  const loading = props.loading === id
  const metaProps = {
    avatar: (
      <Avatar src={avatarUrl} />
    ),
    title: name,
    description: (
      <div>
        <span>Tokens: {tokensCount},</span>
        <span className='mg1l'> Email: {email},</span>
        <span className='mg1l'>
          Github: <a target='_blank' rel='noreferrer' href={githubUrl}>{githubUrl}</a>
        </span>
        <Popconfirm
          title='Are you sure to delete? '
          onConfirm={del}
          okText='Yes'
          cancelText='No'
        >
          <CloseCircleFilled className='mg1l pointer' />
        </Popconfirm>
      </div>
    )
  }
  return (
    <Spin spinning={loading} key={id}>
      <Item>
        <Meta
          {...metaProps}
        />
      </Item>
    </Spin>
  )
}
