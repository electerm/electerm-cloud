import React from 'react'
import { t } from '../locales/lang'

export default function Logo (): JSX.Element {
  return (
    <div className='pd3y'>
      <img
        src='https://electerm.org/electerm.png'
        alt=''
        className='logo iblock'
      />
      <p className='pd1y'>
        {t('electermCloud')}
      </p>
    </div>
  )
}
