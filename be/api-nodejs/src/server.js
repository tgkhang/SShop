import exitHook from 'async-exit-hook' //// https://www.npmjs.com/package/async-exit-hook
import mongoose from 'mongoose'
import { env } from './configs/environment.js'
import app from './app.js'
import './dbs/init.mongodb.js'

const START_SERVER = () => {
  const hostname = env.LOCAL_DEV_APP_HOST || 'localhost'
  const PORT = env.LOCAL_DEV_APP_PORT || 3000

  if (env.BUILD_MODE === 'production') {
    app.listen(process.env.PORT, () => {
      console.log(`Production: Server is running at ${process.env.PORT}`)
    })
  } else {
    app.listen(PORT, hostname, () => {
      console.log(`Local: Server is running on http://${hostname}:${PORT}`)
    })
  }

  // Cleanup tasks before exit application
  exitHook(async (callback) => {
    console.log('\nExiting application, closing MongoDB connection...')
    await mongoose.connection.close()
    console.log('MongoDB connection closed.')
    callback()
  })
}

// Start server (MongoDB connection initializes automatically via import)
START_SERVER()