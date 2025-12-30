'use strict'

const { connectToRabbitMQ, consumerQueue } = require('../dbs/init.rabbit')

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
  consumerToQueueNormal: async (queueName) => {
    try {
      
    } catch (error) {
      
    }
  }
}

module.exports = messageService
