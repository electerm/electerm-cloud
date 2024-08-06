const axios = require('axios')

const adminUser = process.env.ADMIN_USER
const adminPass = process.env.ADMIN_PASS
const url = process.env.ADMIN_INIT_DOMAIN

const apiUrl = `${url}/api/admin`

const generateUserData = (index) => {
  const username = `testuser_${index}`
  return {
    _id: `github-${username}`,
    name: username,
    email: `${username}@example.com`,
    githubId: username,
    githubLogin: username,
    avatarUrl: 'https://avatars.githubusercontent.com/u/123456789'
  }
}

async function createUser (userData, token) {
  const response = await axios.post(
    `${apiUrl}/api/admin`,
    {
      tableName: 'User',
      func: 'create',
      params: [userData]
    },
    {
      auth: {
        username: adminUser,
        password: adminPass
      }
    }
  )
  console.log(`Created: ${userData.name}`)
  return response.data
}

async function populateUsers (count = 30) {
  console.log('Starting user creation...')

  for (let i = 0; i < count; i++) {
    const userData = generateUserData(i + 1)
    await createUser(userData)
      .then(r => {
        console.log('succeed', i + 1)
      })
      .catch(err => {
        console.log(err)
      })
  }

  console.log(`Completed! Created ${count} users.`)
}

populateUsers()
  .then(() => console.log('Script completed.'))
  .catch(err => console.error('Something went wrong:', err.message))
