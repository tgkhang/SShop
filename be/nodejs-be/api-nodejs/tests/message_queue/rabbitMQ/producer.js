import amqp from 'amqplib'

const runProducer = async () => {
  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()

    // Declare a queue
    const queue = 'test-queue'
    await channel.assertQueue(queue, { durable: true })

    // Send message
    const message = 'Hello RabbitMQ user! by kangaRoo'
    channel.sendToQueue(queue, Buffer.from(message))

    console.log(` [x] Sent: ${message}`)

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
