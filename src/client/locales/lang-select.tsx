// lang-select.ts
import React, { useState } from 'react'
import { getLang } from './lang'
import { Radio } from 'antd'
import type { RadioChangeEvent } from 'antd'

const languages = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' }
]

export default function LangSelect (): JSX.Element {
  const [lang, setLang] = useState(getLang())
  function handleChange (e: RadioChangeEvent): void {
    const { value } = e.target
    ;(window as any).lang = value
    window.localStorage.setItem('lang', value)
    setLang(value)
    window.location.reload()
  }
  return (
    <Radio.Group
      value={lang}
      onChange={handleChange}
      optionType='button'
      buttonStyle='solid'
      size='small'
      options={languages}
    />
  )
}
