import mongoose from 'mongoose'
import { env } from '../configs/environment.js'
import { checkOverload, countConnection } from '../helpers/check.connect.js'

class Database {
  constructor() {
    this._connect()
  }

  _connect(type = 'mongodb') {
    if (env.BUILD_MODE === 'dev') {
      mongoose.set('debug', true)
      mongoose.set('debug', { color: true })
    }

    mongoose
      .connect(env.MONGODB_URI)
      .then(() => {
        console.log('Database connection successful')
        countConnection()
        checkOverload()
      })
      .catch((err) => {
        console.error('Database connection error:', err)
      })
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }
}

const instanceMongoDB = Database.getInstance()
export default instanceMongoDB
