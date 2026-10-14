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

  it('put/get a large client-encrypted payload (the production 500 case)', async () => {
    // With a sync password the client encrypts bookmarks.json with
    // aes-256-gcm, hex-encoded: ~204KB for a large bookmark set. The old
    // hex server-side encoding pushed the stored DynamoDB item to ~412KB,
    // over the 400KB cap, and the upload failed with an opaque 500.
    const bookmarks = 'gcm:' + 'a1b2c3d4'.repeat(25500)
    const profiles = 'gcm:' + 'e5f6a7b8'.repeat(100)
    const r = await createRequest('PUT', {
      description: 'sync electerm data',
      files: {
        'bookmarks.json': { content: bookmarks },
        'bookmarks.order.json': { content: 'empty' },
        'profiles.json': { content: profiles }
      }
    })
    expect(r).toEqual('ok')
    const r1 = await createRequest('GET', null)
    expect(r1.files['bookmarks.json'].content).toEqual(bookmarks)
    expect(r1.files['profiles.json'].content).toEqual(profiles)
  })

  it('413 with a clear message when the payload exceeds the limit', async () => {
    let err
    try {
      await createRequest('PUT', {
        files: { 'bookmarks.json': { content: 'x'.repeat(300 * 1024) } }
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err.response.status).toEqual(413)
    expect(err.response.data).toContain('too large')
  })
})
