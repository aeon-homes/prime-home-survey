const express = require('express')
const authUtil = require('../util/auth.util')
const ROLES = require('../enum/userRoles.enum')

const router = express.Router()

// clear all server session information about this user
router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

// Handles Ajax request for user information if user is authenticated
router.get('/:role?', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.RESIDENT, ROLES.VOLUNTEER, ROLES.ADMINISTRATOR, ROLES.SITE_MANAGER])) {
    res.sendStatus(403)
    return
  }

  if ((req.params.role === 'any') || (req.params.role === undefined)) {
    const userInfo = {
      username: req.user.username,
    }
    if (req.user.role) {
      userInfo.role = req.user.role
    }
    res.send(userInfo)
  } else if ((req.params.role === 'Aeon') && ((req.user.role === ROLES.ADMINISTRATOR) || (req.user.role === ROLES.SITE_MANAGER))) {
    res.send({
      username: req.user.username,
      role: req.user.role,
    })
  } else if (req.user.role === req.params.role) {
    res.send({
      username: req.user.username,
      role: req.user.role,
    })
  } else if (req.params.role === ROLES.RESIDENT && req.user.role === ROLES.VOLUNTEER) {
    res.send({
      username: req.user.username,
      role: req.user.role
    })
  } else {
    console.info('user auth failure - likely you requested a page that your current role is not authorized for')
    res.sendStatus(403)
  }
})

module.exports = router
