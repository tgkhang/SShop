# MySQL Exporter - GUIDE

## MySQL Exporter definition

MySQL Exporter (mysqld-exporter) là một chương trình nhỏ chạy bên cạnh MySQL, chuyên **đọc thông tin hiệu năng và trạng thái của MySQL** rồi expose ra cho Prometheus lấy.

Trong khi `Node Exporter` đo server hardware và `Micrometer` đo application, MySQL Exporter đo được:

- **Connections** — số kết nối đang mở, max connections
- **Queries** — số query/s, slow queries, query cache
- **InnoDB** — buffer pool usage, row locks, I/O
- **Replication** — lag, trạng thái slave
- **Tables** — table locks, open tables, table size

**Simple Visualization:**

```txt
[MySQL Server :3306]
  ├── Connections, Queries, InnoDB, Locks
  └── MySQL Exporter (:9104)  ←── Prometheus ask every 5s
                                   "Let me see database metrics"
```

---

## How exporter works in Docker

MySQL Exporter kết nối đến MySQL qua TCP và chạy các câu `SHOW STATUS`, `SHOW VARIABLES`, query `information_schema`, `performance_schema` để thu thập metrics.

Cấu hình kết nối qua file `.my.cnf`:

```ini
[client]
user=root
password=root1234
host=mysql           # tên service trong docker-compose
port=3306
```

> **Lưu ý:** File `.my.cnf` được mount read-only vào container tại `/etc/mysql/.my.cnf`. Password phải khớp với `MYSQL_ROOT_PASSWORD` trong docker-compose.

---

## Check MySQL Exporter status

### 1. Check raw metrics

URL: `http://localhost:9104/metrics`

Result:

```txt
# HELP mysql_global_status_connections Total number of connections.
mysql_global_status_connections 150
# HELP mysql_global_status_queries Total number of queries.
mysql_global_status_queries 12345
# HELP mysql_global_status_threads_connected Current number of open connections.
mysql_global_status_threads_connected 5
...
# HELP mysql_global_variables_max_connections Maximum number of connections.
mysql_global_variables_max_connections 151
```

### 2. Check in Prometheus

Vào `http://localhost:9090/targets` → Tìm job `ticketsell-mysql-exporter` → Status phải là `UP`.

---

## Config in prometheus.yml

```yaml
- job_name: "ticketsell-mysql-exporter"
  scrape_interval: 5s
  static_configs:
    - targets: [ "host.docker.internal:9104" ]
  metrics_path: /metrics
```

---

## Các query PromQL hữu ích

### Số connections đang mở

```promql
mysql_global_status_threads_connected
```

### % connections đã dùng so với max

```promql
(mysql_global_status_threads_connected / mysql_global_variables_max_connections) * 100
```

Giải thích:

- `mysql_global_status_threads_connected` — số kết nối đang hoạt động
- `mysql_global_variables_max_connections` — giới hạn tối đa
- Nếu > 80% là dấu hiệu cần tăng `max_connections` hoặc kiểm tra connection leak

### Số queries per second

```promql
rate(mysql_global_status_queries[1m])
```

### Slow queries per second

```promql
rate(mysql_global_status_slow_queries[1m])
```

> Nếu slow queries tăng đột biến → kiểm tra query plan và index.

### InnoDB Buffer Pool Hit Rate (%)

```promql
(1 - (rate(mysql_global_status_innodb_buffer_pool_reads[1m]) / rate(mysql_global_status_innodb_buffer_pool_read_requests[1m]))) * 100
```

Giải thích:

- `innodb_buffer_pool_reads` — số lần phải đọc từ disk
- `innodb_buffer_pool_read_requests` — tổng số yêu cầu đọc
- Hit rate > 99% là tốt, < 95% cần tăng `innodb_buffer_pool_size`

### InnoDB Row Lock Waits per second

```promql
rate(mysql_global_status_innodb_row_lock_waits[1m])
```

### Bytes received / sent per second

