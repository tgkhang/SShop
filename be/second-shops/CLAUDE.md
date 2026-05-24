# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Second Shops** is a Spring Boot 3.5.4 eCommerce backend (Java 17, Maven) for managing second-hand shops. It exposes a REST API at `http://localhost:9193` with the prefix `/api/v1`.

## Commands

### Database (required before running the app)

```bash
docker-compose up -d          # Start MySQL 8.0 container
docker-compose down           # Stop container
docker-compose logs -f mysql  # Tail database logs
```

### Build & Run

```bash
./mvnw spring-boot:run        # Run with hot-reload (Spring Boot DevTools)
./mvnw clean package          # Build JAR
./mvnw clean package -DskipTests  # Build without running tests
```

### Tests

```bash
./mvnw test                                    # Run all tests
./mvnw test -Dtest=OrderServiceTest            # Run a single test class
./mvnw test -Dtest=OrderServiceTest#testPlaceOrder_Success  # Run a single test method
```

### Useful URLs

- API: `http://localhost:9193/api/v1/`
- Swagger UI: `http://localhost:9193/swagger-ui/index.html`
- Actuator: `http://localhost:9193/actuator`

## Architecture

The codebase follows a strict layered architecture:

```txt
Controller → Service (Interface + Impl) → Repository → Model (JPA Entity)
```

Each domain (product, category, cart, order, image, user) has its own sub-package under `service/` and `controller/`.

### Key Packages

| Package | Purpose |
|---|---|
| `controller/` | REST endpoints; all responses wrapped in `APIResponse` |
| `service/<domain>/` | Business logic; always an `IXxxService` interface + `XxxService` impl |
| `repository/` | Spring Data JPA repositories |
| `model/` | JPA entities (`@Entity`) |
| `dto/` | Data Transfer Objects returned to clients |
| `mapper/` | Converts entities to DTOs (see below) |
| `request/` | Incoming request body POJOs |
| `response/` | `APIResponse` wrapper `{ message, data }` |
| `security/` | JWT filter chain, `ShopUser` principal, `JwtUtils` |
| `exceptions/` | Custom exceptions + `GlobalExceptionHandler` (`@ControllerAdvice`) |
| `data/` | `DataInitializer` — seeds roles and default users on startup |
| `enums/` | `OrderStatus` (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED) |

### Dual Mapper Pattern

`ProductMapper` contains **two coexisting approaches** — do not mix them within the same controller method:

- **Manual mapping** (`mapToProductDto` / `mapToProductDtos`): hand-written field assignment; used by `ProductController`
- **ModelMapper-based** (`toDto` / `toDtos`): uses `ModelMapper` bean from `ShopConfig`

Other mappers (`CartMapper`, `OrderMapper`, etc.) follow a similar manual-mapping style.

### Security Model

- **Stateless JWT** (HS256, 24-hour expiry). Token carries `id`, `roles` claims; subject is the user's email.
- **Public endpoints**: `/api/v1/auth/**`, `/api/v1/products/**`, `/api/v1/categories/**`, `/api/v1/images/**`, Swagger, Actuator, and public user registration (`/api/v1/users/create`).
- **USER or ADMIN**: `/api/v1/cart/**`, `/api/v1/orders/**`
- **ADMIN only**: `/api/v1/admin/**` and any product/user mutation endpoints guarded by `@PreAuthorize("hasRole('ROLE_ADMIN')")`

### Data Initialization

`DataInitializer` fires on `ApplicationReadyEvent` and idempotently seeds:

- Roles: `ROLE_ADMIN`, `ROLE_USER`
- Admin user: `admin@shop.com` / `admin123` (has both roles)
- Test users: `user1@shop.com` … `user5@shop.com` / `password123`

### Schema Management

`spring.jpa.hibernate.ddl-auto=update` — Hibernate automatically alters tables to match entity changes on each startup. Switch to `create` (destructive) or `validate` as needed via `application.properties`.

## Database Connection

- Host: `localhost:3306`, Database: `second_shops_db`
- Root credentials: `root` / `admin`
- App user (limited): `app_user` / `app_password`
