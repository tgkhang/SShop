'use strict'

const {
  consumerToQueue,
  consumerToQueueNormal,
  consumerToQueueFail,
} = require('./src/services/consumerQueue.service')

const queueName = 'test-queue'

// consumerToQueue(queueName)
//   .then(() => {
//     console.log('Message consumer started')
//   })
//   .catch((error) => {
//     console.error('Error starting message consumer:', error)
//   })

consumerToQueueNormal()
  .then(() => {
    console.log('Normal queue consumer started')
  })
  .catch((error) => {
    console.error('Error starting normal queue consumer:', error)
  })

consumerToQueueFail()
  .then(() => {
    console.log('DLX queue consumer started')
  })
  .catch((error) => {
    console.error('Error starting DLX queue consumer:', error)
  })
