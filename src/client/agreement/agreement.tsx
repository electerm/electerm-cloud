import React, { useEffect } from 'react'
import { t } from '../locales/lang'
import Links from '../common/links'
import Footer from '../common/footer'
import LangSelect from '../locales/lang-select'
import Logo from '../common/logo'

export default function Agreement (): JSX.Element {
  useEffect(() => {
    document.getElementById('content-loading')?.remove()
  }, [])

  return (
    <div className='wrap'>
      <div className='pd1y'>
        <LangSelect />
      </div>
      <Logo />
      <div className='pd2y'>
        <a href='/'>← {t('backToHome')}</a>
      </div>
      <h1>{t('agreement')}</h1>
      <div className='pd2y'>
        {
          t('agreementContent').split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))
        }
      </div>
      <Links />
      <Footer />
    </div>
  )
}
