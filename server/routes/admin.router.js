const express = require('express')
const pool = require('../modules/pool.js')
const pgClient = require('../clients/postgresClient')
const authUtil = require('../util/auth.util')
const ROLES = require('../enum/userRoles.enum')
const TABLES = require('../enum/databaseTables.enum')
const ERROR_MESSAGES = require('../enum/errorMessages.enum')
const router = express.Router()

// get a dataset for reporting purposes. takes in an array of properties and a year, and sends back the matching dataset
router.get('/data', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  const { properties } = req.query
  const { year } = req.query
  let propBlingString = ''

  if (typeof properties === 'string') {
    propBlingString = '$2'
  } else {
    // properties is an array
    for (let i = 0; i < properties.length; i += 1) {
      propBlingString += `$${i + 2},`
    }
    propBlingString = propBlingString.slice(0, -1)
  }

  const queryString = `SELECT * FROM responses WHERE year IN ($1) AND property IN (${propBlingString})`

  pool.connect((err, client, done) => {
    if (err) {
      console.error('db connect error', err)
      res.sendStatus(500)
    } else if (typeof properties === 'string') {
      client.query(queryString, [year, properties], (queryError, data) => {
        done()
        if (queryError) {
          console.error('data select query error', queryError)
          res.sendStatus(500)
        } else {
          res.send(data.rows)
        }
      })
    } else {
      client.query(queryString, [year, ...properties], (queryError, data) => {
        done()
        if (queryError) {
          console.error('data select query error', queryError)
          res.sendStatus(500)
        } else {
          res.send(data.rows)
        }
      })
    }
  })
})

// Add a new property. called from admin-properties view
router.post('/new-property', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  let thisYear = new Date()
  thisYear = thisYear.getFullYear()

  pool.connect((errDatabase, client, done) => {
    if (errDatabase) {
      console.error('Error connecting to database', errDatabase)
      res.sendStatus(500)
    } else {
      client.query('INSERT INTO occupancy (property, unit, year) VALUES ($1, $2, $3)', [
        req.body.property,
        req.body.unit,
        thisYear
      ], (errQuery, _data) => {
        done()
        if (errQuery) {
          console.error('Error making database query', errQuery)
          res.sendStatus(500)
        } else {
          res.sendStatus(201)
        }
      })
    }
  })
})

// Add a new unit to a property. called from admin-properties view
router.post('/new-unit', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  let thisYear = new Date()
  thisYear = thisYear.getFullYear()

  pool.connect((errDatabase, client, done) => {
    if (errDatabase) {
      console.error('Error connecting to database', errDatabase)
      res.sendStatus(500)
    } else {
      client.query('INSERT INTO occupancy (property, unit, year, occupied) VALUES ($1, $2, $3, $4)', [
        req.body.property,
        req.body.unit,
        thisYear,
        true
      ], (errQuery, _data) => {
        done()
        if (errQuery) {
          console.error('Error making database query', errQuery)
          res.sendStatus(500)
        } else {
          res.sendStatus(201)
        }
      })
    }
  })
})

// Delete a property unit. called from admin-properties view
router.delete('/delete-unit', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  const { occupancyId } = req.query
  pool.connect((err, client, done) => {
    if (err) {
      console.error('db connect error', err)
      res.sendStatus(500)
    } else {
      client.query('DELETE FROM occupancy WHERE id=$1', [occupancyId], (queryError, _data) => {
        done()
        if (queryError) {
          console.error('query error', queryError)
          res.sendStatus(500)
        } else {
          res.sendStatus(200)
        }
      })
    }
  })
})

// Update unit occupied status. called from admin-properties view
router.put('/updateOccupied', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR, ROLES.SITE_MANAGER])) {
    res.sendStatus(403)
    return
  }

  pool.connect((errDatabase, client, done) => {
    if (errDatabase) {
      console.error('Error connecting to database', errDatabase)
      res.sendStatus(500)
    } else {
      client.query('UPDATE occupancy SET occupied=$1 WHERE id=$2 RETURNING *;', [
        req.body.occupied,
        req.body.id
      ], (errQuery, data) => {
        done()
        if (errQuery) {
          console.error('Error making database query', errQuery)
          res.sendStatus(500)
        } else {
          res.send(data.rows)
        }
      })
    }
  })
})

// GET a selected property from the admin edit properties page
router.get('/selectedProperty', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  pool.connect((err, client, done) => {
    if (err) {
      console.error('error connecting to db', err)
      res.sendStatus(500)
    } else {
      // query
      client.query('SELECT occupancy.*, properties.household FROM occupancy LEFT JOIN properties ON properties.name = occupancy.property WHERE property=$1 AND year=$2;', [req.query.selectedProperty, req.query.year], (queryError, data) => {
        done()
        if (queryError) {
          console.error('query error', queryError)
        } else {
          res.send(data.rows)
        }
      })
    }
  })
})

