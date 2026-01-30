import React from 'react'

export default function Footer (): JSX.Element {
  const links = [
    {
      url: 'https://github.com/zxdong262',
      title: '@ZHAO Xudong'
    },
    {
      url: '/agreement',
      title: 'Agreement'
    }
  ]
  return (
    <div className='footer pd2y'>
      {
        links.map((item, i) => {
          const cls = i === 0 ? '' : 'mg2l'
          return (
            <a
              target='_blank'
              rel='noreferrer'
              href={item.url}
              key={item.url}
              className={cls}
            >
              {item.title}
            </a>
          )
        })
      }
    </div>
  )
}
