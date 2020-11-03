const postgresClient = require('../clients/postgresClient')
const tangoApiClient = require('../clients/tangoApiClient')
const emailService = require('./email.service')
const ERROR_MESSAGES = require('../enum/errorMessages.enum')
const DATABASE_TABLES = require('../enum/databaseTables.enum')

const storeAddressReward = async ({ year, property, unit, type, name, addressOne, addressTwo, city, state, zip }) => {
  const { pgClient, done } = await postgresClient.getPostgresConnection()

  if (!pgClient) {
    throw new Error(ERROR_MESSAGES.DATABASE_ERROR)
  }

  try {
    const queryString = `INSERT INTO ${DATABASE_TABLES.VOLUNTEER_GIFT_CARDS} (year, property, unit, type, name, addressOne, addressTwo, city, state, zip) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
    const queryParams = [year, property, unit, type, name, addressOne, addressTwo, city, state, zip]

    await postgresClient.queryClient(pgClient, queryString, queryParams)
  } catch (error) {
    console.error(error)
    throw error
  } finally {
    done()
  }
}

const submitEmailForTangoReward = async ({ email, year }) => {
  await emailService.validateEmailAgainstDatabase({ email, year })
  
  const apiResult = await tangoApiClient.submitEmail(email)

  if (apiResult.status === 201) {
    console.info(`Tango API result for ${email}: `, apiResult.data)

    const { externalRefID: referenceId } = apiResult.data
  
    await emailService.setEmailAsPaid({ email, year, referenceId })  
  } else {
    throw new Error(ERROR_MESSAGES.TANGO_API_ERROR)
  }
}

module.exports = {
  storeAddressReward,
  submitEmailForTangoReward
}
