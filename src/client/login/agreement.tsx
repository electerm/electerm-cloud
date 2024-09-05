import React from 'react'
import { t } from '../locales/lang'

export default function AgreeMent (): JSX.Element {
  return (
    <div>
      <h1>{t('agreement')}</h1>
      {
        t('agreementContent').split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))
      }
    </div>
  )
}
