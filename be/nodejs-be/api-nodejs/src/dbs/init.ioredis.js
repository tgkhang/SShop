import { env } from '#configs/environment.js'
import { RedisErrorResponse } from '#core/error.response.js'
import redis from 'ioredis'

let client = {}
let statusConnectRedis = {
  CONNECT: 'connect',
  END: 'end',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
}

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
    console.log('IORedis connected successfully')
    clearTimeout(connectionTimeout) // Clear the connection timeout if connected successfully
  })

  connectionRedis.on(statusConnectRedis.END, () => {
    console.log('IORedis connection closed')

    // Retry connection
    handleConnectionTimeout()
  })

  connectionRedis.on(statusConnectRedis.RECONNECTING, () => {
    console.log('IORedis is reconnecting...')
    clearTimeout(connectionTimeout) // Clear the connection timeout if reconnecting
  })

  connectionRedis.on(statusConnectRedis.ERROR, (err) => {
    console.error('IORedis connection error:', err)
    handleConnectionTimeout()
  })
}

const initIORedis = async ({
  IOREDIS_IS_ENABLED = true,
  IOREDIS_HOST = env.REDIS_HOST,
  IOREDIS_PORT = env.REDIS_PORT || 6379,
}) => {
  if (IOREDIS_IS_ENABLED) {
    const instanceRedis = new redis({
      host: IOREDIS_HOST,
      port: IOREDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
    })
    client.instanceConnect = instanceRedis
    handleEventConnection({ connectionRedis: instanceRedis })
  }
}

const getIORedis = () => client.instanceConnect

const closeIORedis = () => {
  if (client.instanceConnect) {
    client.instanceConnect.quit()
  }
}

export { getIORedis, closeIORedis }

export const RedisDB = {
  initIORedis,
  getIORedis,
  closeIORedis,
}
