import React from 'react'
import Token from './token'
import { TokenDef } from './interface'
import { Spin, Button } from 'antd'
import { PlusCircleFilled } from '@ant-design/icons'

export default function Tokens (props: any): JSX.Element {
  const isLoading = props.loading === 'all'
  const disable = props.loading === 'add'
  return (
    <div className='tokens pd1y'>
      <h2 className='fix'>
        <span className='fleft'>Tokens</span>
        <span className='fright'>
          <Button
            onClick={props.handleAdd}
            loading={disable}
            size='small'
            icon={<PlusCircleFilled />}
          >
            New Token
          </Button>
        </span>
      </h2>
      <Spin spinning={isLoading}>
        {
          props.tokens.map((token: TokenDef, i) => {
            const itemProps = {
              token,
              reToken: props.reToken,
              delToken: props.delToken,
              toggleTokenShow: props.toggleTokenShow,
              loading: props.loading,
              downloadData: props.downloadData,
              previewData: props.previewData,
              even: i % 2 === 0
            }
            return (
              <Token
                key={token.id}
                {...itemProps}
              />
            )
          })
        }
      </Spin>
    </div>
  )
}
