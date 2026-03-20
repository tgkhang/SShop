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
When it asks for datasource, select Prometheus (it should auto-select since it's default)