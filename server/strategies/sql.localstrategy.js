var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var encryptLib = require('../modules/encryption');
var pool = require('../modules/pool.js');

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  // console.log('called deserializeUser - pg');

  pool.connect(function (err, client, release) {
    if (err) {
      console.log('connection err ', err);
      release();
      done(err);
    }

    var user = {};

    client.query("SELECT * FROM users WHERE id = $1", [id], function (err, result) {
      release();
      // Handle Errors
      if (err) {
        console.log('query err ', err);
        done(err);
      }

      if (result != undefined) {
        user = result.rows[0];
      }
      
      if (!user) {
        // user not found
        return done(null, false, {
          message: 'Incorrect credentials.'
        });
      } else {
        // user found
        // console.log('User row ', user);
        done(null, user);
      }

    });
  });
});

// Does actual work of logging in
passport.use('local', new localStrategy({
  passReqToCallback: true,
  usernameField: 'username'
}, function (req, username, password, done) {
  pool.connect(function (err, client, release) {
    // assumes the username will be unique, thus returning 1 or 0 results
    client.query("SELECT * FROM users WHERE username = $1", [username],
      function (err, result) {
        release();
        var user = {};

        // console.log('here');

        // Handle Errors
        if (err) {
          console.log('connection err ', err);
          done(null, user);
        }

        if (result.rows[0] != undefined) {
          user = result.rows[0];
          // console.log('User obj', user);
          // Hash and compare
          if (encryptLib.comparePassword(password, user.password)) {
            // all good!
            // console.log('passwords match');
            if (user.active) {
              // console.log('user is active', user);
              done(null, user);
            } else {
              console.log('user is inactive', user);

              done(null, false, {
                message: 'You must be confirmed by an administrator before logging in.'
              });
            }
          } else {
            console.log('password does not match');
            done(null, false, {
              message: 'Incorrect credentials.'
            });
          }
        } else {
          console.log('no user');
          done(null, false);
        }

      });
  });
}));

module.exports = passport;