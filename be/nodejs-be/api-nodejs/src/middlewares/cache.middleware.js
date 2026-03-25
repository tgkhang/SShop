'use strict'

import { CacheRepo } from '#models/repository/cache.repo.js'

/**
 * Cache-aside middleware factory.
 * Checks Redis cache before hitting the controller.
 * Intercepts res.json to populate cache on miss.
 *
 * @param {object} options
 * @param {string} options.keyPrefix  - Cache key prefix (e.g. CACHE_PRODUCT.SKU)
 * @param {number} [options.ttl=300]  - TTL in seconds (default 5 min)
 * @param {function} [options.getKey] - Custom key builder fn(req) → string
 */
const cacheMiddleware = ({ keyPrefix, ttl = 300, getKey } = {}) => {
  return async (req, res, next) => {
    const cacheKey = getKey ? getKey(req) : `${keyPrefix}:${req.params.product_id}:${req.params.sku_id || req.params.spu_id || ''}`

    try {
      const cached = await CacheRepo.getCache({ key: cacheKey })
      if (cached) {
        return res.status(200).json({
          message: 'OK',
          metadata: { ...cached, fromCache: true },
        })
      }

      // Intercept res.json to store result in cache
      const originalJson = res.json.bind(res)
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && body?.metadata) {
          CacheRepo.setCacheIOExpire({ key: cacheKey, value: body.metadata, ttl }).catch(() => {})
        }
        return originalJson(body)
      }
    } catch {
      // Cache errors must not break the request
    }

    next()
  }
}

/**
 * Invalidates a cache key. Use after mutation (create/update/delete).
 */
const invalidateCache = ({ keyPrefix, getKey }) => {
  return async (req, res, next) => {
    const cacheKey = getKey ? getKey(req) : `${keyPrefix}:${req.params.product_id}:${req.params.sku_id || ''}`
    CacheRepo.delCache({ key: cacheKey }).catch(() => {})
    next()
  }
}

export { cacheMiddleware, invalidateCache }
