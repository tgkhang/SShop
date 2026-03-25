/**
 * Centralized connection initializer.
 * All DB/cache/search connections are bootstrapped here in one place.
 * Import and call initConnections() once in app.js.
 */

import '#dbs/init.mongodb.js'           // MongoDB — auto-connects on import
import { RedisDB } from '#dbs/init.redis.js'
import { RedisDB as IORedisDB } from '#dbs/init.ioredis.js'
import { ElasticDB } from '#dbs/init.elasticsearch.js'

const initConnections = () => {
  RedisDB.initRedis()
  IORedisDB.initIORedis({ IOREDIS_IS_ENABLED: true })
  ElasticDB.initElasticsearch({ isEnabled: true })
}

const closeConnections = async () => {
  RedisDB.closeRedis?.()
  IORedisDB.closeIORedis()
  await ElasticDB.closeElasticsearch()
}

export { initConnections, closeConnections }
