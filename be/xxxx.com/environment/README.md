# Folder `environment` — GUIDE

## Tổng quan

Thư mục `environment` chứa **tất cả những gì cần thiết để chạy hạ tầng của project** — database, cache, monitoring — mà không cần cài đặt bất cứ thứ gì trực tiếp lên máy bạn. Tất cả đều chạy qua Docker.

```
environment/
├── docker-compose-dev.yml       ← "bản thiết kế" — định nghĩa tất cả services
├── prometheus/
│   └── prometheus.yml           ← config Prometheus scrape ai, ở đâu
├── mysql/
│   └── init/
│       └── ticket_init.sql      ← script tạo bảng + dữ liệu mẫu ban đầu
└── data/                        ← ⚠️ TỰ SINH RA khi chạy docker-compose
    ├── db_data/                 ← dữ liệu MySQL
    ├── grafana_data/            ← dữ liệu Grafana (dashboards, settings)
    └── prometheus_data/         ← dữ liệu Prometheus (metrics đã thu thập)
```

---

## Source files

### `docker-compose-dev.yml`

**What:** File trung tâm. Định nghĩa tất cả các container sẽ chạy, chúng kết nối với nhau thế nào, port nào được mở, volume nào được mount.

```bash
docker-compose -f environment/docker-compose-dev.yml up -d
```
It create and start 5 containers:

| Container | Image | Port | Role                     |
|-----------|-------|------|--------------------------|
| `pre-event-mysql` | `mysql:8.0` | `3306` | Main Database            |
| `pre-event-redis` | `redis:latest` | `6379` | Cache & distributed lock |
| `pre-event-prometheus` | `prom/prometheus` | `9090` | Thu thập metrics         |
| `pre-event-grafana` | `grafana/grafana` | `3000` | Visualization |
| `pre-event-node-exporter` | `prom/node-exporter` | `9100` | Metrics hệ điều hành     |

---

### `prometheus/prometheus.yml`

**WHAT:** Configuration file of Prometheus — tell Prometheouse where to take data".


```yaml
scrape_configs:
  - job_name: "ticketsell-springboot"
    targets: [ "host.docker.internal:8080" ]   # Spring Boot app của bạn
    metrics_path: /actuator/prometheus

  - job_name: "ticketsell-node-exporter"
    targets: [ "host.docker.internal:9100" ]   # Node Exporter
    metrics_path: /metrics
```

File này được mount vào container Prometheus theo dòng trong docker-compose:
```yaml
volumes:
  - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
```
Tức là: file trên máy host (your computer) → được đưa vào bên trong container Prometheus tại đường dẫn `/etc/prometheus/prometheus.yml`.

---

### `mysql/init/ticket_init.sql`

Script SQL chạy tự động **một lần duy nhất** khi MySQL container khởi động lần đầu tiên (lúc `db_data` chưa tồn tại).

Tự động tạo schema và dữ liệu mẫu để team có thể chạy ngay mà không cần import SQL thủ công:

```sql
-- Tạo database ticket
CREATE DATABASE IF NOT EXISTS ticket ...;

-- Tạo bảng ticket (sự kiện mở bán)
CREATE TABLE IF NOT EXISTS `ticket`.`ticket` (...);

-- Tạo bảng ticket_item (chi tiết vé: VIP, phổ thông, v.v.)
CREATE TABLE IF NOT EXISTS `ticket`.`ticket_item` (...);

-- Insert mock data: 2 đợt mở bán, mỗi đợt có 2 loại vé
INSERT INTO `ticket`.`ticket` ...
INSERT INTO `ticket`.`ticket_item` ...
```

File này được trỏ vào trong docker-compose:
```yaml
volumes:
  - ./mysql/init:/docker-entrypoint-initdb.d
```
Docker MySQL có cơ chế: mọi file `.sql` trong thư mục `/docker-entrypoint-initdb.d/` đều được chạy tự động khi container khởi tạo lần đầu.

> **Quan trọng:** Script này chỉ chạy khi thư mục `data/db_data` chưa tồn tại. Nếu bạn muốn reset DB về trạng thái ban đầu, xóa `data/db_data/` rồi restart container.

