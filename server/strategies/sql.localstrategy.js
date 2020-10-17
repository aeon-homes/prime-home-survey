const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const encryptLib = require('../modules/encryption')
const pool = require('../modules/pool.js')

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('connection err ', err)
      release()
      done(err)
    }

    let user = {}

    // eslint-disable-next-line consistent-return
    client.query('SELECT * FROM users WHERE id = $1', [id], (queryError, result) => {
      release()
      // Handle Errors
      if (queryError) {
        console.error('query err ', queryError)
        done(queryError)
      }

      if (result !== undefined) {
        [user] = result.rows
      }

      if (!user) {
        return done(null, false, {
          message: 'Incorrect credentials.',
        })
      }
      done(null, user)
    })
  })
})

// Does actual work of logging in
passport.use('local', new LocalStrategy({
  passReqToCallback: true,
  usernameField: 'username',
}, ((req, username, password, done) => {
  pool.connect((err, client, release) => {
    if (err) {
      console.error(err)
      release()
      done(null, false, { message: 'An unexpected error has occurred.' })
      return
    }
    // assumes the username will be unique, thus returning 1 or 0 results
    client.query('SELECT * FROM users WHERE username = $1', [username],
      (queryError, result) => {
        release()
        let user = {}

        // Handle Errors
        if (queryError) {
          console.error('connection err ', queryError)
          done(null, user)
        }

        if (result.rows[0] !== undefined) {
          [user] = result.rows
          if (encryptLib.comparePassword(password, user.password)) {
            if (user.active) {
              done(null, user)
            } else {
              done(null, false, {
                message: 'You must be confirmed by an administrator before logging in.',
              })
            }
          } else {
            done(null, false, {
              message: 'Incorrect credentials.',
            })
          }
        } else {
          done(null, false)
        }
      })
  })
})))

module.exports = passport
