-- Show all events
SHOW EVENTS;

-- Create event to automatically create table every month
CREATE EVENT IF NOT EXISTS auto_create_table_month_event ON SCHEDULE EVERY 1 MONTH -- cron job every month
STARTS CONCAT(DATE_FORMAT(NOW(), '%Y-%m-'), '01 00:00:00') -- Start from first day of current month
ON COMPLETION PRESERVE -- Keep event after execution (không xóa bỏ khi thực hiện xong)
ENABLE -- Enable the event
DO CALL create_table_auto_month();