---

## Thư mục `data/` — Tự sinh ra, KHÔNG commit vào git

Đây là phần quan trọng nhất cần hiểu. **Thư mục `data/` không phải bạn tạo ra** — Docker tạo ra nó khi bạn chạy `docker-compose up` lần đầu.

Mục đích: **Lưu trữ dữ liệu vĩnh viễn (persistent storage)**. Nếu không có `data/`, mọi dữ liệu sẽ mất khi container bị xóa hoặc restart.

---

### `data/db_data/` — Dữ liệu MySQL

**FROM:** MySQL container tự tạo ra khi khởi động lần đầu.

Lưu toàn bộ dữ liệu của database — giống như ổ cứng của MySQL server.

**Được mount từ:**
```yaml
# trong docker-compose-dev.yml
volumes:
  - ./data/db_data:/var/lib/mysql
```
`/var/lib/mysql` là nơi MySQL lưu data bên trong container → được ánh xạ ra `data/db_data/` trên máy bạn.

**Cấu trúc bên trong:**

```
data/db_data/
├── #innodb_redo/            ← InnoDB Redo Log — ghi lại mọi thay đổi chưa được
│   └── #ib_redo*_tmp           flush xuống disk (dùng để recovery khi crash)
│
├── #innodb_temp/            ← InnoDB Temporary Tablespace — lưu data tạm thời
│                               khi MySQL đang xử lý các query phức tạp (sort, join)
│
├── mysql/                   ← Database hệ thống của MySQL — lưu user accounts,
│                               permissions, stored procedures của MySQL engine
│
├── performance_schema/      ← Database giám sát nội bộ của MySQL — lưu thống kê
│                               về query performance, wait events, memory usage
│
├── sys/                     ← Database "sys" — cung cấp view dễ đọc hơn từ
│                               performance_schema (dành cho DBA)
│
└── ticket/                  ← Database chính của project — tên khớp với
    ├── ticket.ibd              MYSQL_DATABASE trong docker-compose và
    └── ticket_item.ibd         jdbc:mysql://localhost:3306/ticket trong application.yml
                                (.ibd = InnoDB data file, lưu rows thật sự)

---

### `data/prometheus_data/` — Dữ liệu Prometheus

**Từ đâu đến:** Prometheus container tự tạo ra khi bắt đầu lưu metrics.

**Dùng để làm gì:** Lưu toàn bộ time-series data mà Prometheus đã thu thập — đây là "database" của Prometheus (gọi là TSDB - Time Series Database).

**Được mount từ:**
```yaml
volumes:
  - ./data/prometheus_data:/prometheus
```

**Cấu trúc bên trong:**

```
data/prometheus_data/
│
├── wal/                     ← Write-Ahead Log (WAL) — ghi log TRƯỚC khi lưu
│   ├── 00000000                vào block. Giống "nháp" — Prometheus ghi vào đây
│   └── 00000001                trước, sau 2 giờ mới nén lại thành block chính thức.
│                               Dùng để recovery nếu Prometheus crash giữa chừng.
│
├── chunks_head/             ← Chunks đang trong bộ nhớ RAM, được flush xuống đây
│   ├── 000001                  để tránh mất data. Đây là data "nóng" — vừa thu thập
│   └── 000002                  trong vài giờ gần nhất.
│
├── 01KM2QP81.../            ← Block đã được nén — data cũ hơn 2 giờ được đóng gói
│   ├── chunks/                 lại thành block bất biến (immutable). Tên block là
│   │   └── 000001              ULID (ID theo thời gian).
│   ├── index                ← Index để query nhanh trong block này
│   ├── meta.json            ← Metadata: block bắt đầu/kết thúc lúc nào, bao nhiêu samples
│   └── tombstones           ← Đánh dấu data đã bị xóa (soft delete)
│
├── lock                     ← File khóa — đảm bảo chỉ có 1 Prometheus instance
│                               được ghi vào database này cùng lúc
│
└── queries.active           ← Theo dõi các query đang chạy (dùng để timeout
                                các query quá lâu)
```

**Vòng đời của một metric:**

```
Thu thập (scrape)
     │
     ▼
