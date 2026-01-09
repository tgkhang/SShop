// Create table

CREATE TABLE test_table (
  id int NOT NULL,
  name varchar(255) DEFAULT NULL,
  age int DEFAULT NULL,
  address varchar(255) DEFAULT NULL,
  primary key (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4


// create procedure
CREATE PROCEDURE 'insert_data'()
BEGIN
DECLARE max_id INT DEFAULT 1000000;
DECLARE i INT DEFAULT 1;
WHILE i<=max_id DO
INSERT INTO test_table (id,name,age,address) VALUES (i, CONCAT('name',i), i%100, concat('address',i));
SET i = i + 1;
END WHILE;
END

// call procedure
CALL insert_data();
