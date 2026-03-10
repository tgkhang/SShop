import { RedisErrorResponse } from '#core/error.response.js'
import redis from 'redis'

let client = {}
let statusConnectRedis = {
  CONNECT: 'connect',
  END: 'end',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
}

// TO DO: put them in constants file in folder configs
const REDIS_CONNECT_TIMEOUT = 10000 // 10 seconds
const REDIS_CONNECT_MESSAGE = {
  code: -999,
  message: {
    vn: 'redis kết nối thất bại',
    en: 'redis connection failed',
  },
}

let connectionTimeout = null
const handleConnectionTimeout = () => {
  connectionTimeout = setTimeout(() => {
    throw new RedisErrorResponse({
      message: REDIS_CONNECT_MESSAGE.en,
      code: REDIS_CONNECT_MESSAGE.code,
    })
  }, REDIS_CONNECT_TIMEOUT)
}

const handleEventConnection = ({ connectionRedis }) => {
  // check if connection is null

  connectionRedis.on(statusConnectRedis.CONNECT, () => {
    console.log('Redis connected successfully')
    clearTimeout(connectionTimeout) // Clear the connection timeout if connected successfully
  })

  connectionRedis.on(statusConnectRedis.END, () => {
    console.log('Redis connection closed')

    // Retry connection
    handleConnectionTimeout()
  })

  connectionRedis.on(statusConnectRedis.RECONNECTING, () => {
    console.log('Redis is reconnecting...')
    clearTimeout(connectionTimeout) // Clear the connection timeout if reconnecting
  })

  connectionRedis.on(statusConnectRedis.ERROR, (err) => {
    console.error('Redis connection error:', err)
    handleConnectionTimeout()
  })
}

const initRedis = async () => {
  const instanceRedis = redis.createClient()
  client.instanceConnect = instanceRedis
  handleEventConnection({ connectionRedis: instanceRedis })
  await instanceRedis.connect()
}

const getRedis = () => client.instanceConnect

const closeRedis = () => {
  if (client.instanceConnect) {
    client.instanceConnect.quit()
  }
}

export const RedisDB = {
  initRedis,
  getRedis,
  closeRedis,
}
