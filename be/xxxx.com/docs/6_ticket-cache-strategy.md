# Ticket Detail Cache Strategy — 3 Levels

## Overview

`TicketDetailAppServiceImpl.getTicketDetailById()` wires together three progressively more robust caching strategies, implemented in `TicketDetailCacheService`. Each level solves a specific production problem. Uncomment the desired level in the app service to switch between them.

- chuyển đổi comment để chạy

---

## Level 1 — Normal (Simple Redis Cache-Aside)

**Method:** `getTicketDefaultCacheNormal(id, version)`

```text
Request
  │
  ├─► Redis hit? ──YES──► return
  │
  └─► Redis miss ──► DB ──► set Redis ──► return
```

**What it does:**

1. Check Redis. If found, return immediately.
2. On miss, query DB, store result in Redis, return.

**Problem it solves:** Avoids hitting the DB on every request once the cache is warm.

**Remaining risk — Cache Stampede:**

- các vấn đề như hết hạn, tuyết lở, chưa co lock đã đề cập note

---

## Level 2 — VIP (Redis + Distributed Lock)

**Method:** `getTicketDefaultCacheVip(id, version)`

```txt
Request
  │
  ├─► Redis hit? ──YES──► return
  │
  └─► Redis miss ──► tryLock (Redisson, wait 1s, hold 5s)
        │
        ├─► Lock FAILED ──► return null (or stale)
        │
        └─► Lock acquired
              │
              ├─► Redis double-check hit? ──YES──► unlock ──► return
              │
              └─► DB ──► set Redis ──► unlock ──► return
```

**What it does:**

1. Check Redis.
2. On miss, only **one thread** acquires a Redisson distributed lock.
3. Losing threads get `null` back immediately (no DB hit).
4. The lock winner **double-checks Redis** (another node may have populated it while waiting).
5. If still a miss, the winner queries DB and populates Redis.
6. Lock is **always released in `finally`** — this is critical.

**Problem it solves:** Cache stampede. Only one writer hits the DB; all others fail-fast.

**Remaining cost:** In-process threads still pay the Redis network round-trip on every hot read.
áp dụng local cached để đẩy mạnh lượng request

---

## Level 3 — Local + Distributed + Lock (Two-Layer Cache)

**Method:** `getTicketDefaultCacheLocal(id, version)`

```txt
Request
  │
  ├─► Guava local cache hit? ──YES──► return   (zero network, ~ns)
  │
  └─► Guava miss
        │
        ├─► Redis hit? ──YES──► put Guava ──► return   (~1ms)
        │
        └─► Redis miss ──► tryLock (Redisson)
              │
              ├─► Lock FAILED ──► return null
              │
              └─► Lock acquired
                    │
                    ├─► Redis double-check? ──YES──► put Guava ──► unlock ──► return
                    │
                    └─► DB ──► set Redis ──► put Guava ──► unlock ──► return
```

**What it does:**

1. **Guava in-process cache** (10 min TTL, 16 concurrent writers) absorbs the hottest reads with zero network cost.
2. On local miss, fall through to **Redis** (distributed, shared across all pods).
3. On Redis miss, acquire **Redisson lock** to guard the DB — same double-check pattern as Level 2.
4. Both caches are populated on each DB read.
5. `null` is also cached at both layers to prevent **cache penetration** on non-existent IDs.

**Problem it solves:** Peak throughput. For a hot ticket item every node serves thousands of reads per second from local memory without a single network call.

**Trade-off:** Local cache is per-node — a cache invalidation (e.g. price update) requires either a short TTL or a pub/sub broadcast to all nodes.

---

## Switching Levels

In `TicketDetailAppServiceImpl.getTicketDetailById()`, uncomment the desired level:

```java
// Level 1 — simple, no stampede protection
// return ticketDetailDomainService.getTicketDetailById(ticketId);

// Level 2 — Redis + distributed lock
// return ticketDetailCacheService.getTicketDefaultCacheNormal(ticketId, System.currentTimeMillis());

// Level 2 (VIP) — Redis + lock + double-check
// return ticketDetailCacheService.getTicketDefaultCacheVip(ticketId, System.currentTimeMillis());

// Level 3 — local + Redis + lock (production recommended for hot tickets)
// return ticketDetailCacheService.getTicketDefaultCacheLocal(ticketId, System.currentTimeMillis());
```

## Test bằng wrk

```bash
wrk -t12 -c2000 -d2m http://localhost:8080/ticket
```

Ý nghĩa:

- `-t12`: 12 threads
- `-c2000`: 2000 concurrent connections
- `-d2m`: duration 2 minutes
- `http://localhost:8080/ticket`: target URL (adjust as needed)

12 thread chạy concurrentcy 2000 request đồng thơi, chia deu cho 12 thread, mỗi thread sẽ có khoảng 166-167 request đồng thời. Tổng cộng sẽ có 2000 request được gửi đến server trong suốt 2 phút.

- chạy xong có vtheer vào <http://localhost:3000> (grafana) để xem dashboard redis, local cache hit/miss, db query count... để thấy sự khác biệt giữa các level cache strategy.
-
