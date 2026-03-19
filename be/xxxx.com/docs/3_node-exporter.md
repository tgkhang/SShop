# Node Exporter - GUIDE

## Node Exporter definition

Node Exporter là một chương trình nhỏ chạy trên server, chuyên **đọc thông tin phần cứng và hệ điều hành** rồi expose ra cho Prometheus lấy.

Trong khi `micrometer` trong Spring Boot chỉ đo được những thứ bên trong JVM (heap, threads, HTTP requests...), Node Exporter đo được:

- **CPU** — usage, idle, iowait
- **RAM** — tổng, đã dùng, còn trống
- **Disk** — dung lượng, tốc độ đọc/ghi
- **Network** — bytes gửi/nhận, số kết nối
- **System** — load average, uptime, số process

**Simple Visualization:**

```txt
[Server/Machine]
  ├── CPU, RAM, Disk, Network
  └── Node Exporter (:9100)  ←── Prometheus ask every 5s
                                  "Let me see server metrics"
```

---

## How exporter works in Docker

Node Exporter mount các thư mục hệ thống của máy host vào container để đọc dữ liệu:

```yaml
node-exporter:
  volumes:
    - /proc:/host/proc:ro      # thông tin process của Linux
    - /sys:/host/sys:ro        # thông tin hardware/kernel
    - /:/rootfs:ro             # filesystem root (để đọc disk usage)
  command:
    - '--path.procfs=/host/proc'   # bảo Node Exporter đọc /proc từ /host/proc
    - '--path.rootfs=/rootfs'      # bảo Node Exporter đọc / từ /rootfs
    - '--path.sysfs=/host/sys'     # bảo Node Exporter đọc /sys từ /host/sys
    - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    # ↑ bỏ qua các mount point của hệ thống, chỉ đo disk thật
```

> **Lưu ý trên Windows/WSL2:** Node Exporter được thiết kế cho Linux. Khi chạy Docker Desktop trên Windows, nó chạy bên trong VM Linux của Docker Desktop — vì vậy metrics sẽ phản ánh VM đó, không phải Windows host.

---

## Check Node Exporter status

### 1. Check raw metrics

URL: `http://localhost:9100/metrics`

Result:

```txt
# HELP node_cpu_seconds_total Seconds the CPUs spent in each mode.
node_cpu_seconds_total{cpu="0",mode="idle"} 12345.67
node_cpu_seconds_total{cpu="0",mode="user"} 234.56
...
# HELP node_memory_MemTotal_bytes Memory information field MemTotal.
node_memory_MemTotal_bytes 8.589934592e+09
# HELP node_filesystem_size_bytes Filesystem size in bytes.
node_filesystem_size_bytes{device="/dev/sda1",...} 5.36870912e+10
```

### 2. Check in Prometheus

Vào `http://localhost:9090/targets` → Tìm job `ticketsell-node-exporter` → Status phải là `UP`.

---

## Config in prometheus.yml

```yaml
- job_name: "ticketsell-node-exporter"
  scrape_interval: 5s
  static_configs:
    - targets: [ "host.docker.internal:9100" ]
  metrics_path: /metrics    # Node Exporter dùng /metrics, không phải /actuator/prometheus
```

---

## Các query PromQL hữu ích

### CPU Usage (%)

```promql
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)
```

Giải thích:

- `node_cpu_seconds_total{mode="idle"}` — thời gian CPU đang rảnh
- `rate(...[1m])` — tính tốc độ thay đổi trong 1 phút
- `100 - (... * 100)` — đảo lại để ra % đang dùng

### RAM sử dụng (%)

```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

### RAM available (GB)

```promql
node_memory_MemAvailable_bytes / 1024 / 1024 / 1024
```

### Disk Usage (%)

```promql
100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)
```

### Network receive (KB/s)

```promql
rate(node_network_receive_bytes_total[1m]) / 1024
```

### System Load Average (1 phút)

```promql
node_load1
```

> Load average > số CPU core là dấu hiệu server đang bị quá tải.

---

## Import Dashboard Node Exporter trong Grafana

Dashboard **"Node Exporter Full" (ID: 1860)** là dashboard cộng đồng phổ biến nhất cho Node Exporter.

**Cách import:**

1. Vào Grafana `http://localhost:3000`
2. Sidebar trái → **Dashboards** → **New** → **Import**
3. Nhập ID: `1860` → Click **Load**
4. Chọn data source **Prometheus** → **Import**

Kết quả: Dashboard với 40+ panel hiển thị đầy đủ CPU, RAM, Disk, Network, System của server.

---

## Cấu trúc trong docker-compose

```yaml
node-exporter:
  container_name: pre-event-node-exporter
  image: prom/node-exporter:latest
  restart: unless-stopped
  ports:
    - "9100:9100"           # expose port để Prometheus scrape
  networks:
    - pre-event-network
  extra_hosts:
    - host.docker.internal:host-gateway
  command:
    - '--path.procfs=/host/proc'
    - '--path.rootfs=/rootfs'
    - '--path.sysfs=/host/sys'
    - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
  volumes:
    - /proc:/host/proc:ro
    - /sys:/host/sys:ro
    - /:/rootfs:ro
```

---

## So sánh: Node Exporter vs Micrometer

| | Node Exporter | Micrometer (Spring Boot) |
|--|--------------|------------------------|
| **Đo gì** | Server hardware: CPU, RAM, Disk, Network | Application: JVM, HTTP, DB connections |
| **Chạy ở đâu** | Container riêng | Bên trong Spring Boot app |
| **Endpoint** | `:9100/metrics` | `:8080/actuator/prometheus` |
| **Cần thiết không** | Để monitor hạ tầng | Để monitor ứng dụng |

**Kết luận:** Cần cả hai để có cái nhìn toàn diện — Node Exporter cho biết server có đang "khỏe" không, Micrometer cho biết ứng dụng có đang hoạt động đúng không.