WAL (ghi ngay, tốc độ cao)
     │
     ▼ (sau ~2 giờ)
chunks_head (flush RAM xuống disk)
     │
     ▼ (sau ~2 giờ nữa)
Block nén (01KM2QP81.../...) ← đây là storage chính thức
     │
     ▼ (sau 15 ngày, mặc định)
Tự động xóa (retention period)
```

---

### `data/grafana_data/` — Dữ liệu Grafana

**Từ đâu đến:** Grafana container tự tạo ra khi khởi động.

**Dùng để làm gì:** Lưu tất cả những gì bạn cấu hình trong Grafana — dashboards, data sources, user accounts, settings. Nhờ có thư mục này, khi bạn xóa và tạo lại container Grafana, mọi dashboard bạn đã tạo vẫn còn.

**Được mount từ:**
```yaml
volumes:
  - ./data/grafana_data:/var/lib/grafana
```

**Cấu trúc bên trong:**

```
data/grafana_data/
│
├── plugins/                 ← Grafana plugins được tự động tải về khi container
│   ├── grafana-exploretraces-app       khởi động. Bạn không cài thủ công.
│   ├── grafana-lokiexplore-app
│   ├── grafana-metricsdrilldown-app
│   └── grafana-pyroscope-app
│
├── csv/                     ← Export data ra CSV (khi bạn click "Download CSV"
│                               trên panel)
│
├── pdf/                     ← Export dashboard ra PDF (nếu bật tính năng này)
│
├── png/                     ← Export panel thành ảnh PNG
│
└── unified-search/          ← Search index của Grafana (để tìm kiếm nhanh
    └── bleve/                  dashboards, panels)
```

> **Thực tế:** Grafana lưu dashboards và data sources trong SQLite database nằm tại `grafana_data/grafana.db` (bạn có thể sẽ thấy file này sau khi dùng Grafana một lúc). Đây là file quan trọng nhất trong `grafana_data/` vì mất nó là mất hết dashboard đã tạo.

---

## Tại sao `data/` không được commit lên git?

Kiểm tra file `.gitignore` ở root của project — thư mục `data/` nên được thêm vào đó vì:

1. **Quá lớn** — `db_data/` có thể lên đến hàng GB tùy lượng data.
2. **Là data runtime** — Không phải source code, không cần version control.
3. **Khác nhau mỗi máy** — Data trên máy bạn khác data trên máy đồng nghiệp.
4. **Có thể chứa thông tin nhạy cảm** — Mật khẩu, dữ liệu test.

Thay vào đó, `mysql/init/ticket_init.sql` mới là thứ cần commit — nó là "blueprint" để tái tạo data từ đầu trên bất kỳ máy nào.

---

## Tóm tắt: Cái gì commit, cái gì không

| Đường dẫn | Commit git? | Lý do |
|-----------|------------|-------|
| `docker-compose-dev.yml` | Có | Blueprint để chạy hạ tầng |
| `prometheus/prometheus.yml` | Có | Config scrape targets |
| `mysql/init/ticket_init.sql` | Có | Schema + mock data ban đầu |
| `data/db_data/` | **Không** | Data runtime MySQL |
| `data/prometheus_data/` | **Không** | Data runtime Prometheus |
| `data/grafana_data/` | **Không** | Data runtime Grafana |

---

## Các thao tác thường dùng

### Reset toàn bộ về trạng thái ban đầu

```bash
# Dừng và xóa containers
docker-compose -f environment/docker-compose-dev.yml down

# Xóa data (cẩn thận — mất hết data!)
rm -rf environment/data/

# Chạy lại — sẽ tạo lại data/ và chạy ticket_init.sql
docker-compose -f environment/docker-compose-dev.yml up -d
```

### Chỉ reset MySQL (giữ nguyên Prometheus + Grafana)

```bash
docker stop pre-event-mysql
rm -rf environment/data/db_data/
docker start pre-event-mysql
# MySQL sẽ chạy lại ticket_init.sql vì db_data/ không còn
```

### Xem dung lượng data đang chiếm

```bash
du -sh environment/data/*/
```
