import redis from 'redis'

class RedisPubSubService {
  constructor() {
    this.publisherClient = redis.createClient()
    this.subscriberClient = redis.createClient()

    // Connect both clients
    this.publisherClient.connect().catch(console.error)
    this.subscriberClient.connect().catch(console.error)

    // Handle errors
    this.publisherClient.on('error', (err) => console.log('Redis Publisher Error', err))
    this.subscriberClient.on('error', (err) => console.log('Redis Subscriber Error', err))
  }

  async publish(channel, message) {
    try {
      // Redis v5 uses promise-based API
      const result = await this.publisherClient.publish(channel, message)
      return result
    } catch (err) {
      console.error('Publish error:', err)
      throw err
    }
  }

  async subscribe(channel, callback) {
    try {
      await this.subscriberClient.subscribe(channel, (message, subscriberChannel) => {
        callback(subscriberChannel, message)
      })
    } catch (err) {
      console.error('Subscribe error:', err)
      throw err
    }
  }
}

export default new RedisPubSubService()
