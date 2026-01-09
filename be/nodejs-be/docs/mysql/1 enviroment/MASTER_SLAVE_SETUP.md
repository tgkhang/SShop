# MySQL Master-Slave Replication Setup Guide

## Overview

setup master slave mysql usiing docker . you tube tipjs

---

## Problem You Encountered

### The Error

```
Fatal error: The replica I/O thread stops because source and replica have equal MySQL server ids;
these ids must be different for replication to work
```

### Root Cause

Both master and slave had `server_id = 1`. In MySQL replication:

- Each server MUST have a unique `server_id`
- The slave uses this ID to identify which master it's replicating from
- Having duplicate IDs causes the replication to fail

### Why Your Original Approach Didn't Work

In your initial attempt, you:

1. Created containers without config files mounted
2. Copied config files into running containers: `docker cp ./master/my.cnf [container]:/etc`
3. Restarted containers

**The issue**: When you copy config files to `/etc/my.cnf` and restart, MySQL doesn't always pick up the config because:

- MySQL looks for config in multiple locations with a specific precedence order
- The config might not be in the right directory MySQL checks
- Container restart doesn't guarantee config reload if volumes aren't properly mounted

---

## Complete Setup Steps

You can choose between two approaches:

- **Way 1**: Mount config files during container creation (recommended for production)
- **Way 2**: Copy config files after container creation (simpler, avoids path/permission issues)

---

## Way 1: Mount Config Files During Container Creation

### Step 1: Create Docker Network

```bash
docker network create my_master_slave_mysql
```

**What it does**: Creates an isolated network for master and slave to communicate using container names instead of IPs.

**Why needed**: Allows containers to discover each other by hostname (`mysql-master`, `mysql-slave`).

---

### Step 2: Prepare Configuration Files

Create the directory structure:

```bash
mkdir -p mysql/master mysql/slave
```

#### Master Configuration (`mysql/master/my.cnf`)

```ini
[mysqld]
# Binary logging - required for replication
log_bin=mysql-bin

# Unique server ID for master
server-id=1

# Standard MySQL settings
skip-host-cache
skip-name-resolve
datadir=/var/lib/mysql
socket=/var/run/mysqld/mysqld.sock
secure-file-priv=/var/lib/mysql-files
user=mysql
pid-file=/var/run/mysqld/mysqld.pid

[client]
socket=/var/run/mysqld/mysqld.sock

!includedir /etc/mysql/conf.d/
```

**Key settings explained**:

- `log_bin=mysql-bin`: Enables binary logging (records all database changes)
- `server-id=1`: Unique identifier for master
- Binary logs are essential - slave reads these to replicate changes

#### Slave Configuration (`mysql/slave/my.cnf`)

```ini
[mysqld]
# Binary logging (optional on slave, but recommended)
log_bin=mysql-bin

# Unique server ID for slave - MUST be different from master
server-id=2

# Standard MySQL settings
skip-host-cache
skip-name-resolve
datadir=/var/lib/mysql
socket=/var/run/mysqld/mysqld.sock
secure-file-priv=/var/lib/mysql-files
user=mysql
pid-file=/var/run/mysqld/mysqld.pid

[client]
socket=/var/run/mysqld/mysqld.sock

!includedir /etc/mysql/conf.d/
```

**Key difference**: `server-id=2` - This MUST be different from master!

---

### Step 3: Start Master Container

```bash
docker run -d \
  --name mysql-master \
  --network my_master_slave_mysql \
  -p 8811:3306 \
  -e MYSQL_ROOT_PASSWORD=123 \
  -v $(pwd)/master/my.cnf:/etc/mysql/my.cnf \
  mysql:8.0
```

**Parameters explained**:

- `-d`: Run in detached mode (background)
- `--name mysql-master`: Container name
- `--network my_master_slave_mysql`: Connect to our custom network
- `-p 8811:3306`: Map host port 8811 to container port 3306 (for external access)
- `-e MYSQL_ROOT_PASSWORD=123`: Set root password
- `-v $(pwd)/master/my.cnf:/etc/mysql/my.cnf`: **CRITICAL** - Mount config file into container
- `mysql:8.0`: Use MySQL 8.0 image

