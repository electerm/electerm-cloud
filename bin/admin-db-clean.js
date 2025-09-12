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
  // Identify users without tokens and mark them for deletion
  const usersToDelete = []
  const validUsers = []

  for (const user of users) {
    const userTokenIds = user.tokenIds.split(',').filter(t => t !== '')
    if (userTokenIds.length === 0) {
      usersToDelete.push(user.id)
      console.log('User without tokens to be deleted:', user.id)
    } else {
      validUsers.push(user)
    }
  }

  const tokenIds = validUsers.reduce((acc, user) => {
    return acc.concat(user.tokenIds.split(',').filter(t => t !== ''))
  }, [])
  console.log('tokenIds', tokenIds)
  const dataIds = validUsers.reduce((acc, user) => {
    return acc.concat(user.dataIds.split(',').filter(d => d !== ''))
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
  let tokenCount = tokens.length
  const userCount = validUsers.length // Use validUsers count instead of all users
  console.log('valid user count', userCount)
  console.log('users to delete count', usersToDelete.length)

  // Delete users without tokens first
  for (const userId of usersToDelete) {
    console.log('deleting user id', userId)
    await axios.post(apiUrl, {
      func: 'delete',
      tableName: 'User',
      params: [userId]
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

  await axios.post(apiUrl, {
    func: 'update',
    tableName: 'Statics',
    params: [{ id: 'userCount', value: userCount }]
  }, {
    proxy: false,
    auth: {
      username: adminUser,
      password: adminPass
    }
  }).catch(err => {
    console.log(err.message)
  })
  const tokensTOdel = []
  for (const token of tokens) {
    console.log('token id', token.id)
    if (!tokenIds.includes(token.id)) {
      tokensTOdel.push(token.id)
      tokenCount--
    }
  }
  console.log('token count', tokenCount)
  await axios.post(apiUrl, {
    func: 'update',
    tableName: 'Statics',
    params: [{ id: 'tokenCount', value: tokenCount }]
  }, {
    proxy: false,
    auth: {
      username: adminUser,
      password: adminPass
    }
  }).catch(err => {
    console.log(err.message)
  })
  for (const token of tokensTOdel) {
    console.log('token id', token)
    await axios.post(apiUrl, {
      func: 'delete',
      tableName: 'Token',
      params: [token]
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

  // Clean up orphaned data (data not referenced by valid users)
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
