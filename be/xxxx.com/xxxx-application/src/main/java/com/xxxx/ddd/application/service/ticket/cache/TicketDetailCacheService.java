package com.xxxx.ddd.application.service.ticket.cache;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.xxxx.ddd.domain.model.entity.TicketDetail;
import com.xxxx.ddd.domain.service.TicketDetailDomainService;
import com.xxxx.ddd.infrastructure.cache.redis.RedisInfrasService;
import com.xxxx.ddd.infrastructure.distributed.redisson.RedisDistributedLocker;
import com.xxxx.ddd.infrastructure.distributed.redisson.RedisDistributedService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;


@Service
@Slf4j
public class TicketDetailCacheService {

    @Autowired
    private RedisDistributedService redisDistributedService;

    @Autowired
    private RedisInfrasService redisInfrasService;

    @Autowired
    private TicketDetailDomainService ticketDetailDomainService;


    // use guava
    private final static Cache<Long, TicketDetail> ticketDetailLocalCache = CacheBuilder.newBuilder()
            .initialCapacity(10)
            .concurrencyLevel(16)  // số lõi của cpu echo $NUMBER_OF_PROCESSORS /systemctl -n hw.physicalcpu
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .build();


    /**
     * LEVEL 1 - NORMAL: Simple Redis cache-aside (no lock).
     * Risk: cache stampede when cache expires under high traffic.
     */
    public TicketDetail getTicketDefaultCacheNormal(Long id, Long version) {
        // 1. get item by Redis
        TicketDetail ticketDetail = redisInfrasService.getObject(getEventItemKey(id), TicketDetail.class);

        // cache hit
        if (ticketDetail != null) {
            log.info("cache hit: id={}, version={}, data={}", id, version, ticketDetail);
            return ticketDetail;
        }

        // cache miss — go to DB
        log.info("cache miss: id={}, version={}", id, version);
        ticketDetail = ticketDetailDomainService.getTicketDetailById(id);

        if (ticketDetail != null) {
            redisInfrasService.setObject(getEventItemKey(id), ticketDetail);
        }
        return ticketDetail;
    }


    /**
     * LEVEL 2 - VIP: Redis cache-aside + distributed lock (Redisson).
     * Prevents cache stampede: only ONE thread rebuilds the cache; others wait then re-read.
     */
    public TicketDetail getTicketDefaultCacheVip(Long id, long version) {
        // 1. try Redis first
        TicketDetail ticketDetail = redisInfrasService.getObject(getEventItemKey(id), TicketDetail.class);

        log.info("cache hit: id={}, version={}, data={}", id, version, ticketDetail);

        if (ticketDetail != null) {
            log.info("From distributed cache (no lock needed): id={}", id);
            return ticketDetail;
        }

        log.info("cache miss: id={}, version={}", id, version);

        // 2. acquire distributed lock — only one thread rebuilds cache
        RedisDistributedLocker locker = redisDistributedService.getDistributed("PRO_LOCK_KEY_ITEM" + id);

        try {
            boolean isLock = locker.tryLock(1, 5, TimeUnit.SECONDS);

            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            if (!isLock) {
                log.info("Failed to acquire lock, returning stale/null for id={}", id);
                return ticketDetail;
            }

            // double-check cache after acquiring lock (another thread may have populated it)
            ticketDetail = redisInfrasService.getObject(getEventItemKey(id), TicketDetail.class);

            if (ticketDetail != null) {
                log.info("Cache hit after acquiring lock (double-check): id={}", id);
                return ticketDetail;
            }

            // still not in cache — fetch from DB
            ticketDetail = ticketDetailDomainService.getTicketDetailById(id);

            if (ticketDetail == null) {
                log.info("Ticket not found in DB for id={}, caching null to prevent penetration", id);
                // cache null to prevent cache penetration on non-existent IDs
                redisInfrasService.setObject(getEventItemKey(id), null);
                return null;
            }

            // found — populate cache
            redisInfrasService.setObject(getEventItemKey(id), ticketDetail);
            return ticketDetail;

        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            locker.unlock();
        }
    }


    private TicketDetail getTicketDetailLocalCache(Long id) {
        try {
            return ticketDetailLocalCache.getIfPresent(id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * LEVEL 3 - LOCAL + DISTRIBUTED + LOCK: Two-layer cache (Guava → Redis) + distributed lock.
     * Fastest reads: in-process Guava cache absorbs the hottest traffic.
     * Distributed lock still guards DB for cold misses.
     */
    public TicketDetail getTicketDefaultCacheLocal(Long id, long version) {

        // 1. local (in-process) cache — fastest, zero network
        TicketDetail ticketDetail = getTicketDetailLocalCache(id);

        log.info("local cache lookup: id={}, version={}, data={}", id, version, ticketDetail);

        if (ticketDetail != null) {
            log.info("From local cache: id={}", id);
            return ticketDetail;
        }

        log.info("local cache miss: id={}, version={}", id, version);

        // 2. distributed Redis cache
        ticketDetail = redisInfrasService.getObject(getEventItemKey(id), TicketDetail.class);
        if (ticketDetail != null) {
            log.info("From distributed cache: id={}", id);
            ticketDetailLocalCache.put(id, ticketDetail);
            return ticketDetail;
        }

        // 3. both caches missed — acquire distributed lock before hitting DB
        RedisDistributedLocker locker = redisDistributedService.getDistributed("PRO_LOCK_KEY_ITEM" + id);

        try {
            boolean isLock = locker.tryLock(1, 5, TimeUnit.SECONDS);

            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            if (!isLock) {
                log.info("Failed to acquire lock, returning stale/null for id={}", id);
                return ticketDetail;
            }

            // double-check Redis after acquiring lock
            ticketDetail = redisInfrasService.getObject(getEventItemKey(id), TicketDetail.class);

            if (ticketDetail != null) {
                log.info("Redis hit after acquiring lock (double-check): id={}", id);
                ticketDetailLocalCache.put(id, ticketDetail);
                return ticketDetail;
            }

            // still nothing — fetch from DB
            ticketDetail = ticketDetailDomainService.getTicketDetailById(id);

            if (ticketDetail == null) {
                log.info("Ticket not found in DB for id={}, caching null to prevent penetration", id);
                // cache null to prevent cache penetration
                redisInfrasService.setObject(getEventItemKey(id), null);
                ticketDetailLocalCache.put(id, null);
                return null;
            }

            // populate both caches
            redisInfrasService.setObject(getEventItemKey(id), ticketDetail);
            ticketDetailLocalCache.put(id, ticketDetail);
            return ticketDetail;

        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            // LƯu ý: cho dù thành công hay ko cũng phải unlock, bằng mọi giá
            locker.unlock();
        }
    }


    private String getEventItemKey(Long id) {
        return "PRO_TICKET:ITEM" + id;
    }
}
