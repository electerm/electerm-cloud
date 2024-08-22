const axios = require('axios')
const adminUser = process.env.ADMIN_USER_PROD
const adminPass = process.env.ADMIN_PASS_PROD
const url = process.env.ADMIN_INIT_DOMAIN_PROD
// const adminUser = process.env.ADMIN_USER
// const adminPass = process.env.ADMIN_PASS
// const url = process.env.ADMIN_INIT_DOMAIN
const apiUrl = `${url}/api/admin`

const initialStaticsData = [
  { id: 'userCount', value: 4 },
  { id: 'tokenCount', value: 5 },
  { id: 'tokenUseCount', value: 13 }
  // Add any other initial statics you want to track
]

async function initStaticsDb () {
  console.log('Starting Statics database initialization...')
  for (const staticData of initialStaticsData) {
    try {
      await axios.post(apiUrl, {
        func: 'create',
        tableName: 'Statics',
        params: [staticData]
      }, {
        proxy: false,
        auth: {
          username: adminUser,
          password: adminPass
        }
      })
      console.log(`Created Statics entry: ${staticData.id}`)
    } catch (error) {
      console.error(`Error creating Statics entry ${staticData.id}:`, error.response ? error.response.data : error.message)
    }
  }
  console.log('Statics database initialization completed.')
}

initStaticsDb()
  .then(() => console.log('Script completed.'))
  .catch(err => console.error('Something went wrong:', err.message))
