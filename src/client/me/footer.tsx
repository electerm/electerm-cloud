import React from 'react'

export default function Footer (): JSX.Element {
  const links = [
    {
      url: 'https://github.com/zxdong262',
      title: '@ZHAO Xudong'
    }
  ]
  return (
    <div className='footer pd2y'>
      {
        links.map(item => (
          <a target='_blank' rel='noreferrer' href={item.url} key={item.url}>{item.title}</a>
        ))
      }
    </div>
  )
}
