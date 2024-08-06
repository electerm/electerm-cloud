import React from 'react'
import {
  Button
} from 'antd'
import {
  LogoutOutlined
} from '@ant-design/icons'

export default function Logout (props: any): JSX.Element {
  return (
    <div className='pd2y'>
      <Button
        onClick={props.handleLogout}
        size='small'
        icon={<LogoutOutlined />}
      >
        Logout
      </Button>
    </div>
  )
}
