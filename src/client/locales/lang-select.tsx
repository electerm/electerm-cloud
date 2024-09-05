// lang-select.ts
import React, { useState } from 'react'
import { getLang } from './lang'
import { Select } from 'antd'

const { Option } = Select

export default function LangSelect (): JSX.Element {
  const [lang, setLang] = useState(getLang())
  function handleChange (value: string): void {
    ;(window as any).lang = value
    window.localStorage.setItem('lang', value)
    setLang(value)
    window.location.reload()
  }
  const sleProps = {
    value: lang,
    onChange: handleChange
  }
  return (
    <Select
      {...sleProps}
      size='small'
    >
      <Option value='en'>English</Option>
      <Option value='cn'>中文</Option>
    </Select>
  )
}