**Why mounting is important**:

- Ensures config is loaded when container starts
- Persists configuration across container restarts
- Changes to host file immediately available in container

---

### Step 4: Start Slave Container

```bash
docker run -d \
  --name mysql-slave \
  --network my_master_slave_mysql \
  -p 8822:3306 \
  -e MYSQL_ROOT_PASSWORD=123 \
  -v $(pwd)/slave/my.cnf:/etc/mysql/my.cnf \
  mysql:8.0
```

**Note**: Different port (8822) and different config file (slave/my.cnf with server-id=2)

---

### Step 5: Verify Server IDs

Wait 10-15 seconds for containers to fully start, then verify:

**Check Master:**

```bash
docker exec mysql-master mysql -uroot -p123 -e "SHOW VARIABLES LIKE 'server_id';"
```

**Expected output**: `server_id = 1`

**Check Slave:**

```bash
docker exec mysql-slave mysql -uroot -p123 -e "SHOW VARIABLES LIKE 'server_id';"
```

**Expected output**: `server_id = 2`

**If server_id is wrong**, your config file is not being loaded. Check the mount path.

---

### Step 6: Get Master Status

```bash
docker exec mysql-master mysql -uroot -p123 -e "SHOW MASTER STATUS;"
```

**Example output**:

```
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000003 |      157 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
```

**Important**: Note down `File` and `Position` - you'll need these for slave configuration!

**What this means**:

- `File`: Current binary log file
- `Position`: Current position in that file (where slave should start reading)

---

### Step 7: Get Master IP Address

```bash
docker inspect mysql-master --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

OR see full details:

```bash
docker inspect mysql-master
```

**Example output**: `172.18.0.2`

**Why needed**: Slave needs to know master's IP to connect and replicate.

---

### Step 8: Configure Slave Replication

```bash
docker exec mysql-slave mysql -uroot -p123 -e "
STOP SLAVE;
CHANGE MASTER TO
  MASTER_HOST='172.18.0.2',
  MASTER_PORT=3306,
  MASTER_USER='root',
  MASTER_PASSWORD='123',
  MASTER_LOG_FILE='mysql-bin.000003',
  MASTER_LOG_POS=157,
  MASTER_CONNECT_RETRY=60,
  GET_MASTER_PUBLIC_KEY=1;
START SLAVE;
"
```

**Replace**:

- `172.18.0.2` with your master IP from Step 7
- `mysql-bin.000003` with your File from Step 6
- `157` with your Position from Step 6

**Parameters explained**:

- `MASTER_HOST`: Master server IP
- `MASTER_PORT`: Master MySQL port (3306 inside container)
- `MASTER_USER`: MySQL user for replication (using root here, but should use dedicated replication user in production)
- `MASTER_PASSWORD`: Password for replication user
- `MASTER_LOG_FILE`: Binary log file to start reading from
- `MASTER_LOG_POS`: Position in binary log to start reading from
- `MASTER_CONNECT_RETRY`: Seconds to wait before retry on connection failure
- `GET_MASTER_PUBLIC_KEY`: Required for MySQL 8.0's caching_sha2_password authentication

---

### Step 9: Verify Replication Status

```bash
docker exec mysql-slave mysql -uroot -p123 -e "SHOW SLAVE STATUS\G"
```

**Key fields to check**:

```
Slave_IO_Running: Yes
Slave_SQL_Running: Yes
Seconds_Behind_Master: 0
Last_IO_Error:
Last_SQL_Error:
```

**Status meanings**:

- `Slave_IO_Running: Yes` - Slave is successfully reading binary logs from master
- `Slave_SQL_Running: Yes` - Slave is successfully executing replicated SQL statements
- `Seconds_Behind_Master: 0` - Slave is caught up with master
- `Last_IO_Error` / `Last_SQL_Error` should be empty (no errors)

**If `Slave_IO_Running: No`**:

- Check `Last_IO_Error` for details
- Common issues: wrong master IP, wrong credentials, server_id conflict

**If `Slave_SQL_Running: No`**:

- Check `Last_SQL_Error` for details
- Common issues: SQL conflicts, missing tables, permission issues

---

### Step 10: Comprehensive Replication Testing

- **Current position** the IO thread is reading from master's binary log

```
Relay_Log_File: c1a442d05e74-relay-bin.000002
Relay_Log_Pos: 326
```

- **Current position** in the slave's relay log

```
Exec_Source_Log_Pos: 157
```

- **Position** the SQL thread has executed up to
- Should match `Read_Source_Log_Pos` when caught up

```
Seconds_Behind_Source: 0
```

- **Replication lag**: How many seconds behind the slave is
- **0 = Perfect sync**, higher numbers mean slave is lagging

```
Last_IO_Error: (empty)
Last_SQL_Error: (empty)
```

- **Should always be empty**
- If there's text here, replication has errors

---

## Way 2: Copy Config Files After Container Creation

This approach avoids file mounting issues and is simpler for development environments.

### Step 1: Create Docker Network

```bash
docker network create my_master_slave_mysql
```

**What it does**: Creates an isolated network for master and slave to communicate.

---

### Step 2: Start Containers WITHOUT Config Files

Start both containers with default MySQL configuration:

```bash
# Start Master container
docker run -d \
  --name mysql-master \
  --network my_master_slave_mysql \
  -p 8811:3306 \
  -e MYSQL_ROOT_PASSWORD=123 \
  mysql:8.0

