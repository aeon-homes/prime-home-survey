const express = require('express')
const { getPostgresConnection, queryClient } = require('../clients/postgresClient')

const router = express.Router()

// fetches the list of properties from the db and returns it. One entry per property (for building selectors)
router.get('/units', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.sendStatus(403)
    return
  }

  try {
    const { pgClient, done } = await getPostgresConnection()
    const queryText = 'SELECT unit FROM occupancy WHERE property=$1 AND responded IS NULL AND occupied=true AND year=$2'
    const queryParams = [req.query.property, req.query.year]
    const units = await queryClient(pgClient, queryText, queryParams)
    const formattedResponse = units.rows.map((row) => row.unit)

    done()

    res.send({ units: formattedResponse })
  } catch (error) {
    console.error('error in properties/units GET', error)
    res.sendStatus(500)
  }
})

module.exports = router
