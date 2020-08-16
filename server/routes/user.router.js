const express = require('express')

const router = express.Router()

// clear all server session information about this user
router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

// Handles Ajax request for user information if user is authenticated
router.get('/:role?', (req, res) => {
  if (req.isAuthenticated()) {
    if ((req.params.role === 'any') || (req.params.role === undefined)) {
      const userInfo = {
        username: req.user.username,
      }
      if (req.user.role) {
        userInfo.role = req.user.role
      }
      res.send(userInfo)
    } else if ((req.params.role === 'Aeon') && ((req.user.role === 'Administrator') || (req.user.role === 'Site Manager'))) {
      const userInfo = {
        username: req.user.username,
        role: req.user.role,
      }
      res.send(userInfo)
    } else if (req.user.role === req.params.role) {
      const userInfo = {
        username: req.user.username,
        role: req.user.role,
      }
      res.send(userInfo)
    } else {
      console.info('user auth failure - likely you requested a page that your current role is not authorized for')
      res.sendStatus(403)
    }
  } else {
    res.sendStatus(403)
  }
})

module.exports = router
