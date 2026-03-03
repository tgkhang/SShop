import crypto from 'crypto'
import mongoose from 'mongoose'
import apiKeyModel from '../models/apiKey.model.js'
import { env } from '../configs/environment.js'

const createApiKey = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI)
    console.log('✓ Connected to MongoDB')

    // Generate a random API key
    const key = crypto.randomBytes(32).toString('hex')
    
    // Create API key in database
    const newKey = await apiKeyModel.create({
      key: key,
      status: true,
      permissions: ['read', 'write', 'delete']
    })
    
    console.log('✅ API Key created successfully!')
    console.log('================================================')
    console.log('API Key:', key)
    console.log('================================================')
    console.log('\nCopy this to your .http file:')
    console.log(`x-api-key: ${key}`)
    console.log('================================================')
    
    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating API key:', error.message)
    process.exit(1)
  }
}

createApiKey()
