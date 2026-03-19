# Grafana - GUIDE

## Grafana là gì?

Grafana là công cụ **visualize (hiển thị)** dữ liệu. Nó không thu thập metrics — đó là việc của Prometheus. Grafana chỉ làm một việc: **kết nối vào Prometheus, query dữ liệu, và vẽ thành biểu đồ đẹp**.

**Simple Visualization:**

```txt
Prometheus (lưu data)  ──────►  Grafana (vẽ biểu đồ)  ──────►  Dashboard 
```

---

## Truy cập Grafana

URL:

```txt
http://localhost:3000
```

Login with:

- **Username:** `admin`
- **Password:** `admin1234`

> Thông tin này được cấu hình trong `docker-compose-dev.yml`:
>
> ```yaml
> GF_SECURITY_ADMIN_USER=admin
> GF_SECURITY_ADMIN_PASSWORD=admin1234
> ```

---

## Thêm Prometheus làm Data Source

Đây là bước bắt buộc trước khi tạo dashboard. Grafana cần biết "lấy dữ liệu từ đâu".

### Bước 1 — Vào menu Connections

Ở thanh sidebar trái, click vào icon **"Connections"** (hoặc vào `http://localhost:3000/connections/datasources`)

### Bước 2 — Add new data source

Click **"Add new data source"** → Chọn **"Prometheus"**

### Bước 3 — Điền thông tin kết nối

| Field | Giá trị | Giải thích |
|-------|---------|-----------|
| **Name** | `Prometheus` | Tên tùy chọn |
| **Prometheus server URL** | `http://pre-event-prometheus:9090` | Dùng tên container vì Grafana và Prometheus cùng Docker network |
| **Scrape interval** | `15s` | Khớp với `scrape_interval` trong `prometheus.yml` |

> **Tại sao dùng `pre-event-prometheus:9090` thay vì `localhost:9090`?**
>
> Grafana chạy bên trong Docker container. Từ trong container, `localhost` là chính container đó, không phải máy host của bạn. Vì cả Grafana và Prometheus đều trong cùng Docker network `pre-event-network`, chúng gọi nhau bằng tên container.

### Bước 4 — Save & Test

Click **"Save & Test"**. Nếu thấy thông báo:

```
✅ Successfully queried the Prometheus API.
```

Là đã kết nối thành công.

---

## Tạo Dashboard đầu tiên

### Cách 1 — Import dashboard có sẵn (khuyến nghị cho người mới)

Grafana có kho dashboard cộng đồng tại [grafana.com/grafana/dashboards](https://grafana.com/grafana/dashboards).

**Import dashboard JVM Micrometer (ID: 4701):**

1. Sidebar trái → **Dashboards** → **New** → **Import**
2. Điền Dashboard ID: `4701` → Click **Load**
3. Chọn data source `Prometheus` vừa tạo → **Import**

Kết quả: Bạn sẽ thấy ngay dashboard đẹp với JVM metrics của Spring Boot app.

**Một số dashboard hay dùng:**

| Dashboard ID | Tên | Dùng để xem |
|-------------|-----|------------|
| `4701` | JVM Micrometer | JVM heap, threads, GC của Spring Boot |
| `1860` | Node Exporter Full | CPU, RAM, Disk, Network của server |
| `11378` | Spring Boot Statistics | HTTP requests, response time |

### Cách 2 — Tự tạo panel

1. **Dashboards** → **New Dashboard** → **Add visualization**
2. Chọn data source **Prometheus**
3. Trong ô **Metrics**, nhập query PromQL, ví dụ:

   ```
   rate(http_server_requests_seconds_count{application="zzz.com"}[1m])
   ```

4. Chọn kiểu biểu đồ (Time series, Gauge, Bar chart...)
5. **Apply** → **Save dashboard**

---

## Các panel hữu ích cho project này

### HTTP Request Rate

```promql
rate(http_server_requests_seconds_count{application="zzz.com"}[1m])
```

Hiển thị số request/giây theo từng endpoint.

### HTTP Error Rate (5xx)

```promql
rate(http_server_requests_seconds_count{application="zzz.com", status=~"5.."}[1m])
```

### JVM Memory Usage

```promql
jvm_memory_used_bytes{application="zzz.com", area="heap"}
```

### CPU Usage

```promql
process_cpu_usage{application="zzz.com"}
```

### Circuit Breaker State

```promql
resilience4j_circuitbreaker_state{application="zzz.com"}
```

(0=CLOSED/hoạt động bình thường, 1=OPEN/đang chặn request)

---

## Cấu hình Grafana trong docker-compose

```yaml
grafana:
  container_name: pre-event-grafana
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
  volumes:
    - ./data/grafana_data:/var/lib/grafana    # lưu dashboard, config
  environment:
    - GF_SECURITY_ADMIN_USER=admin
    - GF_SECURITY_ADMIN_PASSWORD=admin1234
    - GF_USERS_ALLOW_SIGN_UP=false           # tắt tự đăng ký tài khoản
    - GF_USERS_DEFAULT_THEME=light
```

Dữ liệu Grafana (dashboards, datasources) được lưu tại `environment/data/grafana_data/`. Khi xóa container và tạo lại, data vẫn còn.

---
