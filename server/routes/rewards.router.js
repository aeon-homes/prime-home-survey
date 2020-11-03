const express = require('express')

const router = express.Router()
const tangoApiClient = require('../clients/tangoApiClient.js')
const rewardService = require('../services/reward.service.js')
const ERROR_MESSAGES = require('../enum/errorMessages.enum')
const ROLES = require('../enum/userRoles.enum')

// GET list of all properties the site manager is authorized for
router.get('/test', async (req, res) => {
  console.info('GET /rewards/test')

  if (!req.isAuthenticated() || req.user.role !== ROLES.ADMINISTRATOR) {
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
  if (!req.isAuthenticated() || req.user.role !== ROLES.RESIDENT) {
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

router.post('/address', async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== ROLES.VOLUNTEER) {
    res.sendStatus(403)
    return
  }

  console.log(req.body)

  const { property, unit, type } = req.body
  const { name, addressOne, addressTwo, city, state, zip } = req.body.address

  if (!property || !unit || !type || !name || !addressOne || !city || !state || !zip) {
    res.sendStatus(400)
    return
  }

  try {
    await rewardService.storeAddressReward({ 
      year: new Date().getFullYear(),
      property, 
      unit, 
      type, 
      name,
      addressOne, 
      addressTwo: addressTwo || '', 
      city, 
      state, 
      zip 
    })
    res.sendStatus(200)
  } catch (error) {
    console.error(error)
    res.send(500)
  }
})

module.exports = router
