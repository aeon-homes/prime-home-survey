const express = require('express')

const router = express.Router()
const tangoApiClient = require('../clients/tangoApiClient.js')

// GET list of all properties the site manager is authorized for
router.get('/test', async (req, res) => {
  console.log('/api/test')

  if (!req.isAuthenticated() || req.user.role !== 'Administrator') {
    res.sendStatus(403)
    return
  }

  try {
    const apiResult = await tangoApiClient.getCatalog()
    console.log(apiResult)
    res.send(apiResult.data)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})

module.exports = router
