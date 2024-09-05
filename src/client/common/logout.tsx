import React from 'react'
import {
  Button
} from 'antd'
import {
  LogoutOutlined
} from '@ant-design/icons'
import LangSelect from '../locales/lang-select'
import { t } from '../locales/lang'

export default function Logout (props: any): JSX.Element {
  return (
    <div className='pd2y fix'>
      <Button
        onClick={props.handleLogout}
        size='small'
        className='fleft'
        icon={<LogoutOutlined />}
      >
        {t('logout')}
      </Button>
      <span className='fright'>
        <LangSelect />
      </span>
    </div>
  )
}
