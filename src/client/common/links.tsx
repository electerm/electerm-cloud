import React from 'react'

export default function Links (): JSX.Element {
  const links = [
    {
      url: 'https://electerm.html5beta.com',
      title: 'Home Page'
    },
    {
      url: 'https://github.com/electerm/electerm',
      title: 'GitHub'
    },
    {
      url: 'https://github.com/electerm/electerm-web',
      title: 'electerm-web'
    },
    {
      url: 'https://github.com/electerm/electerm-web-docker',
      title: 'electerm-web-docker'
    },
    {
      url: 'https://github.com/electerm/electerm-locales',
      title: 'electerm-locales'
    },
    {
      url: 'https://www.microsoft.com/store/apps/9NCN7272GTFF',
      title: 'Windows Store'
    },
    {
      url: 'https://snapcraft.io/electerm',
      title: 'Snap Store'
    },
    {
      url: 'https://github.com/electerm/electerm/wiki/Know-issues',
      title: 'Know issues'
    },
    {
      url: 'https://github.com/electerm/electerm/wiki/Troubleshoot',
      title: 'Troubleshoot'
    },
    {
      url: 'https://github.com/electerm/electerm/discussions',
      title: 'Discussion'
    },
    {
      url: 'https://electerm.html5beta.com/sponsor-electerm.html',
      title: 'Sponsor Electerm'
    },
    {
      url: 'https://github.com/mbadolato/iTerm2-Color-Schemes/tree/master/electerm',
      title: 'Themes'
    }
  ]
  return (
    <div>
      <h2>Links</h2>
      <div className='pd2y'>
        {
          links.map(item => (
            <div key={item.url} className='pd1b'>
              <a target='_blank' rel='noreferrer' href={item.url}>{item.title}</a>
            </div>
          ))
        }
      </div>
    </div>
  )
}
