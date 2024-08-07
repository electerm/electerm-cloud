/* eslint-env jest */

const axios = require('axios')
require('dotenv').config()

const token = process.env.TEST_TOKEN

function createRequest (method, data) {
  return axios({
    baseURL: 'http://127.0.0.1:5678/api/sync',
    headers: {
      Authorization: `Bearer ${token}`
    },
    method,
    data,
    proxy: false
  }).then(res => {
    return res.data
  })
}

describe('/api/sync', () => {
  it('put/get', async () => {
    const r = await createRequest('PUT', {
      a: 1
    })
    expect(!!r.id).toEqual(true)
    const r1 = await createRequest('GET', null)
    expect(r1.data).toEqual(JSON.stringify({ a: 1 }))
  })

  it('post', async () => {
    const r = await createRequest('POST', null)
    expect(r).toEqual('test ok')
  })
})
