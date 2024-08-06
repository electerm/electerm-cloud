import React from 'react'
import {
  Button,
  Popconfirm,
  message,
  Spin
} from 'antd'
import {
  CloseCircleFilled,
  CopyOutlined,
  ReloadOutlined,
  EyeFilled,
  EyeInvisibleOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

import { TokenDef1 } from './interface'

export default function Tokens (props: any): JSX.Element {
  const {
    token,
    reToken,
    delToken,
    toggleTokenShow,
    even,
    downloadData,
    previewData
  } = props
  const {
    id,
    lastUseTime,
    useCount,
    show
  } = token as TokenDef1

  function copy (): void {
    void navigator.clipboard.writeText(id)
    void message.success('Token Copied')
  }

  function del (): void {
    delToken(id)
  }

  function re (): void {
    reToken(id)
  }

  function toggle (): void {
    toggleTokenShow(id)
  }

  function preview (): void {
    previewData(id)
  }

  function download (): void {
    downloadData(id)
  }
  const loading = props.loading === id
  const cls = even as boolean
    ? 'pd2 token-item even'
    : 'pd2 token-item'
  return (
    <Spin spinning={loading}>
      <div className={cls}>
        <div className='pd1b'>
          <span>Last Use Time: <b>{dayjs(lastUseTime).format('YYYY-MM-DD HH:mm:ss')}</b></span>
          <span className='mg1l'>Use Count: <b>{useCount}</b></span>
        </div>
        <div className='pd1b wordbreak'>
          <span className='mg1r mg1b'>Access Token:</span>
          {
            show
              ? <span>{id}</span>
              : <span>{id.slice(0, 5)}*****</span>
          }
          {
            show
              ? <EyeInvisibleOutlined
                  className='pointer mg1l'
                  onClick={toggle}
                />
              : <EyeFilled
                  className='pointer mg1l'
                  onClick={toggle}
                />
          }
          <div className='pd1y'>
            <Button
              onClick={copy}
              className='mg1r mg1b'
              size='small'
              icon={<CopyOutlined />}
            >
              Copy
            </Button>
            <Popconfirm
              title='Are you sure to regenerate? Old token will be deleted.'
              onConfirm={re}
              okText='Yes'
              cancelText='No'
            >
              <Button
                className='mg1r mg1b'
                size='small'
                icon={<ReloadOutlined />}
              >
                Regenerate
              </Button>
            </Popconfirm>
            <Popconfirm
              title='Are you sure to delete? Data associated with this token will be deleted.'
              onConfirm={del}
              okText='Yes'
              cancelText='No'
            >
              <Button
                className='mg1r mg1b'
                size='small'
                icon={<CloseCircleFilled />}
              >
                Delete
              </Button>
            </Popconfirm>
            <Button
              type='dashed'
              onClick={preview}
              size='small'
              className='mg1r mg1b'
            >
              Preview Data
            </Button>
            <Button
              type='dashed'
              onClick={download}
              size='small'
              className='mg1r mg1b'
              icon={<DownloadOutlined />}
            >
              Download Data
            </Button>
          </div>
        </div>
      </div>
    </Spin>
  )
}