// return the response rate for a passed array of properties (or 'all')
router.get('/responses', (req, res) => {
  // req.params.properties is either a string ('all') or an array of properties

  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR, ROLES.SITE_MANAGER])) {
    res.sendStatus(403)
    return
  }

  const { properties } = req.query
  const year = req.query.year || new Date().getFullYear()

  let queryString
  let secondQueryString
  let params

  if (!properties) {
    queryString = 'SELECT COUNT(*) FROM occupancy WHERE responded=$1 OR paper_response=true AND occupied=true AND year=$2'
    secondQueryString = 'SELECT COUNT(*) FROM occupancy WHERE occupied=$1 AND year=$2'
    params = [year]
  } else {
    let propBlingString = ''
    let yearBling = '$3;'

    if (typeof properties === 'string') {
      propBlingString = '$2'
      params = [properties, year]
    } else {
      // properties is an array
      for (let i = 0; i < properties.length; i += 1) {
        propBlingString += `$${i + 2},`
      }
      propBlingString = propBlingString.slice(0, -1)
      params = properties
      params.push(year)
      yearBling = properties.length + 2
    }

    queryString = `SELECT COUNT(*) FROM occupancy WHERE (responded=$1 OR paper_response=true) AND occupied=true AND property IN (${propBlingString}) AND year=${yearBling}`
    secondQueryString = `SELECT COUNT(*) FROM occupancy WHERE occupied=$1 AND property IN (${propBlingString}) AND year=${yearBling}`
  }

  pool.connect((err, client, done) => {
    if (err) {
      done()
      console.error('db connect error', err)
      res.sendStatus(500)
    } else {
      client.query(queryString, [true, ...params], (queryError, data) => {
        if (queryError) {
          done()
          console.error('data count query error', queryError)
          res.sendStatus(500)
        } else {
          // data.rows[0].count is a string of how many responses we have
          const responses = data.rows[0].count
          client.query(secondQueryString, [true, ...params], (secondQueryError, occupancyData) => {
            done()
            if (secondQueryError) {
              console.error('data count2 query error', secondQueryError)
              res.sendStatus(500)
            } else if (occupancyData.rows[0].count > 0) {
              // data.rows[0].count is a string of how many occupied units we have
              const occupied = occupancyData.rows[0].count
              const responseRate = responses / occupied
              res.send(responseRate.toString())
            } else {
              res.send('no occupied units found')
            }
          })
        }
      })
    }
  })
})

router.put('/updateHousehold', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR, ROLES.SITE_MANAGER])) {
    res.sendStatus(403)
    return
  }

  const queryString = 'INSERT INTO properties (name, household) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET household=$2;'
  const queryValues = [req.body.name, req.body.value]

  pool.connect((err, client, done) => {
    if (err) {
      console.error('db connect error', err)
      done()
      res.sendStatus(500)
      return
    }

    client.query(queryString, queryValues, (queryError, _data) => {
      done()

      if (queryError) {
        console.error('updateHousehold query error', queryError)
        res.sendStatus(500)
        return
      }

      res.sendStatus(200)
    })
  })
})

router.get('/emails', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  const {
    searchText,
    pageSize,
    pageNumber,
    active,
    year
  } = req.query

  const activeBling = year ? 3 : 2
  const limitBling = activeBling + (active ? 1 : 0)
  let queryString = `SELECT * FROM ${TABLES.RESIDENT_EMAILS} WHERE email LIKE $1`
  queryString += year ? ' AND year=$2 ' : '' 
  queryString += active ? ` AND active=$${activeBling} ` : '' 
  queryString += pageSize && pageNumber ? ` ORDER BY year, email LIMIT $${limitBling} OFFSET $${limitBling + 1}` : ''

  const queryParams = [`%${searchText || ''}%`]
  if (year) queryParams.push(year)
  if (active) queryParams.push(active)
  if (pageSize && pageNumber) queryParams.push(pageSize, (pageNumber - 1) * pageSize)

  pool.query(queryString, queryParams, (err, data) => {
    if (err) {
      console.error(err)
      console.error(new Error(ERROR_MESSAGES.DATABASE_ERROR))
      res.sendStatus(500)
    } else {
      res.send(data.rows)  
    }
  })
})

router.get('/emails/count', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  const {
    searchText,
    active,
    year
  } = req.query

  const activeBling = year ? 3 : 2
  let queryString = `SELECT COUNT(*) FROM ${TABLES.RESIDENT_EMAILS} WHERE email LIKE $1`
  queryString += year ? ' AND year=$2 ' : '' 
  queryString += active ? ` AND active=$${activeBling} ` : '' 

  const queryParams = [`%${searchText || ''}%`]
  if (year) queryParams.push(year)
  if (active) queryParams.push(active)

  pool.query(queryString, queryParams, (err, data) => {
    if (err) {
      console.error(err)
      console.error(new Error(ERROR_MESSAGES.DATABASE_ERROR))
      res.sendStatus(500)
    } else {
      res.send(data.rows)  
    }
  })
})

router.delete('/emails/:id', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  const { id } = req.params

  pool.query(`DELETE FROM ${TABLES.RESIDENT_EMAILS} WHERE id=$1`, [id], (err, _data) => {
    if (err) {
      console.error(err)
      console.error(new Error(ERROR_MESSAGES.DATABASE_ERROR))
      res.sendStatus(500)
    } else {
      res.sendStatus(200)  
    }
  })
})

router.put('/emails/:id', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  const { id } = req.params
  const {
    email,
    active
  } = req.body

  pool.query(`UPDATE ${TABLES.RESIDENT_EMAILS} SET email=$1, active=$2 WHERE id=$3`, [email, active, id], (err, _data) => {
    if (err) {
      console.error(err)
      console.error(new Error(ERROR_MESSAGES.DATABASE_ERROR))
      res.sendStatus(500)
    } else {
      res.sendStatus(200)  
    }
  })
})

router.post('/emails/:email', (req, res) => {
  if (!authUtil.validateAuthorization(req, [ROLES.ADMINISTRATOR])) {
    res.sendStatus(403)
    return
  }

  const { email } = req.params
  
  pool.query(`INSERT INTO ${TABLES.RESIDENT_EMAILS} (email, year, active) VALUES($1, $2, true)`, [email, new Date().getFullYear()], (err, _data) => {
    if (err) {
      console.error(err)
      console.error(new Error(ERROR_MESSAGES.DATABASE_ERROR))
      res.sendStatus(500)
    } else {
      res.sendStatus(201)
    }
  })
})

module.exports = router
