'use strict'

const { connectToRabbitMQ, consumerQueue } = require('../dbs/init.rabbit')

const log = console.log
console.log = function () {
  log.apply(console, [new Date().toISOString()].concat([...arguments]))
}

const messageService = {
  consumerToQueue: async (queueName) => {
    try {
      const { channel, connection } = await connectToRabbitMQ()
      await consumerQueue(channel, queueName)
    } catch (error) {
      console.error('Error in consumerToQueue:', error)
    }
  },

  // case processing
  consumerToQueueNormal: async () => {
    try {
      const { channel } = await connectToRabbitMQ()
      const notificationQueue = 'notification_queue_processing' // normal queue

      // ====================
      // CASE 1: TTL
      // const timeExpire = 5000 // 5s success
      // const timeExpire = 10000 // 10s fail to test DLX
      // setTimeout(() => {
      //   channel.consume(notificationQueue, (message) => {
      //     console.log(
      //       'Sending notification to user successfully:',
      //       message.content.toString()
      //     )
      //     channel.ack(message)
      //   })
      // }, timeExpire)
      // ====================

      // ====================
      // CASE 2: Logic fail
      channel.consume(notificationQueue, (message) => {
        try {
          const numberTest = Math.random()

          console.log('Random number for test logic:', numberTest)
          if (numberTest < 0.5) {
            throw new Error(
              'Send failed due to random logic error, hot fix needed'
            )
          }
          console.log(
            'Sending notification to user successfully:',
            message.content.toString()
          )
          channel.ack(message)
        } catch (error) {
          console.error('Error processing message:', error.message)
          /*
          nack : negative acknowledge
          use case: when message processing fail, we can use nack to inform RabbitMQ that the message was not processed successfully.
          parameters:
          - message: the original message that was not processed successfully.
          - allUpTo: default false, when true, declines all messages up to and including the supplied message, false only declines the supplied message.
          - requeue: default true, when true, the server will attempt to requeue the msg to the queue(the original queue), false will not requeue it.
          */
          channel.nack(message, false, false) // send to DLX
        }
      })
    } catch (error) {
      console.error('Error in consumerToQueueNormal:', error)
    }
  },

  // case fail
  consumerToQueueFail: async () => {
    try {
      const { channel } = await connectToRabbitMQ()
      const notificationExchangeDLX = 'notification_exchange_dlx' // dead letter exchange
      const notificationRoutingKeyDLX = 'notification_routing_key_dlx' // dead letter routing key

      const notiQueueHandler = 'notification_queue_hot_fix'

      await channel.assertExchange(notificationExchangeDLX, 'direct', {
        durable: true,
      })

      const queueResult = await channel.assertQueue(notiQueueHandler, {
        exclusive: false, // allow multi client connect
      })

      await channel.bindQueue(
        queueResult.queue,
        notificationExchangeDLX,
        notificationRoutingKeyDLX
      )

      await channel.consume(
        queueResult.queue,
        (messageFailed) => {
          console.log(
            'Received from DLX - Need to fix issue for message:',
            messageFailed.content.toString()
          )
        },
        { noAck: true }
      )
    } catch (error) {
      console.error('Error in consumerToQueueFail:', error)
    }
  },
}

module.exports = messageService
