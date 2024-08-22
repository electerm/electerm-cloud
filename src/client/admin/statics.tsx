import React from 'react'

interface StaticResult {
  [key: string]: number
}

export default function Statics (props: any): JSX.Element {
  const res = props.statics as StaticResult
  return (
    <div>
      <h2>Statics</h2>
      <div>
        <div>User Count: {res.userCount ?? 0}</div>
        <div>Token Count: {res.tokenCount ?? 0}</div>
        <div>Token Use Count: {res.tokenUseCount ?? 0}</div>
      </div>
    </div>
  )
}
