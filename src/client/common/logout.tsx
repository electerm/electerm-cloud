import React from 'react'
import {
  Button
} from 'antd'
import {
  LogoutOutlined
} from '@ant-design/icons'
import AppControls from './app-controls'
import LangSelect from '../locales/lang-select'
import { t } from '../locales/lang'

export default function Logout (props: any): JSX.Element {
  return (
    <AppControls>
      <div className='account-actions'>
        <Button
          onClick={props.handleLogout}
          size='small'
          icon={<LogoutOutlined />}
        >
          {t('logout')}
        </Button>
        <LangSelect />
      </div>
    </AppControls>
  )
}
