package com.xxxx.ddd.infrastructure.distributed.redisson;

import java.util.concurrent.TimeUnit;

public interface RedisDistributedLocker {
    /**
     * try to acquire the lock, if the lock is not available, wait for waitTime and
     * then give up
     * 
     * @param waitTime  the maximum time to wait for the lock
     * @param leaseTime the time to hold the lock after acquiring it, before
     *                  automatically releasing it
     * @param unit      the time unit of the waitTime and leaseTime parameters (ex:
     *                  TimeUnit.SECONDS, TimeUnit.MINUTES)
     * @return true if the lock was acquired and false if the waiting time elapsed
     *         before the lock was acquired
     * @throws InterruptedException
     */
    boolean tryLock(long waitTime, long leaseTime, TimeUnit unit) throws InterruptedException;

    /**
     * acquire the lock and hold it until either the lock is released by the current
     * thread or the lease time expires
     * 
     * @param leaseTime the time to hold the lock after acquiring it, before
     *                  automatically releasing it
     * @param unit      the time unit of the leaseTime parameter (ex:
     *                  TimeUnit.SECONDS, TimeUnit.MINUTES)
     */
    void lock(long leaseTime, TimeUnit unit);

    // release the lock
    void unlock();

    // check if the lock is held by any thread
    boolean isLocked();

    // check if the lock is held by the thread with the given threadId
    boolean isHeldByThread(long threadId);

    // check if the lock is held by the current thread
    boolean isHeldByCurrentThread();
}
