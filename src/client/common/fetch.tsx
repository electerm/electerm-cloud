function getToken (): string {
  const isAdminPage = window.location.pathname.includes('/admin')
  const jwtKey = isAdminPage ? 'adminToken' : 'token'
  return window.localStorage.getItem(jwtKey) ?? ''
}

// double-submit csrf: readable cookie echoed back as a header on writes
function getCsrfToken (): string {
  const match = document.cookie.match(/(?:^|;\s*)(?:__Host-)?csrf=([^;]*)/)
  return match !== null ? decodeURIComponent(match[1]) : ''
}

function getHeader (): Object {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
  const csrf = getCsrfToken()
  if (csrf !== '') {
    headers['x-csrf-token'] = csrf
  }
  // legacy sessions still in localStorage keep working through the header;
  // same-origin cookies ride along automatically (credentials: same-origin)
  const token = getToken()
  if (token !== '') {
    headers.authorization = 'authorization ' + token
  }
  return headers
}

// function handleErr (error: Error): boolean {
//   console.log(error)
//   return false
// }

export default async function fetch (url: string, data: Object | undefined = undefined, method: string = 'POST'): Promise<any> {
  return await window.fetch(url, {
    method,
    credentials: 'same-origin',
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
