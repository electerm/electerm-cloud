import React, { useEffect, useRef } from 'react'
import { Input, InputProps, InputRef } from 'antd'

const AutoFocusInput: React.FC<InputProps> = (props) => {
  const inputRef = useRef<InputRef>(null)

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current === null) {
        return
      }
      inputRef.current.focus()
    }, 100)
  }, [])

  return <Input ref={inputRef} {...props} />
}

export default AutoFocusInput
