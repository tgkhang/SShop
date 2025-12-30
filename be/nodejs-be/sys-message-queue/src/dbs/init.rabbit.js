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

const consumerQueue = async (channel, queueName) => {
  try {
    await channel.assertQueue(queueName, { durable: true })
    console.log(
      ` [*] Waiting for messages in ${queueName}. To exit press CTRL+C`
    )
    channel.consume(
      queueName,
      (message) => {
        console.log(` [x] Received: ${message.content.toString()}`)
        // 1 find user follow shop
        // 2 send message to user
        // 3 ok => success
        // 4 error setup DLX
      },
      {
        // true means server won't expect ack from client
        noAck: true,
      }
    )
  } catch (error) {
    console.error('Error in consumerQueue:', error)
    throw error
  }
}

module.exports = { connectToRabbitMQ, connectToRabbitMQForTesting, consumerQueue }
