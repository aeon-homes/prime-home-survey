const uuid = require('uuid')
const axios = require('axios')

const apiUser = process.env.TANGO_API_ENABLE_PROD ? process.env.TANGO_API_USER : process.env.TANGO_API_USER_SANDBOX
const apiPassword = process.env.TANGO_API_ENABLE_PROD ? process.env.TANGO_API_KEY : process.env.TANGO_API_KEY_SANDBOX
const apiAccountId = process.env.TANGO_API_ENABLE_PROD ? process.env.TANGO_API_ACCOUNT_ID : process.env.TANGO_API_ACCOUNT_ID_SANDBOX
const apiCustomerId = process.env.TANGO_API_ENABLE_PROD ? process.env.TANGO_API_CUSTOMER_ID : process.env.TANGO_API_CUSTOMER_ID_SANDBOX
const apiEmailTemplateId = process.env.TANGO_API_ENABLE_PROD ? process.env.TANGO_API_EMAIL_TEMPLATE_ID : process.env.TANGO_API_EMAIL_TEMPLATE_ID_SANDBOX
const apiRewardId = process.env.TANGO_API_ENABLE_PROD ? process.env.TANGO_API_REWARD_ID : process.env.TANGO_API_REWARD_ID_SANDBOX

const GIFT_CARD_AMOUNT = 10

const apiRoot = 'https://integration-api.tangocard.com/raas/v2/'

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
