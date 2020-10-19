const express = require('express')

const router = express.Router()
const tangoApiClient = require('../clients/tangoApiClient.js')
const rewardService = require('../services/reward.service.js')
const ERROR_MESSAGES = require('../enum/errorMessages.enum')

// GET list of all properties the site manager is authorized for
router.get('/test', async (req, res) => {
  console.info('GET /rewards/test')

  if (!req.isAuthenticated() || req.user.role !== 'Administrator') {
    res.sendStatus(403)
    return
  }

  try {
    const apiResult = await tangoApiClient.getCatalog()
    console.info(apiResult)
    res.send(apiResult.data)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

router.post('/email', async (req, res) => {
  console.info('POST /rewards/email')

  if (!req.isAuthenticated() || req.user.role !== 'Resident') {
    res.sendStatus(403)
    return
  }

  try {
    await rewardService.submitEmailForTangoReward({ email: req.body.email, year: new Date().getFullYear() })
    res.sendStatus(200)
  } catch (error) {
    console.error(error)
    if (error.message === ERROR_MESSAGES.EMAIL_NOT_FOUND || error.message === ERROR_MESSAGES.EMAIL_ALREADY_SUBMITTED) {
      res.status(400).send({ error: error.message })
    } else {
      console.error('Tango API Error', JSON.stringify(error))
      res.sendStatus(500)
    }
  }
})

module.exports = router
