const uuid = require('uuid')
const axios = require('axios')

/**
 * apiUser is the human-readable account name on the Tango web console.
 * apiPassword is the API key
 * apiAccountId is in the result from calling the /accounts endpoint
 * apiCustomerId is in the result from /customers
 * apiEmailTemplateId is from the web console
 * apiRewardId is from the /catalogs endpoint
 */
const apiRoot = process.env.TANGO_API_ENABLE_PROD === 'true' ? 'https://api.tangocard.com/raas/v2/' : 'https://integration-api.tangocard.com/raas/v2/'
const apiUser = process.env.TANGO_API_ENABLE_PROD === 'true' ? process.env.TANGO_API_USER : process.env.TANGO_API_USER_SANDBOX
const apiPassword = process.env.TANGO_API_ENABLE_PROD === 'true' ? process.env.TANGO_API_KEY : process.env.TANGO_API_KEY_SANDBOX
const apiAccountId = process.env.TANGO_API_ENABLE_PROD === 'true' ? process.env.TANGO_API_ACCOUNT_ID : process.env.TANGO_API_ACCOUNT_ID_SANDBOX
const apiCustomerId = process.env.TANGO_API_ENABLE_PROD === 'true' ? process.env.TANGO_API_CUSTOMER_ID : process.env.TANGO_API_CUSTOMER_ID_SANDBOX
const apiEmailTemplateId = process.env.TANGO_API_ENABLE_PROD === 'true' ? process.env.TANGO_API_EMAIL_TEMPLATE_ID : process.env.TANGO_API_EMAIL_TEMPLATE_ID_SANDBOX
const apiRewardId = process.env.TANGO_API_ENABLE_PROD === 'true' ? process.env.TANGO_API_REWARD_ID : process.env.TANGO_API_REWARD_ID_SANDBOX

const GIFT_CARD_AMOUNT = process.env.TANGO_API_GIFT_CARD_AMOUNT || 5

const tangoGet = ({ path }) => axios({
  url: `${apiRoot}${path}`,
  auth: {
    username: apiUser,
    password: apiPassword
  }
})

const tangoPost = ({ path, data }) => axios({
  url: `${apiRoot}${path}`,
  method: 'POST',
  data,
  auth: {
    username: apiUser,
    password: apiPassword
  }
})

const getCatalog = () => {
  console.log(process.env.TANGO_API_ENABLE_PROD)
  console.log(apiRoot)
  console.log(apiUser)
  console.log(apiPassword)
  console.log(apiAccountId)
  console.log(apiCustomerId)
  console.log(apiEmailTemplateId)
  console.log(apiRewardId)
  return tangoGet({ path: 'catalogs' })
}

const submitEmail = (email) => {
  const submitOrderBody = {
    accountIdentifier: apiAccountId,
    amount: GIFT_CARD_AMOUNT,
    customerIdentifier: apiCustomerId,
    etid: apiEmailTemplateId,
    externalRefID: uuid.v1(),
    recipient: {
      email,
      firstName: 'Aeon',
      lastName: 'Resident'
    },
    sendEmail: true,
    utid: apiRewardId
  }

  return tangoPost({ path: 'orders', data: submitOrderBody })
}

module.exports = {
  getCatalog,
  submitEmail
}