# Start Slave container
docker run -d \
  --name mysql-slave \
  --network my_master_slave_mysql \
  -p 8822:3306 \
  -e MYSQL_ROOT_PASSWORD=123 \
  mysql:8.0
```

**Note**: No `-v` volume mounts needed at this stage!

---

### Step 3: Copy Config Files Into Containers

Wait 10-15 seconds for containers to fully start, then copy the config files:

```bash
# Copy master config
docker cp "/home/khang/Documents/PERSONAL PAGE/REPO/SShop/be/nodejs-be/docs/mysql/master/my.cnf" mysql-master:/etc/mysql/my.cnf

# Copy slave config
docker cp "/home/khang/Documents/PERSONAL PAGE/REPO/SShop/be/nodejs-be/docs/mysql/slave/my.cnf" mysql-slave:/etc/mysql/my.cnf
```

**Important**: Replace the path with your actual config file location if different.

---

### Step 4: Restart Containers to Apply Config

```bash
docker restart mysql-master
docker restart mysql-slave
```

**Wait 10-15 seconds** for containers to fully restart before proceeding.

---

### Step 5: Verify Server IDs

Check that the configurations were applied correctly:

```bash
# Check master (should show server_id = 1)
docker exec mysql-master mysql -uroot -p123 -e "SHOW VARIABLES LIKE 'server_id';"

# Check slave (should show server_id = 2)
docker exec mysql-slave mysql -uroot -p123 -e "SHOW VARIABLES LIKE 'server_id';"
```

**Expected output**:

- Master: `server_id = 1`
- Slave: `server_id = 2`

If the server IDs are wrong, the config file wasn't loaded properly. Check container logs with `docker logs mysql-master`.

---

### Step 6: Get Master Status

```bash
docker exec mysql-master mysql -uroot -p123 -e "SHOW MASTER STATUS;"
```

**Example output**:

```
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000003 |      157 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
```

**Note down** `File` and `Position` - you'll need these values!

---

### Step 7: Get Master IP Address

```bash
docker inspect mysql-master --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

**Example output**: `172.18.0.2`

**Note down** this IP address!

---

### Step 8: Configure Slave Replication

Replace the values with your actual values from Steps 6 and 7:

```bash
docker exec mysql-slave mysql -uroot -p123 -e "
STOP SLAVE;
CHANGE MASTER TO
  MASTER_HOST='172.18.0.2',
  MASTER_PORT=3306,
  MASTER_USER='root',
  MASTER_PASSWORD='123',
  MASTER_LOG_FILE='mysql-bin.000003',
  MASTER_LOG_POS=157,
  MASTER_CONNECT_RETRY=60,
  GET_MASTER_PUBLIC_KEY=1;
START SLAVE;
"
```

**Replace**:

- `172.18.0.2` → Your master IP from Step 7
- `mysql-bin.000003` → Your File from Step 6
- `157` → Your Position from Step 6

---

