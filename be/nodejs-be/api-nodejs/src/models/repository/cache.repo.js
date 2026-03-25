'use strict'

import { getIORedis } from '#dbs/init.ioredis.js'

const getRedis = () => {
  const client = getIORedis()
  if (!client) throw new Error('Redis cache is not initialized')
  return client
}

const setCache = async ({ key, value }) => {
  return await getRedis().set(key, JSON.stringify(value))
}

const setCacheIOExpire = async ({ key, value, ttl }) => {
  return await getRedis().set(key, JSON.stringify(value), 'EX', ttl)
}

const getCache = async ({ key }) => {
  const data = await getRedis().get(key)
  return data ? JSON.parse(data) : null
}

const delCache = async ({ key }) => {
  return await getRedis().del(key)
}

export const CacheRepo = {
  setCache,
  setCacheIOExpire,
  getCache,
  delCache,
}