```promql
rate(mysql_global_status_bytes_received[1m])
rate(mysql_global_status_bytes_sent[1m])
```

---

## Import Dashboard MySQL trong Grafana

Dashboard **"MySQL Overview" (ID: 7362)** là dashboard cộng đồng phổ biến cho MySQL Exporter.

**Cách import:**

1. Vào Grafana `http://localhost:3000`
2. Sidebar trái → **Dashboards** → **New** → **Import**
3. Nhập ID: `7362` → Click **Load**
4. Chọn data source **Prometheus** → **Import**

Kết quả: Dashboard với các panel hiển thị Connections, Query throughput, InnoDB metrics, Table locks, Replication status.

> **Dashboard khác hay dùng:**
>
> - **14057** — MySQL Exporter Quickstart and Dashboard
> - **6239** — MySQL Performance Schema

---

## Cấu trúc trong docker-compose

```yaml
mysqld-exporter:
  container_name: pre-event-mysqld-exporter
  image: prom/mysqld-exporter:latest
  restart: unless-stopped
  ports:
    - "9104:9104"               # expose port để Prometheus scrape
  networks:
    - pre-event-network
  extra_hosts:
    - host.docker.internal:host-gateway
  environment:
    - DATA_SOURCE_NAME=root:root1234@(mysql:3306)/ticket
  command:
    - '--config.my-cnf=/etc/mysql/.my.cnf'
    - '--collect.engine_innodb_status'          # chi tiết InnoDB engine
    - '--collect.info_schema.processlist'       # danh sách process đang chạy
    - '--collect.info_schema.tables'            # thông tin bảng
    - '--collect.info_schema.query_response_time' # phân phối thời gian query
    - '--collect.perf_schema.file_events'       # I/O file events
    - '--collect.perf_schema.eventsstatements'  # thống kê câu lệnh SQL
    - '--collect.perf_schema.indexiowaits'      # I/O wait theo index
    - '--collect.global_status'                 # SHOW GLOBAL STATUS
  volumes:
    - ./mysqld-exporter/.my.cnf:/etc/mysql/.my.cnf:ro
  depends_on:
    - mysql
```

### Giải thích các collector flags

| Flag | Thu thập gì |
|------|------------|
| `--collect.engine_innodb_status` | `SHOW ENGINE INNODB STATUS` — locks, transactions, I/O |
| `--collect.info_schema.processlist` | Danh sách query đang chạy, thời gian chờ |
| `--collect.info_schema.tables` | Kích thước bảng, số rows, data/index size |
| `--collect.info_schema.query_response_time` | Phân phối thời gian phản hồi query |
| `--collect.perf_schema.file_events` | Số lần đọc/ghi file, bytes I/O |
| `--collect.perf_schema.eventsstatements` | Top SQL statements theo thời gian, rows |
| `--collect.perf_schema.indexiowaits` | Thời gian chờ I/O theo từng index |
| `--collect.global_status` | Tất cả metrics từ `SHOW GLOBAL STATUS` |

---

## So sánh: MySQL Exporter vs Node Exporter vs Micrometer

| | MySQL Exporter | Node Exporter | Micrometer (Spring Boot) |
|--|---------------|--------------|------------------------|
| **Đo gì** | Database: queries, connections, InnoDB, locks | Server hardware: CPU, RAM, Disk, Network | Application: JVM, HTTP, DB connections |
| **Chạy ở đâu** | Container riêng, kết nối TCP đến MySQL | Container riêng, mount host filesystem | Bên trong Spring Boot app |
| **Endpoint** | `:9104/metrics` | `:9100/metrics` | `:8080/actuator/prometheus` |
| **Khi nào cần** | Khi cần monitor hiệu năng database | Khi cần monitor hạ tầng server | Khi cần monitor ứng dụng |

**Kết luận:** Cần cả ba để có cái nhìn toàn diện — Node Exporter cho biết server có đang "khỏe" không, MySQL Exporter cho biết database có đang hoạt động tốt không, Micrometer cho biết ứng dụng có đang xử lý đúng không.
