/* eslint-disable no-console */
import express from 'express'
import cors from 'cors'
import { env } from './configs/environment.js'
// import { APIs_V1 } from './routes/v1/index.js'
// import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'
import { corsOptions } from './configs/cors.js'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'

const app = express()

// Use Helmet for security headers in production
if (env.BUILD_MODE === 'production') {
  app.use(helmet())
}

// Use compression to reduce response size
app.use(compression())

// Fix caching issues for API responses
// ex: when user logout, the browser may cache some previous API response,
// then when user login again, those cached response may still be used,
// causing some issues like: user still get previous user info after logout and login with another account
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

// Use morgan with mode based on BUILD_MODE environment variable
const morganMode = env.BUILD_MODE === 'production' ? 'combined' : 'dev'
app.use(morgan(morganMode))

app.use(cookieParser()) // Enable cookie parsing middleware
app.use(cors(corsOptions)) // Enable CORS for all routes by default

// Middleware to parse JSON request bodies, enable request json body data
app.use(express.json())
// app.use('/v1', APIs_V1)

// Middleware for handling errors globally
// app.use(errorHandlingMiddleware)

app.use(express.urlencoded({ extended: true })) // Enable URL-encoded request bodies

export default app
