// user-form.tsx
import React, { useEffect } from 'react'
import { Form, Button, Select, InputNumber, FormInstance, Spin } from 'antd'
import { UserDef } from './interface'

const { Option } = Select

interface UserFormProps {
  user: UserDef | null
  onSave: (id: string, update: Object) => void
  onCancel: () => void
  form: FormInstance
  editing: string
}

export default function UserForm (props: UserFormProps): JSX.Element | null {
  const { user, onSave, form, editing } = props

  if (user === null) {
    return null
  }

  useEffect(() => {
    if (user !== null) {
      form.setFieldsValue({
        tokenLimit: user.tokenLimit,
        status: user.status
      })
    }
  }, [user])

  function handleSubmit (values: any): void {
    onSave((user as UserDef).id, values)
  }
  const formProps = {
    form,
    initialValues: {
      tokenLimit: user.tokenLimit,
      status: user.status
    },
    onFinish: handleSubmit
  }
  const loading = props.editing === user.id
  return (
    <Spin spinning={loading}>
      <Form
        {...formProps}
      >
        <h2>User: {user.name} @{user.githubLogin}</h2>
        <Form.Item
          name='tokenLimit'
          label='Token Limit'
          rules={[
            {
              required: true,
              message: 'Please enter the token limit'
            }
          ]}
        >
          <InputNumber min={1} max={100} />
        </Form.Item>
        <Form.Item
          name='status'
          label='Status'
          rules={[
            {
              required: true,
              message: 'Please select the status'
            }
          ]}
        >
          <Select>
            <Option>Active</Option>
            <Option>Disabled</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button
            type='primary'
            htmlType='submit'
          >
            Save
          </Button>
          <Button
            onClick={() => props.onCancel()}
            className='mg1l'
          >
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  )
}
