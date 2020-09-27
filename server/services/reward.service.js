const tangoApiClient = require('../clients/tangoApiClient')
const emailService = require('./email.service')
const ERROR_MESSAGES = require('../enum/errorMessages.enum')

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
  submitEmailForTangoReward
}
