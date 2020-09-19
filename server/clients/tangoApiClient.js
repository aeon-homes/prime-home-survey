const axios = require('axios')

const getCatalog = () => {
  const apiUser = process.env.TANGO_API_ENABLE_PROD ? process.env.TANGO_API_USER : process.env.TANGO_API_USER_SANDBOX
  const apiPassword = process.env.TANGO_API_ENABLE_PROD ? process.env.TANGO_API_KEY : process.env.TANGO_API_KEY_SANDBOX

  console.log(apiUser, apiPassword)

  return axios({
    url: 'https://integration-api.tangocard.com/raas/v2/catalogs',
    auth: {
      username: apiUser,
      password: apiPassword
    }
  })
}

module.exports = {
  getCatalog
}
