import mongoose from 'mongoose'
import { config } from 'dotenv'

config()

// Migration script to rename refreshTokensUsed to refreshTokenUsed
async function migrateKeyTokens() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopDev')

    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const keysCollection = db.collection('Keys')

    // Check if documents have old field name
    const docWithOldField = await keysCollection.findOne({ refreshTokensUsed: { $exists: true } })

    if (docWithOldField) {
      console.log('Found documents with old field name "refreshTokensUsed"')
      console.log('Migrating...')

      // Rename field from refreshTokensUsed to refreshTokenUsed
      const result = await keysCollection.updateMany(
        { refreshTokensUsed: { $exists: true } },
        { $rename: { refreshTokensUsed: 'refreshTokenUsed' } }
      )

      console.log(`Migration complete! Updated ${result.modifiedCount} documents`)
    } else {
      console.log('No migration needed. All documents use "refreshTokenUsed"')
    }

    // Show a sample document
    const sample = await keysCollection.findOne()
    console.log('\nSample document:', JSON.stringify(sample, null, 2))

    await mongoose.connection.close()
    console.log('Connection closed')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateKeyTokens()
