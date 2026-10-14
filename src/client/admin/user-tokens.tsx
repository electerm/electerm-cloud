// user-tokens.tsx - admin view of one user's sync tokens

import React from 'react'
import {
  Button,
  Popconfirm,
  Spin,
  Table
} from 'antd'
import {
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons'

import { TokenDef } from './interface'

export default function UserTokens (props: any): JSX.Element {
  const {
    tokens,
    loading,
    delToken,
    reToken
  } = props

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Use count',
      dataIndex: 'useCount',
      key: 'useCount'
    },
    {
      title: 'Last use',
      dataIndex: 'lastUseTime',
      key: 'lastUseTime',
      render: (t: string) => t !== undefined ? new Date(t).toLocaleString() : '-'
    },
    {
      title: 'Data id',
      dataIndex: 'dataId',
      key: 'dataId'
    },
    {
      title: 'Action',
      key: 'action',
      render: (token: TokenDef) => (
        <span>
          <Popconfirm
            title='Regenerate this token? The old token stops working immediately.'
            onConfirm={() => reToken(token.id)}
            okText='Yes'
            cancelText='No'
          >
            <Button
              size='small'
              className='mg1r'
              icon={<ReloadOutlined />}
            >
              Regenerate
            </Button>
          </Popconfirm>
          <Popconfirm
            title='Delete this token and its synced data?'
            onConfirm={() => delToken(token.id)}
            okText='Yes'
            cancelText='No'
          >
            <Button
              size='small'
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </span>
      )
    }
  ]

  return (
    <div className='pd1y'>
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={tokens}
          rowKey='id'
          size='small'
          pagination={false}
        />
      </Spin>
    </div>
  )
}
