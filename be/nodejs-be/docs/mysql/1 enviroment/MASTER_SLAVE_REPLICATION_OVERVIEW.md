# Master-Slave Replication: Complete Overview

## Table of Contents

1. [What is Master-Slave Replication?](#what-is-master-slave-replication)
2. [Why Use Master-Slave Replication?](#why-use-master-slave-replication)
3. [Common Use Cases](#common-use-cases)
4. [Architecture Patterns](#architecture-patterns)
5. [MySQL Replication](#mysql-replication)
6. [MongoDB Replication](#mongodb-replication)
7. [Redis Replication](#redis-replication)
8. [Comparison Table](#comparison-table)
9. [When to Use Each Database](#when-to-use-each-database)
10. [Production Considerations](#production-considerations)

---

## What is Master-Slave Replication?

**Master-Slave Replication** (also called Primary-Replica or Source-Replica) is a database architecture pattern where:

- **Master (Primary/Source)**: The main database that handles all write operations (INSERT, UPDATE, DELETE)
- **Slave (Replica/Secondary)**: One or more copies of the master database that replicate data and typically handle read operations

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                     │
└─────────────────┬───────────────────────────┬───────────┘
                  │                           │
         WRITES   │                           │   READS
         (INSERT, UPDATE, DELETE)             │   (SELECT)
                  │                           │
                  ▼                           ▼
         ┌────────────────┐          ┌────────────────┐
         │     MASTER     │          │     SLAVE 1    │
         │   (Write DB)   │─────────>│   (Read DB)    │
         │                │          │                │
         └────────────────┘          └────────────────┘
                  │
                  │ Replication
                  │
                  ▼
         ┌────────────────┐
         │     SLAVE 2    │
         │   (Read DB)    │
         │                │
         └────────────────┘
```

### Key Principle: Write Once, Read Many (WORM)

- **All writes** go to the master
- **All reads** can be distributed across slaves
- Master automatically **pushes or slaves pull** changes to keep data synchronized

---

## Why Use Master-Slave Replication?

### 1. **High Availability (HA)**

**Problem**: If your single database crashes, your entire application goes down.

**Solution**: With master-slave:
- If master fails, promote a slave to become the new master
- If a slave fails, other slaves continue serving read requests
- Minimizes downtime and data loss

**Example**:
```
Normal Operation:
Master (UP) → Slave 1 (UP), Slave 2 (UP)
All systems operational ✓

Master Crashes:
Master (DOWN) → Slave 1 (PROMOTED to Master), Slave 2 (UP)
Application continues with minimal interruption ✓
```

### 2. **Read Scalability (Load Distribution)**

**Problem**: Single database cannot handle millions of read requests.

**Solution**: Distribute read traffic across multiple slaves.

**Real-world example**:
```
E-commerce Application:
- 10,000 writes/second  → Master handles this
- 500,000 reads/second  → Distributed across 10 slaves
  - Each slave: 50,000 reads/second
```

**Benefits**:
- Master focuses on writes (not overwhelmed by reads)
- Slaves handle read-heavy workloads
- Can add more slaves as traffic grows

### 3. **Geographic Distribution (Reduce Latency)**

**Problem**: Users in different regions experience high latency.

**Solution**: Place slaves in different geographic regions.

**Example**:
```
Global E-commerce Platform:

Master (US East - Virginia)
├─> Slave 1 (US West - California)     - Serves US West Coast users
├─> Slave 2 (Europe - Frankfurt)       - Serves European users
├─> Slave 3 (Asia Pacific - Singapore) - Serves Asian users
└─> Slave 4 (South America - São Paulo) - Serves SA users

Users read from nearest slave = Lower latency!
```

### 4. **Backup and Analytics Without Impact**

**Problem**: Running backups or analytics queries slows down production database.

**Solution**: Use dedicated slaves for backups and analytics.

**Example**:
```
Production Setup:
Master → Handles production writes
Slave 1 → Serves production reads
Slave 2 → Dedicated for nightly backups (no production impact)
Slave 3 → Runs heavy analytics queries (no production impact)
```

### 5. **Disaster Recovery**

**Problem**: Data center failure or corruption.

**Solution**: Keep slaves in different data centers/regions.

**Example**:
```
Primary Data Center (US):
Master + Slave 1

Disaster Recovery Data Center (Europe):
Slave 2 (with delayed replication - prevents corruption replication)

If primary DC burns down → Promote Slave 2 to master
```

---

## Common Use Cases

### Use Case 1: Social Media Platform

**Scenario**: Instagram-like application

```
Master (Write Operations):
- Post new photo
- Like a post
- Add comment
- Follow user

Slaves (Read Operations):
- Load user feed (millions of reads/second)
- Search users
- View profiles
- Load comments
```

**Why it works**:
- Writes are relatively rare (user posts 1-10 times/day)
- Reads are extremely frequent (users scroll hundreds of times/day)
- **Read-to-Write ratio**: 1000:1

### Use Case 2: E-Commerce Website

**Scenario**: Amazon-like marketplace

```
Master (Write Operations):
- Place order
- Update inventory
- Add to cart
- Update user profile

Slaves (Read Operations):
- Browse products (heavy traffic)
- Search products
- View product details
- Read reviews
- Check inventory availability
```

**Peak traffic handling**:
```
Black Friday Sale:
- 1 Master: 50,000 writes/second (orders, cart updates)
- 20 Slaves: 5,000,000 reads/second (browsing, searching)
  - Each slave: 250,000 reads/second
```

### Use Case 3: News/Blog Website

**Scenario**: News portal

```
Master (Write Operations):
- Publish new article (infrequent)
- Moderate comments

Slaves (Read Operations):
- Read articles (very frequent)
- Search articles
- View comments
- Load homepage
```

**Why it works**:
- Writes are rare (10-100 articles/day)
- Reads are massive (millions of page views/day)
- **Read-to-Write ratio**: 10,000:1 or higher

### Use Case 4: Financial System

**Scenario**: Banking application

```
Master (Write Operations):
- Record transactions
- Update account balances
- Transfer money

Slaves (Read Operations):
- Check account balance
- View transaction history
- Generate statements
- Run fraud detection analytics (dedicated slave)
```

**Why it works**:
- Write accuracy is critical (master ensures consistency)
- Users frequently check balances (distribute across slaves)
- Analytics runs on dedicated slave (no production impact)

---

## Architecture Patterns

### Pattern 1: Single Master, Single Slave

**When to use**: Small applications, disaster recovery

```
┌──────────┐     Replication    ┌──────────┐
│  MASTER  │ ─────────────────> │  SLAVE   │
└──────────┘                    └──────────┘
    ↑                                ↑
    │ Writes                         │ Reads
    │                                │
┌────────────────────────────────────────┐
│          APPLICATION                   │
└────────────────────────────────────────┘
```

**Pros**:
- Simple setup
- Good for DR (Disaster Recovery)

**Cons**:
- Limited scalability
- If slave fails, no redundancy

### Pattern 2: Single Master, Multiple Slaves

**When to use**: Read-heavy applications, high availability

```
                     ┌──────────┐
            ┌───────>│ SLAVE 1  │────┐
            │        └──────────┘    │
┌──────────┐│        ┌──────────┐    │
│  MASTER  ││───────>│ SLAVE 2  │────┤ Reads
└──────────┘│        └──────────┘    │
    ↑       │        ┌──────────┐    │
  Writes    └───────>│ SLAVE 3  │────┘
    │                └──────────┘
┌────────────────────────────────────────┐
│          APPLICATION (Load Balancer)   │
└────────────────────────────────────────┘
```

**Pros**:
- High read scalability
- High availability (multiple slave redundancy)
- Can lose slaves without impact

**Cons**:
- Master is single point of failure for writes

### Pattern 3: Master-Slave with Geographic Distribution

**When to use**: Global applications, low latency requirements

```
        ┌──────────────────────────────────────────┐
        │            MASTER (US East)              │
        └───────────┬──────────────┬───────────────┘
                    │              │
        ┌───────────┘              └────────────┐
        ▼                                       ▼
┌──────────────┐                       ┌──────────────┐
│  SLAVE 1     │                       │  SLAVE 2     │
│  (US West)   │                       │  (Europe)    │
└──────────────┘                       └──────────────┘
        ▲                                       ▲
        │                                       │
   US Users                                EU Users
```

**Pros**:
- Low latency for global users
- Regional data compliance possible

**Cons**:
- Replication lag across regions
- Complex failover scenarios

### Pattern 4: Master-Slave with Dedicated Analytics Slave

**When to use**: Heavy analytics without impacting production

```
┌──────────┐        ┌─────────────┐
│  MASTER  │───────>│ SLAVE 1     │ ← Production Reads
└──────────┘   │    └─────────────┘
    ↑          │
  Writes       │    ┌─────────────┐
    │          └───>│ SLAVE 2     │ ← Analytics/Reporting
    │               └─────────────┘    (Heavy Queries)
┌────────────┐
│    APP     │
└────────────┘
```

**Pros**:
- Analytics don't slow production
- Can configure slave differently (more memory, indexes)

**Cons**:
- Additional infrastructure cost

---

## MySQL Replication

### How MySQL Replication Works

```
MASTER                                    SLAVE
──────                                    ─────
1. Execute SQL:
   INSERT INTO users...

2. Write to Binary Log:
   mysql-bin.000003
   Position: 5432
                                         3. IO Thread:
                                            - Connects to master
                                            - Reads binary log
                                            - Writes to relay log

                                         4. SQL Thread:
                                            - Reads relay log
                                            - Executes SQL
                                            - Data replicated!
```

### MySQL Replication Types

#### 1. **Asynchronous Replication** (Default)

```
Master → Commits immediately (doesn't wait for slave)
      ↓
   Returns success to application
      ↓
   Slaves replicate asynchronously (slight delay)
```

**Pros**:
- Fast writes (no waiting)
- Master not affected by slave issues

**Cons**:
- Replication lag possible
- Data loss possible if master crashes before replication

**Use when**: Performance > Absolute consistency

#### 2. **Semi-Synchronous Replication**

```
Master → Commits transaction
      ↓
   Waits for at least 1 slave to acknowledge
      ↓
   Returns success to application
```

**Pros**:
- Better data safety
- At least one slave has the data

**Cons**:
- Slower writes (wait for slave ACK)
- Can timeout if slaves are slow

**Use when**: Data safety important, can tolerate slight write latency

#### 3. **Group Replication** (MySQL 8.0+)

```
Multi-master setup with automatic failover
All nodes can accept writes
Conflict detection and resolution
```

**Pros**:
- No single point of failure
- Automatic failover
- Strong consistency

**Cons**:
- More complex setup
- Higher overhead

**Use when**: Need multi-master with automatic failover

### MySQL Replication Setup

See [MASTER_SLAVE_SETUP.md](./MASTER_SLAVE_SETUP.md) for detailed Docker setup.

**Quick overview**:
```bash
# Master configuration
[mysqld]
server-id=1
log_bin=mysql-bin

# Slave configuration
[mysqld]
server-id=2
log_bin=mysql-bin

# Configure slave to replicate from master
CHANGE MASTER TO
  MASTER_HOST='master-ip',
  MASTER_USER='repl',
  MASTER_PASSWORD='password',
  MASTER_LOG_FILE='mysql-bin.000003',
  MASTER_LOG_POS=157;
START SLAVE;
```

---

## MongoDB Replication

### How MongoDB Replication Works

MongoDB uses **Replica Sets** (not traditional master-slave). A replica set is a group of MongoDB instances that maintain the same dataset.

```
┌─────────────────────────────────────────────────────┐
│               REPLICA SET (3 nodes)                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌─────────────┐      ┌─────────────┐            │
│   │   PRIMARY   │      │  SECONDARY  │            │
│   │  (Master)   │─────>│  (Slave 1)  │            │
│   └─────────────┘  │   └─────────────┘            │
│         ↑          │                               │
│         │ Writes   │   ┌─────────────┐            │
│         │          └──>│  SECONDARY  │            │
│         │              │  (Slave 2)  │            │
│   ┌───────────┐        └─────────────┘            │
│   │    APP    │                                    │
│   └───────────┘                                    │
└─────────────────────────────────────────────────────┘
```

### Key Differences from MySQL

| Feature | MySQL | MongoDB |
|---------|-------|---------|
| **Terminology** | Master-Slave | Primary-Secondary (Replica Set) |
| **Automatic Failover** | No (manual promotion) | Yes (automatic election) |
| **Replication Method** | Binary logs | Oplog (operations log) |
| **Write to Slave** | Possible (if not read-only) | Not allowed on Secondary |
| **Consistency** | Eventually consistent | Can configure read preference |

### MongoDB Replica Set Features

#### 1. **Automatic Failover**

```
Normal Operation:
PRIMARY (Node 1) → SECONDARY (Node 2), SECONDARY (Node 3)

Primary Crashes:
PRIMARY (Node 1 - DOWN)
     ↓
Election happens automatically (seconds)
     ↓
SECONDARY (Node 2) → Elected as new PRIMARY
SECONDARY (Node 3) → Still secondary
```

**No manual intervention needed!**

#### 2. **Read Preferences**

MongoDB allows configuring where reads come from:

```javascript
// Primary only (default) - Strong consistency
db.collection.find().readPref('primary')

// Primary preferred - Falls back to secondary if primary down
db.collection.find().readPref('primaryPreferred')

// Secondary only - Offload reads from primary
db.collection.find().readPref('secondary')

// Secondary preferred
db.collection.find().readPref('secondaryPreferred')

// Nearest - Lowest network latency
db.collection.find().readPref('nearest')
```

**Use cases**:
- `primary`: Financial transactions (need latest data)
- `secondary`: Analytics, reports (can tolerate slight lag)
- `nearest`: Global apps (reduce latency)

#### 3. **Oplog (Operations Log)**

MongoDB's equivalent to MySQL's binary log:

```
PRIMARY executes:
db.users.insert({name: "Alice", email: "alice@example.com"})
     ↓
Writes to oplog:
{
  "ts": Timestamp(1234567890, 1),
  "op": "i",  // insert operation
  "ns": "mydb.users",
  "o": {name: "Alice", email: "alice@example.com"}
}
     ↓
SECONDARIES read oplog and apply operations
```

### MongoDB Replication Setup

**Minimum 3 nodes required** (for automatic failover):

```javascript
// Initialize replica set
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongodb-primary:27017" },
    { _id: 1, host: "mongodb-secondary1:27017" },
    { _id: 2, host: "mongodb-secondary2:27017" }
  ]
})

// Check status
rs.status()

// Check replication lag
rs.printSlaveReplicationInfo()
```

**Docker Compose example**:

```yaml
version: '3.8'
services:
  mongodb-primary:
    image: mongo:7.0
    command: mongod --replSet myReplicaSet --bind_ip_all
    ports:
      - "27017:27017"

  mongodb-secondary1:
    image: mongo:7.0
    command: mongod --replSet myReplicaSet --bind_ip_all
    ports:
      - "27018:27017"

  mongodb-secondary2:
    image: mongo:7.0
    command: mongod --replSet myReplicaSet --bind_ip_all
    ports:
      - "27019:27017"
```

### MongoDB Replication Advantages

**1. Automatic Failover**
```
Primary fails → Election in ~12 seconds → New primary elected
Application automatically connects to new primary
```

**2. Write Concerns** (Control consistency)
```javascript
// Wait for majority of replicas to acknowledge
db.users.insert(
  {name: "Alice"},
  {writeConcern: {w: "majority"}}
)

// Wait for all replicas
db.users.insert(
  {name: "Bob"},
  {writeConcern: {w: 3}}  // 3 = all 3 nodes
)
```

**3. Tag-based Replication** (Geographic distribution)
```javascript
// Configure geographic tags
rs.reconfig({
  members: [
    { _id: 0, host: "mongo-us:27017", tags: {region: "us"} },
    { _id: 1, host: "mongo-eu:27017", tags: {region: "eu"} },
    { _id: 2, host: "mongo-asia:27017", tags: {region: "asia"} }
  ]
})

// Ensure write reaches specific region
db.users.insert(
  {name: "Alice"},
  {writeConcern: {w: 1, wtag: "us"}}
)
```

---

## Redis Replication

### How Redis Replication Works

Redis uses **Master-Replica** architecture (simpler than MongoDB's replica sets).

```
┌──────────────┐
│    MASTER    │
│  (Write DB)  │
└──────┬───────┘
       │ Asynchronous replication
       │ (Streams RDB + AOF commands)
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  REPLICA 1   │  │  REPLICA 2   │  │  REPLICA 3   │
│  (Read DB)   │  │  (Read DB)   │  │  (Read DB)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Key Features

#### 1. **Asynchronous Replication** (Default)

```
Master executes: SET user:1 "Alice"
     ↓
Returns immediately to client (fast!)
     ↓
Asynchronously sends command to replicas
     ↓
Replicas apply command when they receive it
```

**Trade-off**: Speed vs. Durability (data loss possible if master crashes)

#### 2. **Diskless Replication**

Redis can replicate directly from memory (no disk involved):

```
Master creates snapshot in memory
     ↓
Streams snapshot over network to replica
     ↓
Replica loads snapshot directly into memory
     ↓
No disk I/O required! (Faster replication)
```

**Use when**: Fast SSDs not available, network is fast

#### 3. **Partial Replication**

If replica disconnects temporarily, it doesn't need full sync:

```
Replica disconnects for 10 seconds
     ↓
Reconnects
     ↓
Master sends only commands that happened during disconnect
     ↓
Replica catches up quickly (seconds, not minutes)
```

### Redis Sentinel (High Availability)

**Problem**: Redis replication doesn't have automatic failover.

**Solution**: Redis Sentinel - Monitoring and automatic failover system.

```
┌─────────────────────────────────────────────────────┐
│              REDIS SENTINEL CLUSTER                 │
│  (Monitors health, performs automatic failover)     │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Sentinel 1  │  │ Sentinel 2  │  │ Sentinel 3  │
└─────────────┘  └─────────────┘  └─────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │ Monitors
                        ▼
            ┌───────────────────────┐
            │   MASTER              │
            └───────┬───────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │REPLICA1│  │REPLICA2│  │REPLICA3│
    └────────┘  └────────┘  └────────┘
```

**Sentinel features**:
- **Monitoring**: Checks if master and replicas are working
- **Notification**: Alerts when something is wrong
- **Automatic Failover**: Promotes replica to master if master fails
- **Configuration Provider**: Tells clients where current master is

**Failover process**:
```
1. Master crashes
2. Sentinels detect failure (majority agreement)
3. Sentinels elect a replica to promote
4. Chosen replica becomes new master
5. Other replicas start replicating from new master
6. Sentinels notify clients of new master address

Total time: ~30 seconds
```

### Redis Cluster (Sharding + Replication)

For very large datasets that don't fit in single instance:

```
┌─────────────────────────────────────────────────────┐
│                  REDIS CLUSTER                      │
│          (Automatic sharding + replication)         │
└─────────────────────────────────────────────────────┘

Shard 1:              Shard 2:              Shard 3:
┌──────────┐          ┌──────────┐          ┌──────────┐
│ MASTER 1 │          │ MASTER 2 │          │ MASTER 3 │
│ Slots:   │          │ Slots:   │          │ Slots:   │
│ 0-5460   │          │ 5461-    │          │ 10923-   │
│          │          │ 10922    │          │ 16383    │
└────┬─────┘          └────┬─────┘          └────┬─────┘
     │                     │                     │
     ▼                     ▼                     ▼
┌──────────┐          ┌──────────┐          ┌──────────┐
│ REPLICA 1│          │ REPLICA 2│          │ REPLICA 3│
└──────────┘          └──────────┘          └──────────┘
```

**How it works**:
- Data split across 16,384 hash slots
- Each master handles subset of slots
- Keys hashed to determine which slot (and thus which master)
- Each master has replicas for HA

**Example**:
```
SET user:1000 "Alice"
     ↓
Hash("user:1000") → Slot 8456
     ↓
Slot 8456 belongs to Master 2
     ↓
Write to Master 2
     ↓
Replicated to Replica 2
```

### Redis Replication Setup

**Simple Master-Replica**:

```bash
# Master (redis.conf)
bind 0.0.0.0
port 6379

# Replica (redis.conf)
bind 0.0.0.0
port 6380
replicaof 127.0.0.1 6379  # Point to master
```

**Docker Compose**:

```yaml
version: '3.8'
services:
  redis-master:
    image: redis:7.2
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  redis-replica1:
    image: redis:7.2
    ports:
      - "6380:6379"
    command: redis-server --replicaof redis-master 6379
    depends_on:
      - redis-master

  redis-replica2:
    image: redis:7.2
    ports:
      - "6381:6379"
    command: redis-server --replicaof redis-master 6379
    depends_on:
      - redis-master
```

**Verify replication**:

```bash
# On master
redis-cli INFO replication

# Output:
role:master
connected_slaves:2
slave0:ip=172.18.0.3,port=6379,state=online
slave1:ip=172.18.0.4,port=6379,state=online

# On replica
redis-cli -p 6380 INFO replication

# Output:
role:slave
master_host:redis-master
master_port:6379
master_link_status:up
```

**Redis Sentinel Setup**:

```bash
# sentinel.conf
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1

# Start sentinel
redis-sentinel sentinel.conf
```

---

## Comparison Table

### Feature Comparison

| Feature | MySQL | MongoDB | Redis |
|---------|-------|---------|-------|
| **Terminology** | Master-Slave | Primary-Secondary (Replica Set) | Master-Replica |
| **Replication Type** | Asynchronous (default), Semi-sync available | Asynchronous | Asynchronous only |
| **Automatic Failover** | ❌ No (manual) | ✅ Yes (built-in) | ⚠️ Yes (with Sentinel) |
| **Replication Method** | Binary logs | Oplog | RDB snapshot + Command stream |
| **Min Nodes for HA** | 2 (1 master + 1 slave) | 3 (1 primary + 2 secondaries) | 3 (1 master + 2 replicas) |
| **Write to Replica** | Possible (dangerous) | ❌ Not allowed | ❌ Not allowed (read-only) |
| **Read from Replica** | ✅ Yes | ✅ Yes (configurable) | ✅ Yes |
| **Data Loss Risk** | Low (semi-sync), Medium (async) | Very Low (write concern) | Medium-High (async only) |
| **Replication Lag Monitoring** | `SHOW SLAVE STATUS` | `rs.printSlaveReplicationInfo()` | `INFO replication` |
| **Complexity** | Medium | Medium-High | Low-Medium |

### Performance Characteristics

| Database | Write Latency | Replication Speed | Typical Lag |
|----------|---------------|-------------------|-------------|
| **MySQL** | Low (async), Medium (semi-sync) | Fast (same datacenter) | Milliseconds |
| **MongoDB** | Low-Medium (depends on write concern) | Fast | Milliseconds |
| **Redis** | Very Low (in-memory) | Very Fast (in-memory) | Microseconds |

### Use Case Fit

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| **Relational data with ACID** | MySQL | Strong ACID guarantees, SQL |
| **Document storage with HA** | MongoDB | Automatic failover, flexible schema |
| **Caching, session store** | Redis | In-memory, extremely fast |
| **Financial transactions** | MySQL | ACID compliance, semi-sync replication |
| **Real-time analytics** | MongoDB | Flexible queries, aggregation pipeline |
| **Pub/Sub messaging** | Redis | Built-in pub/sub, low latency |
| **Content Management System** | MySQL or MongoDB | MySQL for rigid schema, MongoDB for flexibility |
| **Gaming leaderboards** | Redis | Sorted sets, atomic operations |

---

## When to Use Each Database

### Choose MySQL When:

✅ **You need ACID transactions**
```sql
START TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE user_id = 2;
COMMIT;  -- Both happen or neither happens
```

✅ **You have relational data with foreign keys**
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

✅ **You need complex JOINs**
```sql
SELECT u.name, o.total, p.name
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN products p ON o.product_id = p.id
WHERE u.country = 'US';
```

✅ **Your schema is stable and well-defined**

**Examples**:
- Banking systems
- E-commerce platforms
- ERP systems
- Traditional web applications

### Choose MongoDB When:

✅ **You need flexible schema (schema can evolve)**
```javascript
// Document 1 (old)
{name: "Alice", email: "alice@example.com"}

// Document 2 (new - added fields without migration)
{name: "Bob", email: "bob@example.com", phone: "555-1234", address: {...}}
```

✅ **You have hierarchical/nested data**
```javascript
{
  user: "Alice",
  posts: [
    {title: "Post 1", comments: [{author: "Bob", text: "Nice!"}]},
    {title: "Post 2", comments: []}
  ]
}
```

✅ **You need automatic failover (high availability)**

✅ **You want horizontal scaling (sharding)**

**Examples**:
- Content management systems
- Social media platforms
- Real-time analytics
- Mobile app backends
- IoT data storage

### Choose Redis When:

✅ **You need extreme speed (microsecond latency)**
```bash
SET session:12345 "user_data"  # < 1ms
GET session:12345               # < 1ms
```

✅ **You're building a cache layer**
```javascript
// Check cache first
const cached = await redis.get(`product:${id}`);
if (cached) return cached;

// Cache miss - get from DB and cache
const product = await db.products.findById(id);
await redis.setex(`product:${id}`, 3600, JSON.stringify(product));
```

✅ **You need pub/sub messaging**
```javascript
// Publisher
redis.publish('notifications', 'New order received');

// Subscriber
redis.subscribe('notifications', (message) => {
  console.log(message);  // Instant delivery!
});
```

✅ **You need data structures** (lists, sets, sorted sets, hashes)
```bash
# Leaderboard (sorted set)
ZADD leaderboard 1000 "player1"
ZADD leaderboard 1500 "player2"
ZREVRANGE leaderboard 0 9  # Top 10 players
```

**Examples**:
- Session storage
- Caching layer
- Real-time leaderboards
- Rate limiting
- Job queues
- Pub/sub systems

---

## Production Considerations

### 1. Monitoring

**What to monitor**:

| Metric | MySQL | MongoDB | Redis |
|--------|-------|---------|-------|
| **Replication Lag** | `Seconds_Behind_Master` | `replicationLag` | `master_repl_offset` - `slave_repl_offset` |
| **Connection Status** | `Slave_IO_Running`, `Slave_SQL_Running` | `health` in `rs.status()` | `master_link_status` |
| **Disk Space** | Binary log size | Oplog size | RDB + AOF size |
| **Memory Usage** | InnoDB buffer pool | WiredTiger cache | Used memory |

**Example monitoring setup** (Prometheus + Grafana):

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"

  # Database exporters
  mysqld-exporter:
    image: prom/mysqld-exporter

  mongodb-exporter:
    image: percona/mongodb_exporter

  redis-exporter:
    image: oliver006/redis_exporter
```

### 2. Backup Strategy

**Multi-layered approach**:

```
Production Setup:
Master → Slave 1 (Production reads)
      → Slave 2 (Backups - delayed replication)
      → Slave 3 (DR - different datacenter)

Backup Schedule:
- Slave 2: Daily full backup (no production impact)
- Slave 2: Hourly incremental backups
- Slave 3: Point-in-time recovery capability
```

**Delayed replication** (protect against accidental DELETE):

```sql
-- MySQL: Configure 1 hour delay
CHANGE MASTER TO MASTER_DELAY = 3600;

-- If someone accidentally deletes data at 2 PM:
-- At 2:30 PM you notice
-- Slave 2 (delayed) still has data from 1:30 PM
-- Recover from Slave 2 before 3 PM!
```

### 3. Security

**Best practices**:

```
✅ Use dedicated replication user (not root)
✅ Enable SSL/TLS for replication traffic
✅ Firewall rules between master and slaves
✅ Encrypt data at rest
✅ Rotate credentials regularly
✅ Set slaves to read-only
```

**MySQL example**:

```sql
-- Create replication user with minimal privileges
CREATE USER 'repl'@'%' IDENTIFIED BY 'strong_password' REQUIRE SSL;
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';

-- Configure slave as read-only
SET GLOBAL read_only = ON;
SET GLOBAL super_read_only = ON;
```

### 4. Capacity Planning

**Rule of thumb**:

| Database | RAM | CPU | Disk IOPS |
|----------|-----|-----|-----------|
| **MySQL** | 16-64 GB (depends on working set) | 4-16 cores | High (SSD required for master) |
| **MongoDB** | 32-128 GB (more = better) | 8-32 cores | High (SSD required) |
| **Redis** | Enough for entire dataset + overhead | 4-8 cores | Low (mostly in-memory) |

**Scaling indicators**:

```
Add more slaves when:
✅ CPU on slaves > 70% consistently
✅ Replication lag increasing
✅ Read latency increasing

Upgrade master when:
✅ Write latency increasing
✅ Disk I/O saturated
✅ CPU > 80% consistently
```

### 5. Disaster Recovery Plan

**Recovery Time Objective (RTO)** and **Recovery Point Objective (RPO)**:

| Scenario | RTO (Downtime) | RPO (Data Loss) | Solution |
|----------|----------------|-----------------|----------|
| **Slave fails** | 0 (no impact) | 0 | Use other slaves |
| **Master fails** | 5-30 minutes | 0-5 minutes | Promote slave to master |
| **Data center fails** | 1-6 hours | 5-30 minutes | Failover to DR site |
| **Region fails** | 6-24 hours | 30-60 minutes | Restore from backups |

**Failover procedure**:

```bash
# 1. Verify master is really down
ping master-db
telnet master-db 3306

# 2. Choose best slave to promote (least lag)
# MySQL:
docker exec slave1 mysql -e "SHOW SLAVE STATUS\G" | grep Seconds_Behind_Master
docker exec slave2 mysql -e "SHOW SLAVE STATUS\G" | grep Seconds_Behind_Master

# 3. Promote slave with least lag
docker exec slave1 mysql -e "STOP SLAVE; RESET SLAVE ALL;"

# 4. Reconfigure other slaves to new master
docker exec slave2 mysql -e "
STOP SLAVE;
CHANGE MASTER TO MASTER_HOST='slave1-ip';
START SLAVE;
"

# 5. Update application config to point to new master

# 6. Monitor new master carefully
```

---

## Summary

### Key Takeaways

1. **Master-Slave replication solves**:
   - High availability (failover capability)
   - Read scalability (distribute load)
   - Disaster recovery (data redundancy)
   - Geographic distribution (low latency)

2. **Choose the right database**:
   - **MySQL**: Relational data, ACID transactions, stable schema
   - **MongoDB**: Flexible schema, automatic failover, horizontal scaling
   - **Redis**: Extreme speed, caching, pub/sub, data structures

3. **Common pattern**: Use multiple databases together
   ```
   MySQL (persistent data, transactions)
      ↓
   MongoDB (flexible documents, analytics)
      ↓
   Redis (cache, sessions, real-time features)
   ```

4. **Production requirements**:
   - Always use at least 2 slaves (redundancy)
   - Monitor replication lag constantly
   - Test failover procedures regularly
   - Have backup strategy (don't rely only on replication)
   - Configure slaves as read-only
   - Use SSL/TLS for replication traffic

---

## Additional Resources

### MySQL
- [Official MySQL Replication Documentation](https://dev.mysql.com/doc/refman/8.0/en/replication.html)
- [Setup Guide](./MASTER_SLAVE_SETUP.md)

### MongoDB
- [MongoDB Replica Sets Documentation](https://www.mongodb.com/docs/manual/replication/)
- [MongoDB Atlas (Managed Service)](https://www.mongodb.com/cloud/atlas)

### Redis
- [Redis Replication Documentation](https://redis.io/docs/management/replication/)
- [Redis Sentinel Documentation](https://redis.io/docs/management/sentinel/)
- [Redis Cluster Tutorial](https://redis.io/docs/management/scaling/)

### Books
- "High Performance MySQL" by Baron Schwartz
- "MongoDB: The Definitive Guide" by Shannon Bradshaw
- "Redis in Action" by Josiah Carlson
