const express = require('express')
const postgresClient = require('../clients/postgresClient')
const ERROR_MESSAGES = require('../enum/errorMessages.enum')

const router = express.Router()
const LOWER_ONLY_REGEX = /[^a-z]/

const LAB_TEXT_KEYS = [
  'lab_welcome',
  'computer_select_age',
  'lab_reason',
  'school_work',
  'job_search',
  'unemployment_benefits',
  'covid_resources',
  'assistance',
  'rent_cafe',
  'other',
  'my_home',
  'computer_schedule',
  'submit',
  'goback'
]

router.get('/text/:language', async (req, res) => {
  console.info(`GET /text/:language ${req.params.language}`)

  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')

  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()
    const { language } = req.params

    if (LOWER_ONLY_REGEX.test(language)) throw new Error(ERROR_MESSAGES.ILLEGAL_PARAMETER)

    // eslint-disable-next-line
    const keyString = LAB_TEXT_KEYS.reduce((acc, key) => acc += `'${key}',`, '').slice(0, -1)

    try {
      const queryString = `SELECT ${language}, type FROM translations WHERE type IN (${keyString})`

      const dbResult = await postgresClient.queryClient(pgClient, queryString)

      const mappedResult = dbResult.rows.reduce((acc, row) => {
        acc[row.type] = row[language]
        return acc
      }, {})

      res.send(mappedResult)
    } catch (error) {
      console.error(error)
      res.status(500).send(ERROR_MESSAGES.DATABASE_ERROR)
    } finally {
      done()
    }
  } catch (dbConnectionError) {
    console.error(dbConnectionError)
    res.status(500).send(ERROR_MESSAGES.DATABASE_ERROR)
  }
})

router.options('/', async (req, res) => {
  console.info('OPTIONS /computerLab')

  res.header('Access-Control-Allow-Origin', '*') // todo: CORS from actual deployment domain?
  res.header('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')

  res.sendStatus(200)
})

router.post('/', async (req, res) => {
  console.info('POST /computerLab')

  res.header('Access-Control-Allow-Origin', '*') // todo: CORS from actual deployment domain?
  res.header('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')

  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()

    try {
      const { 
        language,
        age,
        reason 
      } = req.body
  
      const timestamp = new Date().getTime()
    
      const queryParams = [
        language,
        timestamp,
        age,
        reason
      ]

      const queryString = 'INSERT INTO lab_usage (language, timestamp, age, reason) VALUES ($1, $2, $3, $4)'

      await postgresClient.queryClient(pgClient, queryString, queryParams)

      res.sendStatus(200)
    } catch (error) {
      console.error(error)
      res.status(500).send(ERROR_MESSAGES.DATABASE_ERROR)
    } finally {
      done()
    }
  } catch (dbConnectionError) {
    console.error(dbConnectionError)
    res.status(500).send(ERROR_MESSAGES.DATABASE_ERROR)
  }
})

module.exports = router
