CREATE DEFINER = `root` @`%` PROCEDURE `create_table_auto_month`()
BEGIN

  -- Calculate next month in YYYYMM format (e.g. 202503)
  SELECT SUBSTR(
    REPLACE(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '-', ''),
    1, 6
  ) INTO @nextMonth;

  -- Table name = prefix + month  =>  orders_202503
  SET @table_prefix = 'orders_';
  SET @tableName    = CONCAT(@table_prefix, @nextMonth);

  -- Build the CREATE TABLE statement dynamically
  SET @createTableSQL = CONCAT(
    'CREATE TABLE IF NOT EXISTS ', @tableName, ' (',
    '  order_id     INT NOT NULL,',
    '  order_date   DATE NOT NULL,',
    '  total_amount DECIMAL(10, 2),',
    '  PRIMARY KEY (order_id, order_date)',
    ')'
  );

  -- Prepare → Execute → Deallocate  (dynamic SQL requires PREPARE in stored procs)
  PREPARE create_stmt FROM @createTableSQL;
  EXECUTE create_stmt;
  DEALLOCATE PREPARE create_stmt;

  -- Verify: count how many tables now have that name
  SELECT COUNT(1) INTO @tableCount
  FROM information_schema.`TABLES`
  WHERE TABLE_NAME = @tableName;

  -- Return result so the caller can inspect it
  SELECT @tableCount AS tableCount;

END
