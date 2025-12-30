const mongoose = require('mongoose')

const connectionString =
  'mongodb://admin:password@localhost:27017/shop?authSource=admin'
const TestSchema = new mongoose.Schema({ name: String })
const Test = mongoose.model('Test', TestSchema)

describe('MongoDB Connection Test', () => {
  let connection
  beforeAll(async () => {
    connection = await mongoose.connect(connectionString)
  })

  // close
  afterAll(async () => {
    await mongoose.connection.close()
  })

  it('Should connect to MongoDb', () => {
    expect(mongoose.connection.readyState).toBe(1)
  })

  it('should save a document to db', async () => {
    const user = new Test({ name: 'Test User' })
    await user.save()
    expect(user.isNew).toBe(false)
  })

  it('should find a document from db', async () => {
    const user = await Test.findOne({ name: 'Test User' })
    expect(user.name).toBe('Test User')
  })
})
