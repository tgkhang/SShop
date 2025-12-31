'use strict'
import amqp from 'amqplib'

const runProducer = async () => {
  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()

    // Declare a queue
    const queue = 'ordered-queue-message'
    await channel.assertQueue(queue, { durable: true })

    for (let i = 0; i < 10; ++i) {
      const message = `Ordered Message ${i}`
      console.log(` [x] Sent: ${message}`)
      channel.sendToQueue(queue, Buffer.from(message), {
        persistent: true, // persistent to ensure message is not lost when RabbitMQ crash
      })
    }

    // Close connection after a short delay
    setTimeout(() => {
      connection.close()
      process.exit(0)
    }, 500)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

runProducer()
