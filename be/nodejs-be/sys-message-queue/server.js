'use strict'

const { consumerToQueue } = require('./src/services/consumerQueue.service')

const queueName = 'test-queue'
consumerToQueue(queueName)
  .then(() => {
    console.log('Message consumer started')
  })
  .catch((error) => {
    console.error('Error starting message consumer:', error)
  })
