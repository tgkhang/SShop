'use strict'

const ampq = require('amqplib')

const connectToRabbitMQ = async () => {
  try {
    const connection = await ampq.connect('amqp://localhost')
    if (!connection) throw new Error('Could not connect to RabbitMQ')

    const channel = await connection.createChannel()

    return { channel, connection }
  } catch (error) {}
}

const connectToRabbitMQForTesting = async () => {
  try {
    const { channel, connection } = await connectToRabbitMQ()

    // public message to queue
    const queue = 'test-queue'
    const msg = 'Hello World! by RabbitMQ'
    await channel.assertQueue(queue)
    await channel.sendToQueue(queue, Buffer.from(msg))

    await connection.close()
  } catch (error) {
    console.error('Error in testing RabbitMQ connection:', error)
  }
}

module.exports = { connectToRabbitMQ , connectToRabbitMQForTesting }
