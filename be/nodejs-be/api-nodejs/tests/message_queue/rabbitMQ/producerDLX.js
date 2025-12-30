import amqp from 'amqplib'

const log = console.log
console.log = function () {
  log.apply(console, [new Date().toISOString()].concat([...arguments]))
}

const runProducer = async () => {
  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect('amqp://localhost')
    const channel = await connection.createChannel()

    // Define exchange, queue, and routing keys
    const notificationExchange = 'notification_exchange' // nofitication exchange direct
    const notificationQueue = 'notification_queue_processing' // normal queue
    const notificationExchangeDLX = 'notification_exchange_dlx' // dead letter exchange
    const notificationRoutingKeyDLX = 'notification_routing_key_dlx' // dead letter routing key

    // 1. create exchange
    await channel.assertExchange(notificationExchange, 'direct', { durable: true })

    // 2. create queue
    const queueResult = await channel.assertQueue(notificationQueue, {
      exclusive: false, // allow multi client connect
      deadLetterExchange: notificationExchangeDLX, // setup DLX
      deadLetterRoutingKey: notificationRoutingKeyDLX, // setup routing key DLX
    })

    // 3. bind queue to exchange with routing key
    await channel.bindQueue(queueResult.queue, notificationExchange, 'notification_routing_key')

    // 4. send message
    const msg = 'Hello RabbitMQ user! by kangaRoo with DLX setup'
    await channel.sendToQueue(queueResult.queue, Buffer.from(msg), {
      expiration: '5000', // message expire time 5s
    })

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
