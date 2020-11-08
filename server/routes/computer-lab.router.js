const express = require('express')
const postgresClient = require('../clients/postgresClient')
const ERROR_MESSAGES = require('../enum/errorMessages.enum')

const router = express.Router()
const LOWER_ONLY_REGEX = /[^a-z]/

const STATIC_SITE_HOST = process.env.DATABASE_URL ? 'http://computer-lab-homepage.s3-website-us-west-2.amazonaws.com' : 'http://localhost:3000' // using DATABASE_URL here as a proxy for prod toggle, which is horrible

const LAB_TEXT_KEYS = [
  'lab_welcome',
  'select_property',
  'computer_select_age',
  'age_0',
  'age_1',
  'age_2',
  'age_3',
  'age_4',
  'age_5',
  'age_6',
  'age_7',
  'age_8',
  'lab_reason',
  'school_work',
  'job_search',
  'unemployment_benefits',
  'covid_resources',
  'assistance',
  'rent_cafe',
  'other',
  'submit',
  'goback',
]

router.get('/text/:language', async (req, res) => {
  res.header('Access-Control-Allow-Origin', STATIC_SITE_HOST)
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
  res.header('Access-Control-Allow-Origin', STATIC_SITE_HOST)
  res.header('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')

  res.sendStatus(200)
})

router.post('/', async (req, res) => {
  res.header('Access-Control-Allow-Origin', STATIC_SITE_HOST)
  res.header('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')

  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()

    try {
      const { 
        language,
        property,
        age,
        reason 
      } = req.body
  
      const timestamp = new Date().getTime()
    
      const queryParams = [
        language,
        property,
        timestamp,
        age,
        reason
      ]

      const queryString = 'INSERT INTO lab_usage (language, property, timestamp, age, reason) VALUES ($1, $2, $3, $4, $5)'

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

router.get('/usage', async (req, res) => {
  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()

    try {
      const { 
        startTime,
        endTime,
        property 
      } = req.query
      
      const queryParams = [
        startTime || 0,
        endTime || new Date().getTime()        
      ]

      let queryString = 'SELECT * FROM lab_usage WHERE timestamp > $1 AND timestamp < $2 '
      
      if (property) {
        queryParams.push(property)
        queryString += 'AND property=$3'
      }

      const dbResult = await postgresClient.queryClient(pgClient, queryString, queryParams)

      res.send(dbResult.rows)
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
