# MySQL Course Notes

This folder contains two independent topics covered in the course.

```text
mysql/
├── 1 enviroment/               # Topic 1 – Master-Slave replication
│   ├── MASTER_SLAVE_REPLICATION_OVERVIEW.md
│   ├── MASTER_SLAVE_SETUP.md
│   └── cnf/
│       ├── master/my.cnf       # MySQL config for the master node
│       └── slave/my.cnf        # MySQL config for the slave node
│
└── 2 procedure cron/           # Topic 2 – Automated monthly table management
    ├── 1_create_table_and_partition.sql
    ├── 2_procedure.sql
    └── 3_evencront.sql
```

---

## Topic 1 – MySQL Master-Slave Replication (`1 enviroment/`)

### What it is

Master-Slave (Primary-Replica) replication streams every write from one MySQL
server (master) to one or more read-only copies (slaves). Common uses:

- Scale-out read traffic (point reporting queries at the slave)
- Hot-standby for failover
- Zero-downtime backups (backup the slave, not the master)

### Files

| File | Purpose |
|------|---------|
| `MASTER_SLAVE_REPLICATION_OVERVIEW.md` | Theory — explains how replication works in MySQL, MongoDB, and Redis with architecture diagrams and comparison table. Read this first if the concept is new. |
| `MASTER_SLAVE_SETUP.md` | Practice — step-by-step Docker guide. Includes two setup methods, 10 configuration steps, 9 replication tests, and common error fixes (e.g. duplicate `server-id` error). |
| `cnf/master/my.cnf` | MySQL config file to mount into the **master** container. |
| `cnf/slave/my.cnf` | MySQL config file to mount into the **slave** container. |

### Key difference between the two `.cnf` files

```ini
# master/my.cnf
server-id = 1   # must be unique across all nodes
log_bin   = mysql-bin   # enable binary log so the slave can replay writes

# slave/my.cnf
server-id = 2   # different id – same value as master causes replication to break
log_bin   = mysql-bin
```

Both files also disable DNS lookups (`skip-name-resolve`) and host-name caching
(`skip-host-cache`), which is recommended for containerised deployments.

### How to reuse

1. Follow `MASTER_SLAVE_SETUP.md` — it tells you exactly where to place these
   `.cnf` files (bind-mounted into `/etc/mysql/my.cnf` inside the container).
2. If you add more slaves, copy `cnf/slave/my.cnf`, change `server-id` to a
   new unique integer (3, 4, …), and mount it into the new container.
3. Never give two nodes the same `server-id` — replication will silently stop.

---

## Topic 2 – Automated Monthly Table Creation (`2 procedure cron/`)

### What it is

A pattern for **horizontal table partitioning by month**: instead of one huge
`orders` table, a new table (`orders_YYYYMM`) is created automatically at the
start of each month. MySQL's built-in event scheduler acts as the cron job.

The three SQL files must be run **in order**.

### Files

#### `1_create_table_and_partition.sql` — Range partitioning demo

```sql
-- Creates a single orders table split into yearly partitions
PARTITION BY RANGE COLUMNS(order_date) (
  PARTITION p2022 VALUES LESS THAN ('2023-01-01'),
  PARTITION p2023 VALUES LESS THAN ('2024-01-01'),
  PARTITION p2024 VALUES LESS THAN ('2025-01-01'),
  PARTITION pmax  VALUES LESS THAN (MAXVALUE)
)
```

This is a **reference example** showing MySQL's native `PARTITION BY RANGE`
syntax. MySQL can skip irrelevant partitions entirely when a `WHERE` clause
filters on `order_date` — this is called *partition pruning*.

Run the commented `EXPLAIN` statements at the bottom to see pruning in action:

```sql
EXPLAIN SELECT * FROM orders PARTITION (p2023);       -- explicit partition
SELECT  * FROM orders WHERE order_date >= '2023-01-01'; -- pruning skips p2022
```

---

#### `2_procedure.sql` — Stored procedure that creates next month's table

```sql
CALL create_table_auto_month();
```

What it does step-by-step:

1. Calculates the name of **next month** in `YYYYMM` format (e.g. `202503`).
2. Builds a `CREATE TABLE IF NOT EXISTS orders_202503 (…)` statement as a string.
3. Executes it with `PREPARE` / `EXECUTE` (dynamic SQL is required inside stored procedures).
4. Frees the prepared statement with `DEALLOCATE PREPARE`.
5. Queries `information_schema.TABLES` and returns `tableCount` (1 = success, 0 = failed).

Call it manually any time you want to pre-create next month's table:

```sql
CALL create_table_auto_month();
-- returns: tableCount = 1
```

> **Note**: `IF NOT EXISTS` makes it safe to call more than once — running it
> twice in the same month is a no-op.

---

#### `3_evencront.sql` — MySQL Event (cron job) that runs the procedure monthly

```sql
CREATE EVENT IF NOT EXISTS auto_create_table_month_event
  ON SCHEDULE EVERY 1 MONTH
  STARTS CONCAT(DATE_FORMAT(NOW(), '%Y-%m-'), '01 00:00:00')
  ON COMPLETION PRESERVE
  ENABLE
  DO CALL create_table_auto_month();
```

| Clause | Meaning |
|--------|---------|
| `EVERY 1 MONTH` | Fire once per month |
| `STARTS … '01 00:00:00'` | First run at midnight on the 1st of the current month (if that's already past, MySQL runs it immediately then waits a full month) |
| `ON COMPLETION PRESERVE` | Keep the event definition after it fires (default would delete it) |
| `ENABLE` | The event is active as soon as it is created |

Check or manage the event:

```sql
SHOW EVENTS;                                 -- list all events
ALTER EVENT auto_create_table_month_event DISABLE;  -- pause
ALTER EVENT auto_create_table_month_event ENABLE;   -- resume
DROP   EVENT auto_create_table_month_event;         -- delete
```

> **Prerequisite**: The MySQL Event Scheduler must be turned on.
>
> ```sql
> SET GLOBAL event_scheduler = ON;
> -- or in my.cnf: event_scheduler = ON
> ```

---

### Full setup order

```sql
-- Step 1: create the partitioned reference table (optional, for learning)
SOURCE 1_create_table_and_partition.sql;

-- Step 2: create the stored procedure
SOURCE 2_procedure.sql;

-- Step 3: create the monthly event (calls the procedure automatically)
SOURCE 3_evencront.sql;

-- Step 4: verify
SHOW EVENTS;
CALL create_table_auto_month();  -- test run
```

---

## Quick-reference cheat sheet

```
Topic 1 – Replication
  Read overview   →  MASTER_SLAVE_REPLICATION_OVERVIEW.md
  Run Docker lab  →  MASTER_SLAVE_SETUP.md + cnf/ files

Topic 2 – Monthly tables
  1_create_table_and_partition.sql  →  partition concept demo (run once)
  2_procedure.sql                   →  create the stored procedure (run once)
  3_evencront.sql                   →  register the monthly cron event (run once)
```