### Step 9: Verify Replication Status

```bash
docker exec mysql-slave mysql -uroot -p123 -e "SHOW SLAVE STATUS\G"
```

**Look for these key indicators**:

```
Slave_IO_Running: Yes
Slave_SQL_Running: Yes
Seconds_Behind_Master: 0
Last_IO_Error:
Last_SQL_Error:
```

**Success!** If both are "Yes" and there are no errors, replication is working!

---

### Advantages of Way 2

- No file path or permission issues
- Works even if config files don't exist initially
- Simpler for development/testing
- No worries about spaces in file paths
- Docker won't create unwanted directories

### Disadvantages of Way 2

- Config changes on host don't auto-sync to container
- Need to manually copy and restart to update configs
- Less suitable for production (configs not version-controlled with container lifecycle)

---

## Complete Replication Testing Guide

### Test 1: Verify Replication Status

Before any testing, confirm replication is working:

```bash
docker exec mysql-slave mysql -uroot -p123 -e "SHOW REPLICA STATUS\G"
```

**Look for these indicators:**

```
Replica_IO_Running: Yes
Replica_SQL_Running: Yes
Seconds_Behind_Source: 0
Last_IO_Error: (empty)
Last_SQL_Error: (empty)
```

**Quick status check** (just the Running states):

```bash
docker exec mysql-slave mysql -uroot -p123 -e "SHOW SLAVE STATUS\G" | grep Running
```

**Expected output:**

```
Replica_IO_Running: Yes
Replica_SQL_Running: Yes
```

---

### Test 2: Database Creation Synchronization

This test verifies that databases created on master automatically appear on slave.

**Step 1: Check current databases on SLAVE**

```bash
docker exec mysql-slave mysql -uroot -p123 -e "SHOW DATABASES;"
```

**Expected output (before test):**

```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
```

**Step 2: Create database on MASTER**

```bash
docker exec mysql-master mysql -uroot -p123 -e "CREATE DATABASE test DEFAULT CHARSET utf8mb4;"
```

**Step 3: Verify database appears on SLAVE**

```bash
docker exec mysql-slave mysql -uroot -p123 -e "SHOW DATABASES;"
```

**Expected output (after test):**

```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
| test               |  <-- NEW DATABASE REPLICATED!
+--------------------+
```

**What just happened?**

1. Master executed `CREATE DATABASE test`
2. Master wrote this command to binary log (mysql-bin.000003)
3. Slave's IO thread read it from binary log
4. Slave's SQL thread executed `CREATE DATABASE test` locally
5. Database now exists on BOTH servers!

---

### Test 3: Table Creation and Data Synchronization

**Step 1: Create table with data on MASTER**

```bash
docker exec mysql-master mysql -uroot -p123 -e "
USE test;
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com');
INSERT INTO users (name, email) VALUES ('Charlie', 'charlie@example.com');
"
```

**Step 2: Verify table and data on SLAVE**

```bash
docker exec mysql-slave mysql -uroot -p123 -e "
USE test;
SHOW TABLES;
SELECT * FROM users;
"
```

**Expected output:**

```
+----------------+
| Tables_in_test |
+----------------+
| users          |
+----------------+

+----+---------+---------------------+---------------------+
| id | name    | email               | created_at          |
+----+---------+---------------------+---------------------+
|  1 | Alice   | alice@example.com   | 2026-01-06 10:30:15 |
|  2 | Bob     | bob@example.com     | 2026-01-06 10:30:15 |
|  3 | Charlie | charlie@example.com | 2026-01-06 10:30:15 |
+----+---------+---------------------+---------------------+
```

**Verification**: Data is IDENTICAL on slave!

---

### Test 4: Real-time UPDATE Synchronization

**Step 1: Update data on MASTER**

```bash
docker exec mysql-master mysql -uroot -p123 -e "
USE test;
UPDATE users SET email = 'alice.updated@example.com' WHERE name = 'Alice';
"
```

**Step 2: Verify update on SLAVE**

```bash
docker exec mysql-slave mysql -uroot -p123 -e "
USE test;
SELECT * FROM users WHERE name = 'Alice';
"
```

**Expected output:**

