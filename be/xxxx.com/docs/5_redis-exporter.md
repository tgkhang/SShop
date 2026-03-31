# Redis Exporter - GUIDE

## Redis Exporter definition

Redis Exporter là một chương trình nhỏ chạy bên cạnh Redis, chuyên **đọc thông tin hiệu năng và trạng thái của Redis** rồi expose ra cho Prometheus lấy.

Trong khi `Node Exporter` đo server hardware và `Micrometer` đo application, Redis Exporter đo được:

- **Memory** — RAM đang dùng, peak memory, fragmentation ratio
- **Clients** — số client đang kết nối, blocked clients
- **Commands** — số commands/s, hit/miss ratio
- **Keys** — tổng số keys, expired keys, evicted keys
- **Persistence** — RDB/AOF status, last save time
- **Replication** — master/slave status, replication lag

**Simple Visualization:**

```txt
[Redis Server :6379]
  ├── Memory, Clients, Commands, Keys, Persistence
  └── Redis Exporter (:9121)  ←── Prometheus ask every 5s
                                   "Let me see Redis metrics"
```

---

## How exporter works in Docker

Redis Exporter kết nối đến Redis qua TCP và chạy lệnh `INFO` để thu thập toàn bộ metrics. Không cần mount file hay cấu hình phức tạp — chỉ cần chỉ đúng địa chỉ Redis.

Cấu hình kết nối qua biến môi trường `REDIS_ADDR`:

```yaml
environment:
  - REDIS_ADDR=redis://redis:6379    # tên service trong docker-compose
```

> **Lưu ý quan trọng:** Mặc định Redis Exporter kết nối đến `localhost:6379`. Trong Docker, `localhost` trỏ về chính container của exporter, **không phải** container Redis. Phải dùng tên service (`redis`) để kết nối qua Docker network.

> **Nếu Redis có password**, thêm biến `REDIS_PASSWORD`:
>
> ```yaml
> environment:
>   - REDIS_ADDR=redis://redis:6379
>   - REDIS_PASSWORD=your_password
> ```

---

## Check Redis Exporter status

### 1. Check raw metrics

URL: `http://localhost:9121/metrics`

Result:

```txt
# HELP redis_up Information about the Redis instance
redis_up 1
# HELP redis_uptime_in_seconds Uptime in seconds
redis_uptime_in_seconds 86400
# HELP redis_connected_clients Number of client connections
redis_connected_clients 5
...
# HELP redis_memory_used_bytes Total number of bytes allocated by Redis
redis_memory_used_bytes 1.048576e+06
# HELP redis_commands_processed_total Total number of commands processed
redis_commands_processed_total 50000
```

> **Quan trọng:** Kiểm tra `redis_up` — nếu là `1` thì exporter kết nối thành công, nếu là `0` thì đang lỗi kết nối.

### 2. Check in Prometheus

Vào `http://localhost:9090/targets` → Tìm job `ticketsell-redis-exporter` → Status phải là `UP`.

---

## Config in prometheus.yml

```yaml
- job_name: "ticketsell-redis-exporter"
  scrape_interval: 5s
  static_configs:
    - targets: [ "host.docker.internal:9121" ]
  metrics_path: /metrics
```

---

## Các query PromQL hữu ích

### Redis đang hoạt động không?

```promql
redis_up
```

> Giá trị `1` = đang hoạt động, `0` = không kết nối được.

### Memory đang sử dụng (MB)

```promql
redis_memory_used_bytes / 1024 / 1024
```

### Memory fragmentation ratio

```promql
redis_memory_fragmentation_ratio
```

Giải thích:

- Ratio > 1.5 — Redis đang bị fragmentation, lãng phí RAM
- Ratio < 1 — Redis đang dùng swap, rất chậm, cần thêm RAM
- Ratio 1.0 ~ 1.5 — bình thường

### Số connected clients

```promql
redis_connected_clients
```

### Commands per second

```promql
rate(redis_commands_processed_total[1m])
```

### Cache Hit Rate (%)

```promql
(rate(redis_keyspace_hits_total[1m]) / (rate(redis_keyspace_hits_total[1m]) + rate(redis_keyspace_misses_total[1m]))) * 100
```

Giải thích:

- `keyspace_hits` — số lần tìm key và có kết quả
- `keyspace_misses` — số lần tìm key nhưng không có
- Hit rate > 90% là tốt, < 80% cần review lại caching strategy

### Expired keys per second

```promql
rate(redis_expired_keys_total[1m])
```

### Evicted keys per second

```promql
rate(redis_evicted_keys_total[1m])
```

> Nếu evicted keys > 0 → Redis đang hết memory và phải xóa keys theo policy (`maxmemory-policy`). Cần tăng RAM hoặc giảm data.

### Blocked clients

```promql
redis_blocked_clients
```

> Blocked clients thường do `BLPOP`, `BRPOP`, `WAIT`. Số lượng cao có thể là dấu hiệu bottleneck.

---

## Import Dashboard Redis trong Grafana

Dashboard **"Prometheus Redis Exporter" (ID: 763)** là dashboard cộng đồng phổ biến cho Redis Exporter.

**Cách import:**

1. Vào Grafana `http://localhost:3000`
2. Sidebar trái → **Dashboards** → **New** → **Import**
3. Nhập ID: `763` → Click **Load**
4. Chọn data source **Prometheus** → **Import**

Kết quả: Dashboard với các panel hiển thị Memory, Clients, Commands/s, Hit/Miss ratio, Keys, Network I/O.

> **Dashboard khác hay dùng:**
>
> - **11835** — Redis Dashboard for Prometheus Redis Exporter
> - **14091** — Redis Overview

---

## Cấu trúc trong docker-compose

```yaml
redis-exporter:
  container_name: pre-event-redis-exporter
  image: oliver006/redis_exporter:latest
  restart: unless-stopped
  ports:
    - "9121:9121"               # expose port để Prometheus scrape
  environment:
    - REDIS_ADDR=redis://redis:6379   # kết nối đến Redis qua Docker network
  networks:
    - pre-event-network
  depends_on:
    - redis                     # đảm bảo Redis start trước
```

### Giải thích cấu hình

| Config | Ý nghĩa |
|--------|---------|
| `REDIS_ADDR=redis://redis:6379` | Địa chỉ kết nối — `redis` là tên service trong docker-compose, resolve qua Docker DNS |
| `depends_on: redis` | Đảm bảo Redis container start trước exporter |
| Port `9121` | Port mặc định của Redis Exporter |

### Các biến môi trường khác

| Biến | Mô tả | Mặc định |
|------|--------|----------|
| `REDIS_ADDR` | Địa chỉ Redis server | `redis://localhost:6379` |
| `REDIS_PASSWORD` | Password nếu Redis có auth | (trống) |
| `REDIS_EXPORTER_CHECK_KEYS` | Glob pattern để đo key size | (trống) |
| `REDIS_EXPORTER_CHECK_SINGLE_KEYS` | Đo specific keys | (trống) |

---

## Troubleshooting

### Lỗi "Couldn't connect to redis instance"

**Nguyên nhân:** Exporter đang kết nối đến `localhost:6379` — trong Docker đây là chính container exporter, không phải Redis.

**Fix:** Thêm `REDIS_ADDR=redis://redis:6379` vào environment.

### redis_up = 0

**Kiểm tra:**

1. Redis container có đang chạy không: `docker ps | grep redis`
2. Có cùng Docker network không: `docker network inspect pre-event-network`
3. Thử kết nối trực tiếp: `docker exec pre-event-redis-exporter wget -qO- redis:6379`

---
