const express = require('express')
const authUtil = require('../util/auth.util')
const ROLES = require('../enum/userRoles.enum')
const postgresClient = require('../clients/postgresClient')

const router = express.Router()

// clear all server session information about this user
router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

// Handles Ajax request for user information if user is authenticated
router.get('/:role?', async (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.RESIDENT, ROLES.VOLUNTEER, ROLES.ADMINISTRATOR, ROLES.SITE_MANAGER])) {
    res.sendStatus(403)
    return
  }

  switch (req.params.role) {
    case 'any':
    case undefined:
      res.send({
        username: req.user.username,
        role: req.user.role
      })
      break
    case 'Aeon':
      if ((req.user.role === ROLES.ADMINISTRATOR) || (req.user.role === ROLES.SITE_MANAGER)) {
        res.send({
          username: req.user.username,
          role: req.user.role,
        })
      }
      break
    case ROLES.RESIDENT:
      if (req.user.role === ROLES.RESIDENT || req.user.role === ROLES.VOLUNTEER) {
        try {
          const eligible = await verifyEligibility(req.user.role)
          res.send({
            username: req.user.username,
            role: req.user.role,
            surveyEligible: eligible
          })
        } catch (error) {
          res.send(500)
        }
      } else {
        res.sendStatus(403)
      }
      break
    case req.user.role:
      res.send({
        username: req.user.username,
        role: req.user.role,
      })
      break  
    default:
      console.info('user auth failure - likely you requested a page that your current role is not authorized for')
      res.sendStatus(403)
  }
})

const verifyEligibility = async (role) => {
  let eligible = false

  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()

    try {
      const queryString = 'SELECT * FROM survey_status'
  
      const dbResult = await postgresClient.queryClient(pgClient, queryString, [])
  
      const surveyStatus = dbResult && dbResult.rows[0]
  
      if (role === ROLES.RESIDENT) {
        eligible = surveyStatus.open_residents
      }
  
      if (role === ROLES.VOLUNTEER) {
        eligible = surveyStatus.open_volunteers
      }  
    } catch (error) {
      console.error(error)
    } finally {
      done()
    }
  } catch (dbConnectionError) {
    console.error('ERROR CONNECTING TO DATABASE', dbConnectionError)
    throw dbConnectionError
  }

  return eligible
}

module.exports = router
