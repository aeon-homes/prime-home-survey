const express = require('express')
const postgresClient = require('../clients/postgresClient')
const ERROR_MESSAGES = require('../enum/errorMessages.enum')
const LANGUAGES = require('../enum/languages')
const ROLES = require('../enum/userRoles.enum')
const authUtil = require('../util/auth.util')

const router = express.Router()
const LOWER_ONLY_REGEX = /[^a-z]/

const STATIC_SITE_HOST = process.env.DATABASE_URL ? 'http://computer-lab-homepage.s3-website-us-west-2.amazonaws.com' : 'http://localhost:3000' // using DATABASE_URL here as a proxy for prod toggle, which is horrible

const LAB_TEXT_KEYS = Object.freeze([
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
  'other'
])

const LAB_CONTROL_KEYS = Object.freeze([
  'submit',
  'goback',
])

router.get('/text/:language?', async (req, res) => {
  res.header('Access-Control-Allow-Origin', STATIC_SITE_HOST)
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')

  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()
    const { language } = req.params

    if (LOWER_ONLY_REGEX.test(language)) throw new Error(ERROR_MESSAGES.ILLEGAL_PARAMETER)

    const dbKeys = language ? LAB_TEXT_KEYS.concat(LAB_CONTROL_KEYS) : LAB_TEXT_KEYS
    // eslint-disable-next-line
    const keyString = dbKeys.reduce((acc, key) => acc += `'${key}',`, '').slice(0, -1)

    try {
      const queryString = language
        ? `SELECT ${language}, type FROM translations WHERE type IN (${keyString})`
        : `SELECT ${Object.values(LANGUAGES).join(',')}, type FROM translations WHERE type IN (${keyString})`

      const dbResult = await postgresClient.queryClient(pgClient, queryString)

      const mappedResult = language 
        ? dbResult.rows.reduce((acc, row) => {
          acc[row.type] = row[language]
          return acc
        }, {})
        : dbResult.rows

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

router.post('/text', async (req, res) => {
  res.header('Access-Control-Allow-Origin', STATIC_SITE_HOST)
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')

  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()
    const { databaseKey, localizedText } = req.body

    try {
      // eslint-disable-next-line max-len
      const queryString = `INSERT INTO translations (type, ${Object.values(LANGUAGES).join(',')}) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (type) DO UPDATE SET english=$2, spanish=$3, somali=$4, hmong=$5, oromo=$6`
      const queryParams = [databaseKey, localizedText.english, localizedText.spanish, localizedText.somali, localizedText.hmong, localizedText.oromo]

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

router.options('/', async (req, res) => {
  res.header('Access-Control-Allow-Origin', STATIC_SITE_HOST)
  res.header('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')

  res.sendStatus(200)
})

const logLabQueryToPg = async (pgClient, requestBody) => {
  const queryString = 'INSERT INTO lab_usage_debug_log (query) VALUES ($1)'
  const queryParams = [JSON.stringify(requestBody)]

  try {
    await postgresClient.queryClient(pgClient, queryString, queryParams)
  } catch (dbErr) {
    console.error('logLabQueryToPg db error', dbErr)
  }
}

router.post('/', async (req, res) => {
  res.header('Access-Control-Allow-Origin', STATIC_SITE_HOST)
  res.header('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')

  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()

    try {
      const language = req.body.language || 'unknown'
      const property = req.body.property || 'unknown'
      const age = req.body.age || 'unknown'
      const reason = req.body.otherInput || req.body.reason || 'unknown'
  
      const timestamp = new Date().getTime()
    
      const queryParams = [
        language,
        property,
        timestamp,
        age,
        reason
      ]

      const queryString = 'INSERT INTO lab_usage (language, property, timestamp, age, reason) VALUES ($1, $2, $3, $4, $5)'

      await logLabQueryToPg(pgClient, req.body)
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

router.get('/properties?', async (req, res) => {
  res.header('Access-Control-Allow-Origin', STATIC_SITE_HOST)
  res.header('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', '*')

  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()

    try {
      const queryString = 'SELECT * FROM lab_properties ORDER BY name'
      
      const dbResult = await postgresClient.queryClient(pgClient, queryString)

      if (req.query.all === 'true') {
        const getDistinctQueryString = 'SELECT DISTINCT property FROM lab_usage'
        const distinctDbResult = await postgresClient.queryClient(pgClient, getDistinctQueryString)
        if (distinctDbResult && distinctDbResult.rows) {
          distinctDbResult.rows.forEach((row) => {
            if (!dbResult.rows.some((baseResult) => baseResult.name === row.property)) dbResult.rows.push({ name: row.property })
          })
        }
      }

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

router.post('/properties', async (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()

    try {
      const queryParams = [req.body.name]
      const queryString = 'INSERT INTO lab_properties (name) VALUES ($1)'
      
      const dbResult = await postgresClient.queryClient(pgClient, queryString, queryParams)

      res.status(201).send(dbResult.rows)
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

router.delete('/properties?', async (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  try {
    const { pgClient, done } = await postgresClient.getPostgresConnection()

    try {
      const queryParams = [req.query.name]
      const queryString = 'DELETE FROM lab_properties WHERE name=$1'
      
      await postgresClient.queryClient(pgClient, queryString, queryParams)

      res.status(204).send()
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
