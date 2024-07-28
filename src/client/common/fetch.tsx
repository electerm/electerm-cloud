// the final fetch wrapper
const jwtKey = 'token'

function getToken (): string {
  return window.localStorage.getItem(
    jwtKey
  ) ?? ''
}

function getHeader (): Object {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    authorization: 'authorization ' + getToken()
  }
}

// function handleErr (error: Error): boolean {
//   console.log(error)
//   return false
// }

export default async function fetch (url: string, data: Object = {}, method: string = 'POST'): Promise<any> {
  return await window.fetch(url, {
    method,
    headers: getHeader() as any,
    body: JSON.stringify(data)
  })
    .then(async res => {
      if (res.status > 304) {
        const text = await res.text()
        throw new Error(`${res.status} ${res.statusText}: ${text}`)
      }
      return res
    })
    .then(async res => await res.json())
}
