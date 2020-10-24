const express = require('express')
const pool = require('../modules/pool.js')

const router = express.Router()

// fetches the list of properties from the db and returns it. One entry per property (for building selectors)
router.get('/properties/:year', (req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
      console.error('error connecting to db', err)
      res.sendStatus(500)
    } else {
      // query
      client.query('SELECT DISTINCT property FROM occupancy WHERE year=$1 ORDER BY property;', [req.params.year],
        (err, data) => {
          done()
          if (err) {
            console.error('query error', err)
            res.sendStatus(500)
          } else {
            res.send(data.rows)
          }
        })
    }
  })
})

// deauthorizes a site manager for a property. called from admin view
router.put('/properties/deauth', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.role === 'Administrator') {
      pool.connect((err, client, done) => {
        if (err) {
          console.error('error connecting to db', err)
          res.sendStatus(500)
        } else {
          // query like DELETE FROM occupancy_users WHERE occupancy_property='chicago' AND user_id=2; 
          client.query('DELETE FROM occupancy_users WHERE occupancy_property=$1 AND user_id=$2;', [req.body.property, req.body.id], (err, data) => {
            done()
            if (err) {
              console.error('deauth query error', err)
              res.sendStatus(500)
            } else {
              res.sendStatus(200)
            }
          })
        }
      })
    } else {
      // not admin role
      res.sendStatus(403)
    }
  } else {
    // not authorized
    res.sendStatus(403)
  }
})

// authorizes a site manager for a property. called from admin view
router.put('/properties/:auth', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.role === 'Administrator') {
      if (req.body.property && req.body.id) {
        pool.connect((err, client, done) => {
          if (err) {
            console.error('error connecting to db', err)
            res.sendStatus(500)
          } else {
            // query like INSERT INTO occupancy_users (occupancy_property, user_id) VALUES ('columbus', 2); 
            client.query('INSERT INTO occupancy_users (occupancy_property, user_id) VALUES ($1, $2);', [req.body.property, req.body.id], (err, data) => {
              done()
              if (err) {
                console.error('auth query error', err)
                res.sendStatus(500)
              } else {
                res.sendStatus(201)
              }
            })
          }
        })
      } else {
        // didn't send the needed property and id
        res.sendStatus(400)
      }
    } else {
      // not admin role
      res.sendStatus(403)
    }
  } else {
    // not authorized
    res.sendStatus(403)
  }
})

// gets list of users from the db, returns them WITH the list of properties they're authorized for as part of their objects
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.role === 'Administrator') {
      pool.connect((err, client, done) => {
        if (err) {
          console.error('error connecting to db', err)
          res.sendStatus(500)
        } else {
          // query
          client.query('SELECT id, username, active, role FROM users ORDER BY username', (err, data) => {
            if (err) {
              done()
              console.error('get / query error', err)
            } else {
              // now we need to get the users' authorized properties
              const userData = data.rows
              client.query('SELECT * FROM occupancy_users', (err, data) => {
                done()
                if (err) {
                  console.error('user-roles.router get / query error', err)
                  res.sendStatus(500)
                } else {
                  // data is the occupancy_users junction table
                  // loop through that whole table, pushing authorized properties into user objects
                  for (let i = 0; i < data.rows.length; i += 1) {
                    const authorization = data.rows[i]
                    // loop through user data, assign the property as a string when user_id is found
                    for (let j = 0; j < userData.length; j += 1) {
                      if (authorization.user_id === userData[j].id) {
                        if (userData[j].properties === undefined) {
                          userData[j].properties = []
                        }
                        userData[j].properties.push(authorization.occupancy_property)
                        continue
                      }
                    }
                  } // loop done, userData should now have all authorized property data
                  res.send(userData)
                }
              })
            }
          })
        }
      })
    } else {
      // not admin role
      res.sendStatus(403)
    }
  } else {
    // not authorized
    res.sendStatus(403)
  }
}) // end GET route

// Update user active status
router.put('/active', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.role ==- 'Administrator') {
      pool.connect((errDatabase, client, done) => {
        if (errDatabase) {
          console.error('Error connecting to database', errDatabase)
          res.sendStatus(500)
        } else {
          client.query('UPDATE users SET active=$1 WHERE username=$2;', [
            req.body.active,
            req.body.username
          ],
          (errQuery, data) => {
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
    } else {
      // not admin role
      res.sendStatus(403)
    }
  } else {
    // not authorized
    res.sendStatus(403)
  }
})

// Update user role
router.put('/role', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.role === 'Administrator') {
      pool.connect((errDatabase, client, done) => {
        if (errDatabase) {
          console.error('Error connecting to database', errDatabase)
          res.sendStatus(500)
        } else {
          client.query('UPDATE users SET role=$1 WHERE username=$2;', [
            req.body.role,
            req.body.user.username
          ],
          (errQuery, data) => {
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
    } else {
      // not admin role
      res.sendStatus(403)
    }
  } else {
    // not authorized
    res.sendStatus(403)
  }
})

// deletes a user
router.delete('/:userId', (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'Administrator') {
    res.sendStatus(403)
    return
  }

  pool.connect((err, client, done) => {
    if (err) {
      console.error('db connect error', err)
      res.sendStatus(500)
    } else {
      client.query('SELECT * FROM occupancy_users WHERE user_id=$1', [req.params.userId], (err, data) => {
        if (err) {
          done()
          console.error('delete user query error')
          res.sendStatus(500)
          return
        }

        if (data.rows.length > 0) {
          client.query('DELETE FROM occupancy_users WHERE user_id=$1', [req.params.userId], (err, data) => {
            if (err) {
              done()
              console.error('delete user query error')
              res.sendStatus(500)
              return
            }

            client.query('DELETE FROM users WHERE id=$1', [req.params.userId], (err, data) => {
              done()
              if (err) {
                console.error('query error', err)
                res.sendStatus(500)
              } else {
                res.sendStatus(200)
              }
            })
          })
        } else {
          client.query('DELETE FROM users WHERE id=$1', [req.params.userId], (err, data) => {
            done()
            if (err) {
              console.error('query error', err)
              res.sendStatus(500)
            } else {
              res.sendStatus(200)
            }
          })
        }
      })
    }
  })
})

// GET list of all properties and unit numbers
router.get('/allProperties', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.role === 'Administrator') {
      pool.connect((err, client, done) => {
        if (err) {
          console.error('error connecting to db', err)
          res.sendStatus(500)
        } else {
          // query
          client.query('SELECT * FROM occupancy ORDER BY occupancy.property;', (err, data) => {
            done()
            if (err) {
              console.error('query error', err)
            } else {
              res.send(data.rows)
            }
          })
        }
      })
    } else {
      // not admin role
      res.sendStatus(403)
    }
  } else {
    // not authorized
    res.sendStatus(403)
  }
})

module.exports = router
