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
  DownloadOutlined,
  JavaScriptOutlined,
  EditOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { TokenDef1 } from './interface'
import { t } from '../locales/lang'

export default function Tokens (props: any): JSX.Element {
  const {
    token,
    reToken,
    delToken,
    toggleTokenShow,
    even,
    downloadData,
    previewData,
    onEdit
  } = props
  const {
    id,
    lastUseTime,
    useCount,
    dataId,
    show,
    name
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
    previewData(dataId)
  }

  function download (): void {
    downloadData(dataId)
  }

  function openEdit (): void {
    onEdit(id, name)
  }
  const loading = props.loading === id
  const cls = even as boolean
    ? 'pd2 token-item even'
    : 'pd2 token-item'
  return (
    <Spin spinning={loading}>
      <div className={cls}>
        <div className='pd1b'>
          <span className='token-name-wrap mg2r'>
            <b className='color-blue mg1r font16'>{name ?? 'Token noname'}</b>
            <EditOutlined
              className='pointer edit-token-icon'
              onClick={openEdit}
            />
          </span>
          <span>
            <span className='font13 color-grey mg1r'>{t('lastUseTime')}:</span>
            <b>{dayjs(lastUseTime).format('YYYY-MM-DD HH:mm:ss')}</b>
          </span>
          <span className='mg1l'>
            <span className='font13 color-grey mg1r'>{t('useCount')}:</span>
            <b>{useCount}</b>
          </span>
        </div>
        <div className='pd1b wordbreak token-str'>
          <span className='mg1r mg1b'>{t('accessToken')}:</span>
          {
            show
              ? <span className='color-grey'>{id}</span>
              : <span className='color-grey'>{id.slice(0, 42)}...{id.slice(-3)}</span>
          }
          {
            show
              ? <EyeInvisibleOutlined
                  className='pointer mg1l token-control'
                  onClick={toggle}
                />
              : <EyeFilled
                  className='pointer mg1l token-control'
                  onClick={toggle}
                />
          }
          <div className='pd1y token-control'>
            <Button
              onClick={copy}
              className='mg1r mg1b'
              size='small'
              icon={<CopyOutlined />}
            >
              {t('copy')}
            </Button>
            <Popconfirm
              title={t('areYouSureToDelete')}
              onConfirm={re}
              okText='Yes'
              cancelText='No'
            >
              <Button
                className='mg1r mg1b'
                size='small'
                icon={<ReloadOutlined />}
              >
                {t('regenerate')}
              </Button>
            </Popconfirm>
            <Popconfirm
              title={t('areYouSureToRegenerate')}
              onConfirm={del}
              okText='Yes'
              cancelText='No'
            >
              <Button
                className='mg1r mg1b'
                size='small'
                icon={<CloseCircleFilled />}
              >
                {t('delete')}
              </Button>
            </Popconfirm>
            <Button
              type='dashed'
              onClick={preview}
              size='small'
              className='mg1r mg1b'
              icon={<JavaScriptOutlined />}
            >
              {t('previewData')}
            </Button>
            <Button
              type='dashed'
              onClick={download}
              size='small'
              className='mg1r mg1b'
              icon={<DownloadOutlined />}
            >
              {t('downloadData')}
            </Button>
          </div>
        </div>
      </div>
    </Spin>
  )
}