```
+----+-------+---------------------------+---------------------+
| id | name  | email                     | created_at          |
+----+-------+---------------------------+---------------------+
|  1 | Alice | alice.updated@example.com | 2026-01-06 10:30:15 |
+----+-------+---------------------------+---------------------+
```

**Result**: Update replicated successfully!

---

### Test 5: DELETE Synchronization

**Step 1: Delete record on MASTER**

```bash
docker exec mysql-master mysql -uroot -p123 -e "
USE test;
DELETE FROM users WHERE name = 'Bob';
"
```

**Step 2: Verify deletion on SLAVE**

```bash
docker exec mysql-slave mysql -uroot -p123 -e "
USE test;
SELECT COUNT(*) as total_users FROM users;
SELECT * FROM users;
"
```

**Expected output:**

```
+-------------+
| total_users |
+-------------+
|           2 |  <-- Was 3, now 2
+-------------+

+----+---------+---------------------------+---------------------+
| id | name    | email                     | created_at          |
+----+---------+---------------------------+---------------------+
|  1 | Alice   | alice.updated@example.com | 2026-01-06 10:30:15 |
|  3 | Charlie | charlie@example.com       | 2026-01-06 10:30:15 |
+----+---------+---------------------------+---------------------+
```

**Result**: Bob deleted on both master and slave!

---

### Test 6: Schema Changes (ALTER TABLE)

**Step 1: Add column on MASTER**

```bash
docker exec mysql-master mysql -uroot -p123 -e "
USE test;
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
"
```

**Step 2: Verify schema change on SLAVE**

```bash
docker exec mysql-slave mysql -uroot -p123 -e "
USE test;
DESCRIBE users;
"
```

**Expected output:**

```
+------------+--------------+------+-----+-------------------+-------------------+
| Field      | Type         | Null | Key | Default           | Extra             |
+------------+--------------+------+-----+-------------------+-------------------+
| id         | int          | NO   | PRI | NULL              | auto_increment    |
| name       | varchar(100) | NO   |     | NULL              |                   |
| email      | varchar(100) | YES  |     | NULL              |                   |
| created_at | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| phone      | varchar(20)  | YES  |     | NULL              |  <-- NEW COLUMN   |
+------------+--------------+------+-----+-------------------+-------------------+
```

**Result**: Schema changes replicate too!

---

### Test 7: Multiple Operations in Sequence

**Step 1: Run complex transaction on MASTER**

```bash
docker exec mysql-master mysql -uroot -p123 -e "
USE test;
START TRANSACTION;
INSERT INTO users (name, email, phone) VALUES ('David', 'david@example.com', '555-1234');
INSERT INTO users (name, email, phone) VALUES ('Eve', 'eve@example.com', '555-5678');
UPDATE users SET phone = '555-0000' WHERE name = 'Alice';
COMMIT;
"
```

**Step 2: Verify all changes on SLAVE**

```bash
docker exec mysql-slave mysql -uroot -p123 -e "
USE test;
SELECT * FROM users ORDER BY id;
"
```

**Expected output:**

```
+----+---------+---------------------------+---------------------+----------+
| id | name    | email                     | created_at          | phone    |
+----+---------+---------------------------+---------------------+----------+
|  1 | Alice   | alice.updated@example.com | 2026-01-06 10:30:15 | 555-0000 |
|  3 | Charlie | charlie@example.com       | 2026-01-06 10:30:15 | NULL     |
|  4 | David   | david@example.com         | 2026-01-06 10:35:22 | 555-1234 |
|  5 | Eve     | eve@example.com           | 2026-01-06 10:35:22 | 555-5678 |
+----+---------+---------------------------+---------------------+----------+
```

**Result**: Entire transaction replicated atomically!

---

### Test 8: Monitor Replication Lag

**Step 1: Insert large batch on MASTER**

```bash
docker exec mysql-master mysql -uroot -p123 -e "
USE test;
INSERT INTO users (name, email)
SELECT
  CONCAT('User', n) as name,
  CONCAT('user', n, '@example.com') as email
FROM (
  SELECT @row := @row + 1 as n
  FROM information_schema.columns LIMIT 1000
) t, (SELECT @row := 0) r;
"
```

**Step 2: Check replication lag immediately**

