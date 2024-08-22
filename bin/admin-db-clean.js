const axios = require('axios')
const adminUser = process.env.ADMIN_USER_PROD
const adminPass = process.env.ADMIN_PASS_PROD
const url = process.env.ADMIN_INIT_DOMAIN_PROD
// const adminUser = process.env.ADMIN_USER
// const adminPass = process.env.ADMIN_PASS
// const url = process.env.ADMIN_INIT_DOMAIN
const apiUrl = `${url}/api/admin`

async function cleanDb () {
  const users = await axios.post(apiUrl, {
    func: 'list',
    tableName: 'User',
    params: []
  }, {
    proxy: false,
    auth: {
      username: adminUser,
      password: adminPass
    }
  }).then(res => {
    return res.data
  })
  const tokenIds = users.reduce((acc, user) => {
    return acc.concat(user.tokenIds.split(','))
  }, [])
  console.log('tokenIds', tokenIds)
  const dataIds = users.reduce((acc, user) => {
    return acc.concat(user.dataIds.split(','))
  }, [])
  console.log('dataIds', dataIds)
  const tokens = await axios.post(apiUrl, {
    func: 'list',
    tableName: 'Token',
    params: []
  }, {
    proxy: false,
    auth: {
      username: adminUser,
      password: adminPass
    }
  }).then(res => {
    return res.data
  })
  console.log('tokens count', tokens.length)
  for (const token of tokens) {
    console.log('token id', token.id)
    if (!tokenIds.includes(token.id)) {
      await axios.post(apiUrl, {
        func: 'delete',
        tableName: 'Token',
        params: [token.id]
      }, {
        proxy: false,
        auth: {
          username: adminUser,
          password: adminPass
        }
      }).catch(err => {
        console.log(err.message)
      })
    }
  }
  const datas = await axios.post(apiUrl, {
    func: 'list',
    tableName: 'Data',
    params: []
  }, {
    proxy: false,
    auth: {
      username: adminUser,
      password: adminPass
    }
  }).then(res => {
    return res.data
  })
  console.log('datas count', datas.length)
  for (const data of datas) {
    if (!dataIds.includes(data.id)) {
      await axios.post(apiUrl, {
        func: 'delete',
        tableName: 'Data',
        params: [data.id]
      }, {
        proxy: false,
        auth: {
          username: adminUser,
          password: adminPass
        }
      }).catch(err => {
        console.log(err.message)
      })
    }
  }
}

cleanDb()
  .then(() => console.log('Script completed.'))
  .catch(err => console.error('Something went wrong:', err.message))
