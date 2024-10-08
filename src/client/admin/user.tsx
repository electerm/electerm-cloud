import React from 'react'
import {
  Avatar,
  Popconfirm,
  List,
  Spin
} from 'antd'
import {
  CloseCircleFilled,
  EditOutlined
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
    tokenLimit,
    tokensCount,
    avatarUrl,
    email,
    githubLogin,
    status
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
    title: (
      <div>
        <span>{name}</span>
        <Popconfirm
          title='Are you sure to delete? '
          onConfirm={del}
          okText='Yes'
          cancelText='No'
        >
          <CloseCircleFilled className='mg3l pointer' />
        </Popconfirm>
        <EditOutlined
          className='mg1l pointer'
          onClick={() => props.onSelectEdit(user)}
        />
      </div>
    ),
    description: (
      <div>
        <span>Status: {status},</span>
        <span className='mg1l'>Tokens: {tokensCount}/{tokenLimit},</span>
        <span className='mg1l'> Email: {email},</span>
        <span className='mg1l'>
          Github: <a target='_blank' rel='noreferrer' href={githubUrl}>{githubUrl}</a>
        </span>

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
