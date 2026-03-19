# Prometheus - GUIDE

## Prometheus là gì?

Prometheus là một công cụ **monitoring và alerting** mã nguồn mở. It continously asking your application for metrics and stores them in a time-series database.

- CPU current usage %?
- How many HTTP requests per second?
- How long do requests take?
- How many errors requests?

**Simple Visualization:**

```txt
[Spring Boot App] <-- Prometheus ask every 5s --> [Prometheus Server]
                        "show metrics"         save to database
```

Prometheus **actively pull** metrics from your app, the app doesn't need to send anything. This is different from other monitoring tools that require you to push metrics.

## Kiến trúc tổng quan

```txt
┌─────────────────────────────────────────────────────┐
│                   Monitoring Stack                   │
│                                                      │
│  Spring Boot App (:8080)                             │
│    └── /actuator/prometheus  ◄──── scrape ──┐        │
│                                             │        │
│  Node Exporter (:9100)       ◄──── scrape ──┤        │
│    └── /metrics                             │        │
│                                        Prometheus    │
│  Prometheus (:9090)          ◄──── scrape ──┘        │
│    └── /metrics (self)                               │
│         │                                            │
│         ▼                                            │
│      Grafana (:3000)  ── query ──► Prometheus        │
│    (visualize data)                                  │
└─────────────────────────────────────────────────────┘
```

---

## Cách Prometheus hoạt động trong project này

### Step 1 — Spring Boot expose metrics

2 dependency trong `xxxx-start/pom.xml`:

```xml
<!-- Actuator: open endpoint /actuator/* -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- Micrometer: format metrics theo chuẩn Prometheus -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
    <scope>runtime</scope>
</dependency>
```

Và config trong `application.yml`:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: '*'          # mở tất cả endpoint actuator
  endpoint:
    prometheus:
      enabled: true           # bật /actuator/prometheus
  metrics:
    tags:
      application: ${spring.application.name}   # gán label app name cho mọi metric
```

After running app, use `http://localhost:8080/actuator/prometheus` to view the metrics:

```txt
# HELP jvm_memory_used_bytes ...
jvm_memory_used_bytes{area="heap",...} 1.23456789E8
# HELP http_server_requests_seconds ...
http_server_requests_seconds_count{...} 42.0
...
```

### Step 2 — Prometheus scrape định kỳ

File `environment/prometheus/prometheus.yml` define who to scrape, how often, and where to find the metrics:

```yaml
global:
  scrape_interval: 15s        # default ask every 15s 

scrape_configs:
  - job_name: "ticketsell-springboot"
    scrape_interval: 5s       # override: hỏi mỗi 5s
    static_configs:
      - targets: [ "host.docker.internal:8080" ]   # địa chỉ Spring Boot app
    metrics_path: /actuator/prometheus              # đường dẫn lấy metrics

  - job_name: "ticketsell-node-exporter"
    scrape_interval: 5s
    static_configs:
      - targets: [ "host.docker.internal:9100" ]   # địa chỉ Node Exporter
    metrics_path: /metrics
```

> `host.docker.internal` là cách container Docker gọi ra máy host của bạn (Windows/Mac). Trên Linux thuần dùng IP của máy host.

### Step 3 — Prometheus lưu và query

Prometheus lưu dữ liệu vào thư mục `environment/data/prometheus_data/`. Bạn có thể query bằng ngôn ngữ **PromQL** tại `http://localhost:9090`.

---

## Setup and run

### 1. Start

```bash
docker-compose -f environment/docker-compose-dev.yml up -d
```

### 2. Checking Prometheus status

URL: `http://localhost:9090`

Vào **Status → Targets** để xem Prometheus đang scrape những gì:

```txt
ticketsell-springboot  http://host.docker.internal:8080/actuator/prometheus  UP
ticketsell-node-exporter  http://host.docker.internal:9100/metrics           UP
```

`UP` = SUCCESS.

### 3. Try basic PromQL

Tại trang `http://localhost:9090/graph`, nhập vào ô Expression:

| Query | Ý nghĩa |
|-------|---------|
| `up` | Xem tất cả targets còn sống (1=UP, 0=DOWN) |
| `jvm_memory_used_bytes` | Memory JVM đang dùng |
| `http_server_requests_seconds_count` | Tổng số HTTP request |
| `rate(http_server_requests_seconds_count[1m])` | Request/giây trong 1 phút qua |
| `process_cpu_usage` | CPU usage của Spring Boot process |

---

## Related files structure

```txt
xxxx.com/
├── environment/
│   ├── docker-compose-dev.yml        # định nghĩa container Prometheus
│   └── prometheus/
│       └── prometheus.yml            # config scrape targets
├── xxxx-start/
│   ├── pom.xml                       # dependency micrometer-registry-prometheus
│   └── src/main/resources/
│       └── application.yml           # bật /actuator/prometheus endpoint
```
