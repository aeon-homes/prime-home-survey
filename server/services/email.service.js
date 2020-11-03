const postgresClient = require('../clients/postgresClient')
const ERROR_MESSAGES = require('../enum/errorMessages.enum')
const DATABASE_TABLES = require('../enum/databaseTables.enum')

const validateEmailAgainstDatabase = async ({ email, year }) => {
  const { pgClient, done } = await postgresClient.getPostgresConnection()

  if (!pgClient) {
    throw new Error(ERROR_MESSAGES.DATABASE_ERROR)
  }

  let emailResult

  try {
    const queryString = `SELECT * FROM ${DATABASE_TABLES.RESIDENT_EMAILS} WHERE lower(email)=$1 AND year=$2`
    const queryParams = [email.toLowerCase(), year]
    emailResult = await postgresClient.queryClient(pgClient, queryString, queryParams)
  } catch (error) {
    console.error(error)
    throw new Error(ERROR_MESSAGES.DATABASE_ERROR)
  } finally {
    done()
  }

  const emailRecord = emailResult && emailResult.rows && emailResult.rows[0]

  if (!emailRecord || !emailRecord.active) throw new Error(ERROR_MESSAGES.EMAIL_NOT_FOUND)

  if (emailRecord.paid) throw new Error(ERROR_MESSAGES.EMAIL_ALREADY_SUBMITTED)
}

const setEmailAsPaid = async ({ email, year, referenceId }) => {
  const { pgClient, done } = await postgresClient.getPostgresConnection()

  if (!pgClient) {
    throw new Error(ERROR_MESSAGES.DATABASE_ERROR)
  }

  try {
    const queryString = 'UPDATE resident_emails set paid=true, reference_id=$1 where lower(email)=$2 and year=$3'
    const queryParams = [referenceId, email.toLowerCase(), year]
    await postgresClient.queryClient(pgClient, queryString, queryParams)
  } catch (error) {
    console.error(error)
    throw new Error(ERROR_MESSAGES.DATABASE_ERROR)
  } finally {
    done()
  }
}

module.exports = {
  setEmailAsPaid,
  validateEmailAgainstDatabase
}
