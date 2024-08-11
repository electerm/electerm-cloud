import React from 'react'
import User from './user'
import { UserDef } from './interface'
import UserForm from './user-form'
import { Spin, Button, Input, List } from 'antd'

export default function Users (props: any): JSX.Element {
  const isLoading = props.loading === 'all'
  const hasMore = props.start !== ''
  const listProps: any = {
    itemLayout: 'horizontal',
    dataSource: props.users,
    renderItem: (user: UserDef) => {
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
    }
  }
  function handleChange (e: any): void {
    props.onChangeSearch(e.target.value)
  }
  return (
    <div className='users pd1y'>
      <h2 className='fix'>
        <span className='fleft'>Users ({props.count})</span>
      </h2>
      <div>
        <Input.Search
          placeholder='Search user by id'
          value={props.txt}
          onChange={handleChange}
          onPressEnter={props.handleSearchUser}
          enterButton
          onSearch={props.handleSearchUser}
          allowClear
        />
      </div>
      <Spin spinning={isLoading}>
        <List
          {...listProps}
        />
        <div className='pd1y aligncenter'>
          {
            hasMore && (
              <Button
                onClick={props.handleGetUsers}
              >
                More
              </Button>
            )
          }
        </div>
      </Spin>

    </div>
  )
}
