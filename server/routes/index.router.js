const express = require('express')
const passport = require('passport')
const path = require('path')

const router = express.Router()

// Handles login form POST from index.html
router.post('/',
  passport.authenticate('local', { // local strategy - userStrategy.js
    // request stays within node/express and is routed as a new request
    successRedirect: '/user' // goes to routes/user.js
  }))

// Handle index file separately
// Also catches any other request not explicitly matched elsewhere
router.get('/', (req, res) => {
  console.info(`user-agent header: ${req.header('user-agent')}`)
  res.sendFile(path.join(__dirname, '../public/views/index.html'))
})

router.get('/*', (req, res) => {
  console.warn('index router 404 : ', req.params)
  res.sendStatus(404)
})

module.exports = router
