# 7. ELK Stack Setup — Elasticsearch, Logstash, Kibana

## How the ELK Stack Works

```
Spring Boot App
     │
     │  JSON logs via TCP (port 5033 on host)
     ▼
┌─────────────┐      ┌───────────────────┐      ┌─────────┐
│  Logstash   │─────▶│  Elasticsearch    │◀─────│ Kibana  │
│  :5044      │      │  :9200 / :9300    │      │ :5601   │
│  :5000/tcp  │      └───────────────────┘      └─────────┘
│  :5000/udp  │
└─────────────┘
```

### Components

#### Elasticsearch (`environment/elk/elasticsearch.yml`)
- Stores and indexes all logs
- Runs in **single-node** mode (dev)
- **Security disabled** (`xpack.security.enabled: false`) — ES 8.x enables TLS/auth by default, which would break all HTTP connections in a dev setup
- Accessible at `http://localhost:9200`

#### Logstash (`environment/elk/logstash.yml` + `pipeline/logstash.conf`)
- Receives logs from the Spring Boot app via TCP on port 5000 (mapped to **host port 5033**)
- Also accepts Beats input on port 5044
- Decodes incoming JSON with `json_lines` codec (matches `logstash-logback-encoder` output)
- Writes to Elasticsearch index `sshop-logs-YYYY.MM.dd`

#### Kibana (`environment/elk/kibana.yml`)
- Web UI to search and visualize logs
- Accessible at `http://localhost:5601`
- Connects to Elasticsearch at `http://elasticsearch:9200` (internal Docker network)

---

## How Spring Boot Sends Logs to Logstash

The project uses `logstash-logback-encoder` (declared in `pom.xml`).

### `logback-spring.xml`

```
Spring Boot → LogstashTcpSocketAppender → localhost:5033 → Logstash container :5000
```

Key points in the config:

- **`LogstashTcpSocketAppender`** — opens a persistent TCP connection to Logstash
- **`LogstashEncoder`** — serializes each log event as a JSON object (timestamp, level, logger, message, stack trace, MDC fields, etc.)
- **Custom fields** `app` and `env` are injected into every log event for filtering in Kibana
- **`AsyncAppender`** wrapper — prevents logging from blocking application threads (`neverBlock: true`)
- **`dev` profile** — logs to both console (colorized) and Logstash
- **`prod` profile** — logs only to Logstash at WARN level

### Example log event sent to Logstash
```json
{
  "@timestamp": "2026-04-01T10:00:00.000Z",
  "@version": "1",
  "message": "Ticket booking completed",
  "logger_name": "com.xxxx.application.TicketService",
  "level": "INFO",
  "thread_name": "virtual-thread-1",
  "app": "zzz.com",
  "env": "dev"
}
```

---

## Port Reference

| Service       | Host Port | Container Port | Purpose                    |
|---------------|-----------|----------------|----------------------------|
| Elasticsearch | 9200      | 9200           | HTTP REST API              |
| Elasticsearch | 9300      | 9300           | Transport (node-to-node)   |
| Logstash      | 5044      | 5044           | Beats input                |
| Logstash      | 5033      | 5000/tcp       | TCP JSON input (Spring Boot)|
| Logstash      | 5022      | 5000/udp       | UDP JSON input             |
| Logstash      | 9600      | 9600           | Logstash monitoring API    |
| Kibana        | 5601      | 5601           | Web UI                     |

---

## Files Created / Modified

```
environment/
├── docker-compose-dev.yml          ← fixed (typo, Kibana network, flags)
└── elk/
    ├── elasticsearch.yml           ← new: single-node dev config, security disabled
    ├── logstash.yml                ← new: Logstash base config
    ├── kibana.yml                  ← new: Kibana points to Elasticsearch
    └── pipeline/
        └── logstash.conf           ← new: TCP/UDP/Beats inputs → Elasticsearch output

xxxx-start/src/main/resources/
└── logback-spring.xml              ← completed: console + async Logstash TCP appender
```

## Starting the Stack

```bash
cd environment
docker compose -f docker-compose-dev.yml up -d elasticsearch
# wait for ES to be healthy, then:
docker compose -f docker-compose-dev.yml up -d logstash kibana
```

Verify Elasticsearch is up:
```bash
curl http://localhost:9200
```

Open Kibana: http://localhost:5601  
Create a data view with index pattern `sshop-logs-*` to start querying logs.