```bash
docker exec mysql-slave mysql -uroot -p123 -e "SHOW REPLICA STATUS\G" | grep "Seconds_Behind_Source"
```

**Expected output:**

```
Seconds_Behind_Source: 0
```

or possibly:

```
Seconds_Behind_Source: 1  (if inserting many rows)
```

**Step 3: Verify data count matches**

```bash
# Count on master
docker exec mysql-master mysql -uroot -p123 -e "USE test; SELECT COUNT(*) FROM users;"

# Count on slave
docker exec mysql-slave mysql -uroot -p123 -e "USE test; SELECT COUNT(*) FROM users;"
```

**Both should show the same count!**

---

### Test 9: Verify Binary Log Position

**Step 1: Check master binary log position**

```bash
docker exec mysql-master mysql -uroot -p123 -e "SHOW MASTER STATUS;"
```

**Example output:**

```
+------------------+----------+--------------+------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB |
+------------------+----------+--------------+------------------+
| mysql-bin.000003 |     5432 |              |                  |
+------------------+----------+--------------+------------------+
```

**Step 2: Check slave replication position**

```bash
docker exec mysql-slave mysql -uroot -p123 -e "SHOW REPLICA STATUS\G" | grep -E "Source_Log_File|Read_Source_Log_Pos|Exec_Source_Log_Pos"
```

**Expected output:**

```
Source_Log_File: mysql-bin.000003
Read_Source_Log_Pos: 5432
Exec_Source_Log_Pos: 5432
```

**Verification:**

- `Source_Log_File` should match master's `File`
- `Read_Source_Log_Pos` should match master's `Position`
- `Exec_Source_Log_Pos` should equal `Read_Source_Log_Pos` (no lag)

---

## Useful Commands

### Check Replication Status

```bash
# Quick check
docker exec mysql-slave mysql -uroot -p123 -e "SHOW SLAVE STATUS\G" | grep Running

# Full details
docker exec mysql-slave mysql -uroot -p123 -e "SHOW SLAVE STATUS\G"
```

### Check Master Binary Logs

```bash
docker exec mysql-master mysql -uroot -p123 -e "SHOW BINARY LOGS;"
```

### Reset Slave (if needed to reconfigure)

```bash
docker exec mysql-slave mysql -uroot -p123 -e "STOP SLAVE; RESET SLAVE ALL;"
```

### View Container Logs

```bash
docker logs mysql-master
docker logs mysql-slave
```

### Access MySQL Shell

```bash
# Master
docker exec -it mysql-master mysql -uroot -p123

# Slave
docker exec -it mysql-slave mysql -uroot -p123
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         Docker Network                      │
│      (my_master_slave_mysql)               │
│                                            │
│  ┌──────────────────┐                     │
│  │  MySQL Master    │                     │
│  │  server-id: 1    │                     │
│  │  Port: 8811:3306 │                     │
│  │  IP: 172.18.0.2  │                     │
│  │                  │                     │
│  │  Binary Logs:    │                     │
│  │  mysql-bin.xxx   │                     │
│  └─────────┬────────┘                     │
│            │                               │
│            │ Replication                   │
│            │ (Binary Log Transfer)         │
│            ▼                               │
│  ┌──────────────────┐                     │
│  │  MySQL Slave     │                     │
│  │  server-id: 2    │                     │
│  │  Port: 8822:3306 │                     │
│  │  IP: 172.18.0.3  │                     │
│  │                  │                     │
│  │  Reads & Applies │                     │
│  │  Binary Logs     │                     │
│  └──────────────────┘                     │
│                                            │
└─────────────────────────────────────────────┘
```

---

## References

- [MySQL 8.0 Replication Documentation](https://dev.mysql.com/doc/refman/8.0/en/replication.html)
- [Docker MySQL Official Image](https://hub.docker.com/_/mysql)
- [MySQL Server System Variables](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html)

~$ docker exec -it mysql-master bash
bash-5.1# mysql -uroot -p
Enter password: ********

mysql> create database test DEFAULT CHARSET utf8mb4;
Query OK, 1 row affected (0.01 sec)

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
| test               |
+--------------------+
5 rows in set (0.00 sec)
