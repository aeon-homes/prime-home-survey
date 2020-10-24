const express = require('express')
const { getPostgresConnection, queryClient } = require('../clients/postgresClient')

const router = express.Router()

const OCCUPANCY_IGNORE_ROWS = 4 // number of rows to ignore at top of imported .csv
const OCCUPANCY_IGNORE_ENDING_ROWS = 1
const START_YEAR = 2010 // startpoint for valid year param range
const END_YEAR = 2100 // endpoint for valid year param range

const EMAIL_TABLE = 'resident_emails'
const EMAIL_IGNORE_ROWS = 0
const EMAIL_IGNORE_ENDING_ROWS = 0

router.post('/email/:year', async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== 'Administrator') {
      res.sendStatus(403)
      return
    }

    if ((req.params.year < START_YEAR) || (req.params.year > END_YEAR)) {
      res.status(400).send('Must be a year between 2010 and 2100.')
      return
    }

    validateCsvImportData(req.body)
    const postedEmailList = req.body.data
    const { pgClient, done } = await getPostgresConnection()

    try {
      postedEmailList.splice(0, EMAIL_IGNORE_ROWS)
      postedEmailList.splice(postedEmailList.length - EMAIL_IGNORE_ENDING_ROWS, EMAIL_IGNORE_ENDING_ROWS)
      const insertQueryBlingString = buildEmailImportBlingString(postedEmailList, req.params.year)
      const insertQueryString = buildEmailImportQueryString(insertQueryBlingString)
      const insertQueryParams = postedEmailList.flat()

      const insertQueryResult = await queryClient(pgClient, insertQueryString, insertQueryParams)

      console.info('/upload/:year insertQueryResult', insertQueryResult)

      res.sendStatus(201)
    } catch (error) {
      console.error(error)
      res.sendStatus(500)
    } finally { 
      done() 
    }
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

// Handles CSV upload from admin view
router.post('/upload/:year', async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'Administrator') {
    res.sendStatus(403)
    return
  }

  if ((req.params.year < START_YEAR) || (req.params.year > END_YEAR)) {
    res.status(400).send('Must be a year between 2010 and 2100.')
    return
  }

  validateCsvImportData(req.body)
  const postedUnitsList = req.body.data

  try {
    const { pgClient, done } = await getPostgresConnection()

    const deleteQueryString = 'DELETE FROM occupancy WHERE year=$1'
    const deleteQueryResult = await queryClient(pgClient, deleteQueryString, [req.params.year])

    console.info('/upload/:year deleteQueryResult', deleteQueryResult)
    postedUnitsList.splice(0, OCCUPANCY_IGNORE_ROWS)
    postedUnitsList.splice(postedUnitsList.length - OCCUPANCY_IGNORE_ENDING_ROWS, OCCUPANCY_IGNORE_ENDING_ROWS)
    const insertQueryBlingString = buildCsvImportBlingString(postedUnitsList)
    const insertQueryString = buildCsvImportQueryString(insertQueryBlingString)
    const insertQueryParams = postedUnitsList.flat()

    const insertQueryResult = await queryClient(pgClient, insertQueryString, insertQueryParams)
    done()

    console.info('/upload/:year insertQueryResult', insertQueryResult)

    res.sendStatus(201)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

// exports all responses from the passed-in year. called from admin
router.get('/export/:year', async (req, res) => {
  try {
    if (!req.isAuthenticated() || (req.user && req.user.role !== 'Administrator')) {
      res.sendStatus(403)
      return
    }

    const { pgClient, done } = await getPostgresConnection()
    try {
      const queryString = 'SELECT * FROM responses WHERE year=$1'
      const responsesQueryResult = await queryClient(pgClient, queryString, [req.params.year])

      res.send(responsesQueryResult.rows)
    } catch (error) {
      console.error(error)
      res.sendStatus(500)
    } finally { 
      done() 
    }
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

router.get('/household/:year', async (req, res) => {
  try {
    if (!req.isAuthenticated() || (req.user && req.user.role !== 'Administrator')) {
      res.sendStatus(403)
      return
    }

    const { pgClient, done } = await getPostgresConnection()

    try {
      const queryString = 'SELECT * FROM household WHERE year=$1'
      const responsesQueryResult = await queryClient(pgClient, queryString, [req.params.year])

      res.send(responsesQueryResult.rows)
    } catch (error) {
      console.error(error)
      res.sendStatus(500)
    } finally { 
      done() 
    }
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

// result: "($1,$2,$3,$4),($5,$6,$7,$8),($9, $10..."
function buildCsvImportBlingString(requestBodyData) {
  let result = ''
  let rowCounter = 1

  for (let i = 0; i < requestBodyData.length; i += 1) {
    result += `($${rowCounter},`
    result += `$${rowCounter + 1},`
    result += `$${rowCounter + 2},`
    result += `$${rowCounter + 3}),`

    rowCounter += 4
  }

  return result.slice(0, -1)
}

// INSERT INTO occupancy (property, occupied, unit, year) VALUES ($1, $2, $3, $4), ($5,$6,$7,$8), [...]
function buildCsvImportQueryString(blingString) {
  return `INSERT INTO occupancy (property, occupied, unit, year) VALUES ${blingString}`
}

function validateCsvImportData(requestBodyData) {
  if (typeof requestBodyData !== 'object' || requestBodyData.length < 1) {
    throw new Error('Invalid CSV import data')
  }
}

const buildEmailImportBlingString = (requestBodyData, year) => {
  let result = ''
  let rowCounter = 1

  for (let i = 0; i < requestBodyData.length; i += 1) {
    result += `($${rowCounter},`
    result += `${year},`
    result += 'true),'

    rowCounter += 1
  }

  return result.slice(0, -1)
}

const buildEmailImportQueryString = (blingString) => `INSERT INTO ${EMAIL_TABLE} (email, year, active) VALUES ${blingString} ON CONFLICT DO NOTHING`

module.exports = router
