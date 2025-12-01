import crypto from 'crypto'
import apiKeyModel from '../models/apiKey.model.js'
import '../dbs/init.mongodb.js'

const createApiKey = async () => {
  try {
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
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating API key:', error)
    process.exit(1)
  }
}

createApiKey()
