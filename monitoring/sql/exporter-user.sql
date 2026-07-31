-- Restricted MySQL user for mysqld-exporter (read-only metrics access).
-- Run once on the box, e.g. via SSM:
--   docker exec -i airdnd-mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < exporter-user.sql
-- Then put the same password into monitoring/mysqld-exporter/.my.cnf
CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED BY 'CHANGE_ME_strong_password'
  WITH MAX_USER_CONNECTIONS 3;
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
FLUSH PRIVILEGES;
