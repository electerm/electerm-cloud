// the final fetch wrapper
function getToken (): string {
  const isAdminPage = window.location.pathname.includes('/admin')
  const jwtKey = isAdminPage ? 'adminToken' : 'token'
  return window.localStorage.getItem(jwtKey) ?? ''
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

export default async function fetch (url: string, data: Object | undefined = undefined, method: string = 'POST'): Promise<any> {
  return await window.fetch(url, {
    method,
    headers: getHeader() as any,
    body: data !== undefined ? JSON.stringify(data) : undefined
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
