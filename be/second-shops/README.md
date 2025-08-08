# Second Shops - E-commerce Backend

A Spring Boot application for managing second-hand shops.

## Quick Start

### Prerequisites
- Java 17
- Maven 3.6+
- Docker Desktop (for database)

### Database Setup (Docker)

1. **Start MySQL database:**
   ```bash
   docker-compose up -d
   ```

2. **Verify database is running:**
   ```bash
   docker-compose logs mysql
   ```

3. **Stop database when done:**
   ```bash
   docker-compose down
   ```

### Application Setup (Local)

1. **Run the Spring Boot application:**
   ```bash
   ./mvnw spring-boot:run
   ```
   
   Or in your IDE, run the `SecondShopsApplication.java` main method.

2. **Application will be available at:**
   ```
   http://localhost:9193
   ```

## Database Connection

### For DBeaver or MySQL Workbench:

**Connection Details:**
- **Host:** `localhost`
- **Port:** `3306`
- **Database:** `second_shops_db`
- **Username:** `root`
- **Password:** `admin`

**Alternative user (with limited privileges):**
- **Username:** `app_user`
- **Password:** `app_password`

### DBeaver Setup:
1. Open DBeaver
2. Click "New Database Connection"
3. Select "MySQL"
4. Enter the connection details above
5. Test connection and save

### MySQL Workbench Setup:
1. Open MySQL Workbench
2. Click "+" to create new connection
3. Enter connection name: "Second Shops DB"
4. Enter the connection details above
5. Test connection and save

## Development Workflow

1. **Start database:** `docker-compose up -d`
2. **Run Spring Boot app locally** (in IDE or terminal)
3. **Make code changes** - app will auto-restart with Spring Boot DevTools
4. **Stop database when done:** `docker-compose down`

## Useful Commands

```bash
# View database logs
docker-compose logs -f mysql

# Access database directly via Docker
docker-compose exec mysql mysql -u root -p second_shops_db

# Check running containers
docker ps

# Restart database container
docker-compose restart mysql
```
