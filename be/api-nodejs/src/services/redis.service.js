'use strict'

import { InventoryRepo } from '#models/repository/inventory.repo.js'
import redis from 'redis'

const redisClient = redis.createClient()
// Connect to Redis server (default: localhost:6379)
redisClient.connect().catch(console.error)
// const redisClient = redis.createClient({
//   socket: {
//     host: process.env.REDIS_HOST || 'localhost',
//     port: process.env.REDIS_PORT || 6379,
//   },
//   password: process.env.REDIS_PASSWORD || undefined,
//   database: process.env.REDIS_DB || 0,
// })

// Handle Redis errors
redisClient.on('error', (err) => console.log('Redis Client Error', err))

// ai dat hang thi lay key , dat xong thi tra key ve cho nguoi khac su dung
const acquireLock = async (productId, quantity, cartId) => {
  const key = `lock:product:${productId}`
  const retryTimes = 10
  const expireTime = 3000 // 3s thoi gian giu khoa

  for (let i = 0; i < retryTimes; i++) {
    // tao mot key moi, ai dat dc key thi dc quyen dat hang
    // Redis v5: SET with NX option returns null if key exists, 'OK' if successful
    const result = await redisClient.set(key, 'locked', {
      NX: true,
      PX: expireTime, // expireTime in milliseconds
    })

    if (result === 'OK') {
      const isReservation = await InventoryRepo.reservationInventory({
        productId,
        quantity,
        cartId,
      })

      // modifiedCount: so luong ban ghi bi thay doi
      // 0: khong dat dc hang
      // 1: dat dc hang
      if (isReservation.modifiedCount) return key

      // Release lock if reservation failed
      await redisClient.del(key)
      return null
    }
    // dat khoa ko thanh cong thi wait va thu lai
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  return null
}

const releaseLock = async (keyLock) => {
  return await redisClient.del(keyLock)
}

export const RedisService = {
  acquireLock,
  releaseLock,
}
