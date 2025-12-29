'use strict'

const { connectToRabbitMQForTesting } = require('../dbs/init.rabbit')

describe('RabbitMQ Connection Test', () => {
  it('Should connect to RabbitMQ and send a test message', async () => {
    const result = await connectToRabbitMQForTesting()

    expect(result).toBeUndefined()
  })
})
