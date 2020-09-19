const express = require('express')

const app = express()
const bodyParser = require('body-parser')

require('dotenv').config()

const passport = require('./strategies/sql.localstrategy')
const sessionConfig = require('./modules/session.config')

// Route includes
const indexRouter = require('./routes/index.router')
const userRouter = require('./routes/user.router')
const registerRouter = require('./routes/register.router')
const csvRouter = require('./routes/csv.router')
const surveyRouter = require('./routes/survey.router')
const userRolesRouter = require('./routes/user-roles.router')
const siteManagerRouter = require('./routes/site-manager.router')
const adminRouter = require('./routes/admin.router')
const propertiesRouter = require('./routes/properties.router')
const tangoApiRouter = require('./routes/tangoApi.router')

const port = process.env.PORT || 5000

// Body parser middleware
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

// Serve back static files
app.use(express.static('./server/public'))

// Passport Session Configuration
app.use(sessionConfig)

// Start up passport sessions
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use('/register', registerRouter)
app.use('/user', userRouter)
app.use('/csv', csvRouter)
app.use('/survey', surveyRouter)
app.use('/user-roles', userRolesRouter)
app.use('/site-manager', siteManagerRouter)
app.use('/admin', adminRouter)
app.use('/properties', propertiesRouter)
app.use('/api', tangoApiRouter)

// Catch all bucket, must be last!
app.use('/', indexRouter)

// Listen //
app.listen(port, () => {
  console.info('Listening on port:', port)
})
