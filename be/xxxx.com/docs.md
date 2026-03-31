delete src -> create new module -> add dependencies

- add module xxxx-controller
- xxxx-start need to import controller module


start -> controller -> app


Step 2: Re-import dashboards
After restart, the Prometheus datasource is auto-provisioned with uid: prometheus and set as default. Now re-import the dashboards:

Go to http://localhost:3000 → login admin / admin1234
Dashboards → New → Import
Import each dashboard by ID:
1860 — Node Exporter Full
7362 — MySQL Overview
4701 — JVM Micrometer
11378 — Spring Boot Statistics
763 - redis exporter
When it asks for datasource, select Prometheus (it should auto-select since it's default) 
setup variable if it is not in dashboard, go to dashboard settings -> variables -> add variable



access docker redis
docker exec -it pre-event-redis bash
continue to run redis-cli

docker exec -it pre-event-redis redis-cli

bash vs cli: bash cho phép bạn chạy các lệnh shell trong container, còn cli (command line interface) là giao diện dòng lệnh của ứng dụng cụ thể (ở đây là redis-cli cho Redis).


C:\Users\trang>docker exec -it pre-event-redis bash
root@759c1cd4d031:/data# redis-cli info clients


access mysql
docker exec -it pre-event-mysql -uroot -proot1234 
OCI runtime exec failed: exec failed: unable to start container process: exec: "-uroot": executable file not found in $PATH


change to 
docker exec -it pre-event-mysql bash

next run: 
bash-5.1# mysql -uroot -proot1234
SHOW VARIABLES LIKE 'version';
SHOW VARIABLES LIKE 'max_connections';