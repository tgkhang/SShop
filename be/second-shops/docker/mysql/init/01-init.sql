-- Initial database setup
CREATE DATABASE IF NOT EXISTS second_shops_db;

-- Create application user with limited privileges
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'app_password';
GRANT ALL PRIVILEGES ON second_shops_db.* TO 'app_user'@'%';

-- Optional: Insert some initial data
USE second_shops_db;
