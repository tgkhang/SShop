-- Create partitioned table orders
CREATE TABLE IF NOT EXISTS orders (
  order_id INT,
  order_date DATE NOT NULL,
  PRIMARY KEY (order_id, order_date)
) PARTITION BY RANGE COLUMNS(order_date) (
  -- 4 partitions
  PARTITION p2022
  VALUES
    LESS THAN ('2023-01-01'),
    PARTITION p2023
  VALUES
    LESS THAN ('2024-01-01'),
    PARTITION p2024
  VALUES
    LESS THAN ('2025-01-01'),
    PARTITION pmax
  VALUES
    LESS THAN (MAXVALUE)
);

-- Query all partitions (scans all physical tables)
-- EXPLAIN SELECT * FROM orders;
-- Query specific partition
-- EXPLAIN SELECT * FROM orders PARTITION (p2023);
-- Range query (doesn't scan p2022 partition)
-- SELECT * FROM orders WHERE order_date >= '2023-01-01';