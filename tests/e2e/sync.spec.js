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
      id: 'xx',
      a: 1,
      b: 'ddfsadsfsdfsdfsdfsdfsdfsdfdsffffffffffffffffffffffffffffssdfsdffsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsfsdfsdfsdfsdfsdfsdfsdfsdfsfsdfsdfsdfsdfsdfsfsdfsdfsfdsfsdfsdfsdfsfsfsdfdsfsdfsdfsdfsdfsdfsdfsdfdsfsdfsdfsdfdsfsdfsdfsdfsdfsdfdsfdsfsdfsdfsdfsdfsdfsdfdsfsdfdsfdsf',
      c: [1, 2, 3],
      d: {
        e: 1,
        f: '2'
      },
      f: {
        g: 1,
        h: {
          i: JSON.stringify({
            j: 1,
            k: 'ddfsadsfsdfsdfsdfsdfsdfsdfdsffffffffffffffffffffffffffffssdfsdffsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsfsdfsdfsdfsdfsdfsdfsdfsdfsfsdfsdfsdfsdfsdfsfsdfsdfsfdsfsdfsdfsdfsfsfsdfdsfsdfsdfsdfsdfsdfsdfsdfdsfsdfsdfsdfdsfsdfsdfsdfsdfsdfdsfdsfsdfsdfsdfsdfsdfsdfdsfsdfdsfdsf'
          })
        }
      }
    })
    console.log('r', r)
    expect(r).toEqual('ok')
    const r1 = await createRequest('GET', null)
    console.log(r1)
    expect(r1.a).toEqual(1)
  })

  it('post', async () => {
    const r = await createRequest('POST', null)
    expect(r).toEqual('test ok')
  })
})
