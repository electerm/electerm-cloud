const axios = require('axios')
require('dotenv').config() // If you're using a .env file

const adminUser = process.env.ADMIN_USER
const adminPass = process.env.ADMIN_PASS
const adminGithubLogin = process.env.ADMIN_GITHUB_LOGIN
const url = process.env.ADMIN_INIT_DIMAIN

const apiUrl = `${url}/api/admin` // Replace with your actual domain

const adminUserData = {
  id: `github-${adminGithubLogin}`,
  name: adminGithubLogin,
  githubLogin: adminGithubLogin,
  email: `${adminGithubLogin}@example.com`, // You might want to set a real email
  avatarUrl: '', // You can leave this empty or set a default
  githubId: '0' // You might want to set a real GitHub ID if available
}

async function initAdminUser () {
  try {
    const response = await axios.post(apiUrl, {
      func: 'create',
      params: [adminUserData]
    }, {
      auth: {
        username: adminUser,
        password: adminPass
      }
    })

    console.log('Admin user created successfully:', response.data)
  } catch (error) {
    console.error('Error creating admin user:', error.response ? error.response.data : error.message)
  }
}

initAdminUser()
