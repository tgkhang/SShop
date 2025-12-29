import amqp from 'amqplib'

const runConsumer = async () => {
  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()

    // Declare a queue
    const queue = 'test-queue'
    await channel.assertQueue(queue, { durable: false })

    console.log(` [*] Waiting for messages in ${queue}. To exit press CTRL+C`)

    // Consume messages
    channel.consume(
      queue,
      (message) => {
        if (message !== null) {
          console.log(` [x] Received: ${message.content.toString()}`)
          channel.ack(message)
        }
      },
      { noAck: false }
    )
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

runConsumer()
