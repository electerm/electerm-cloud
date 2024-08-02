import React from 'react'
import User from './user'
import { UserDef } from './interface'
import UserForm from './user-form'
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
            if (props.editingUserId === user.id) {
              return (
                <div key={user.id}>
                  <UserForm
                    user={user}
                    onSave={props.onSave}
                    editing={props.editing}
                    onCancel={props.onCancel}
                    form={props.form}
                  />
                </div>
              )
            }

            const itemProps = {
              user,
              delUser: props.delUser,
              loading: props.loading,
              onSelectEdit: props.onSelectEdit
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
