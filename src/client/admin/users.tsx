import React from 'react'
import User from './user'
import { UserDef } from './interface'
import { Spin } from 'antd'

export default function Users (props: any): JSX.Element {
  const isLoading = props.loading === 'all'
  return (
    <div className='users pd1y'>
      <h2 className='fix'>
        <span className='fleft'>Users</span>
      </h2>
      <Spin spinning={isLoading}>
        {
          props.users.map((user: UserDef, i: number) => {
            const itemProps = {
              user,
              delUser: props.delUser,
              loading: props.loading
            }
            return (
              <User
                key={user.id}
                {...itemProps}
              />
            )
          })
        }
      </Spin>
    </div>
  )
}
