const axios = require('axios')

const adminUser = process.env.ADMIN_USER
const adminPass = process.env.ADMIN_PASS
const url = process.env.ADMIN_INIT_DOMAIN

// const adminUser = process.env.ADMIN_USER_PROD
// const adminPass = process.env.ADMIN_PASS_PROD
// const url = process.env.ADMIN_INIT_DOMAIN_PROD
// const adminGithubLogin = process.env.ADMIN_GITHUB_LOGIN

const apiUrl = `${url}/api/admin` // Replace with your actual domain
const arr = [
  'AdminUser',
  'User',
  'Token',
  'Data'
]
async function clear () {
  for (const tableName of arr) {
    try {
      const response = await axios.post(apiUrl, {
        func: 'clear',
        tableName,
        params: []
      }, {
        proxy: false,
        auth: {
          username: adminUser,
          password: adminPass
        }
      })
      console.log('clear data successfully for table : ' + tableName, response.data)
    } catch (error) {
      console.error('Error clear data for table: ' + tableName, error.response ? error.response.data : error.message)
    }
  }
}

clear()
