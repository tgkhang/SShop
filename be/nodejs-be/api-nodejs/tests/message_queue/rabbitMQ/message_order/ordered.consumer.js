import amqp from 'amqplib'

const runConsumer = async () => {
  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()

    // Declare a queue
    const queue = 'ordered-queue-message'
    await channel.assertQueue(queue, { durable: true })

    console.log(` [*] Waiting for messages in ${queue}. To exit press CTRL+C`)


    /*
    SOLUTION for message order guarantee:
    using prefetch 
    prefetch 1 means consumer will only get 1 message at a time,
    prefetch 5 means consumer will only get 5 messages at a time,
    like synchronous processing 
    like mutual exclusion lock
    */
    channel.prefetch(1)
    /*
    END SOLUTION
    */

    // Consume messages
    channel.consume(queue, (message) => {
      const msgContent = message.content.toString()

      // stimulate random processing time
      setTimeout(() => {
        console.log(` [x] Received: ${msgContent}`)
        channel.ack(message)
      }, Math.random() * 1000)
    })
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

runConsumer()
