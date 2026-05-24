# Architecture Overview — Second Shops

## 1. What Is This Project?

**Second Shops** is a stateless **REST API backend** built with Spring Boot 3.5.4 (Java 17, Maven).
It powers an eCommerce platform for second-hand goods. There is **no server-side View layer** — all responses are JSON, intended to be consumed by a separate frontend (React, mobile app, etc.).

- Base URL: `http://localhost:9193/api/v1`
- API Docs: `http://localhost:9193/swagger-ui/index.html`
- Metrics: `http://localhost:9193/actuator`

---

## 2. High-Level Stack

| Concern        | Technology                          |
|----------------|-------------------------------------|
| Language       | Java 17                             |
| Framework      | Spring Boot 3.5.4                   |
| Build tool     | Maven (Maven Wrapper `mvnw`)        |
| Database       | MySQL 8.0 (via Docker)              |
| ORM            | Spring Data JPA / Hibernate         |
| Security       | Spring Security + JWT (HS256)       |
| Object mapping | ModelMapper + manual mappers        |
| API docs       | SpringDoc OpenAPI (Swagger UI)      |
| Observability  | Spring Boot Actuator                |

---

## 3. Layered Architecture

The project follows a **strict 4-layer architecture**. Data always flows top-to-bottom, and dependencies only point downward.

```txt
┌─────────────────────────────────────────────────────┐
│                   HTTP Client                        │
└─────────────────────┬───────────────────────────────┘
                      │  JSON (request / response)
┌─────────────────────▼───────────────────────────────┐
│               Controller Layer                       │
│  - @RestController                                   │
│  - Validates input (request POJOs)                   │
│  - Wraps result in APIResponse { message, data }     │
└─────────────────────┬───────────────────────────────┘
                      │  calls
┌─────────────────────▼───────────────────────────────┐
│               Service Layer                          │
│  - IXxxService interface + XxxService impl           │
│  - All business logic lives here                     │
│  - Domain sub-packages: cart, category, image,       │
│    order, product, user                              │
└─────────────────────┬───────────────────────────────┘
                      │  calls
┌─────────────────────▼───────────────────────────────┐
│             Repository Layer                         │
│  - Spring Data JPA repositories                      │
│  - One interface per aggregate root                  │
│  - Custom JPQL/native queries where needed           │
└─────────────────────┬───────────────────────────────┘
                      │  reads / writes
┌─────────────────────▼───────────────────────────────┐
│               Model Layer (JPA Entities)             │
│  - @Entity classes mapped to MySQL tables            │
│  - DDL managed by Hibernate (ddl-auto=update)        │
└─────────────────────────────────────────────────────┘
```

---

## 4. Package Structure

```
com.projectcodework.second_shops/
│
├── controller/          # REST endpoints (one class per domain)
│   ├── AuthController
│   ├── ProductController
│   ├── CategoryController
│   ├── CartController / CartItemController
│   ├── OrderController
│   ├── ImageController
│   └── UserController
│
├── service/             # Business logic (interface + impl per domain)
│   ├── cart/            ICartService, CartService
│   │                    ICartItemService, CartItemService
│   ├── category/        ICategoryService, CategoryService
│   ├── image/           IImageService, ImageService
│   ├── order/           IOrderService, OrderService
│   ├── product/         IProductService, ProductService
│   └── user/            IUserService, UserService, UserSecurityService
│
├── repository/          # Spring Data JPA interfaces
├── model/               # JPA @Entity classes
├── dto/                 # Data Transfer Objects (client-facing shapes)
├── mapper/              # Entity → DTO conversion (see §5)
├── request/             # Incoming request body POJOs
├── response/            # APIResponse wrapper + JwtResponse
├── enums/               # OrderStatus (PENDING → CANCELLED)
├── exceptions/          # Custom exceptions + GlobalExceptionHandler
├── security/            # JWT filter chain, ShopUser principal
├── config/              # ShopConfig (ModelMapper bean), OpenApiConfig
└── data/                # DataInitializer — seed roles & users on startup
```

---

## 5. Dual Mapper Pattern

`ProductMapper` deliberately keeps two coexisting styles — **do not mix** them in the same controller method:

| Style | Methods | How it works |
|---|---|---|
| **ModelMapper** | `toDto()` / `toDtos()` | Uses the `ModelMapper` Spring bean; less boilerplate |
| **Manual** | `mapToProductDto()` / `mapToProductDtos()` | Hand-written field assignment; explicit control |

All other mappers (`CartMapper`, `OrderMapper`, `UserMapper`, etc.) use the manual style only.

---

## 6. Security Model

```
Request
  │
  ▼
JwtAuthTokenFilter          ← reads "Authorization: Bearer <token>"
  │  validates & sets SecurityContext
  ▼
ShopSecurityConfig          ← route-level access rules
  │
  ├── PUBLIC (no token needed)
  │     /api/v1/auth/**
  │     /api/v1/products/** (read)
  │     /api/v1/categories/**
  │     /api/v1/images/**
  │     /api/v1/users/create
  │     /swagger-ui/**, /actuator/**
  │
  ├── USER or ADMIN
  │     /api/v1/cart/**
  │     /api/v1/orders/**
  │
  └── ADMIN only
        /api/v1/admin/**
        + mutation endpoints guarded by @PreAuthorize("hasRole('ROLE_ADMIN')")
```

**Token details:**

- Algorithm: **HS256**
- Expiry: **24 hours**
- Claims carried: `id`, `roles`; subject = user email
- Session policy: **STATELESS** (no server-side session)
- Password hashing: **BCrypt**
- Unauthorized handler: `JwtAuthEntryPoint` → returns `401`

---

## 7. Data Flow — Example: Add Product to Cart

```
POST /api/v1/cart/items
  │
  ▼  JwtAuthTokenFilter authenticates (ROLE_USER required)
  │
  ▼  CartItemController.addItemToCart(request)
        └─ calls ICartItemService.addItemToCart(...)
              └─ calls IProductService.getProductById(...)     → ProductRepository
              └─ calls ICartService.getCartByUserId(...)        → CartRepository
              └─ saves CartItem                                  → CartItemRepository
              └─ returns CartDto
  │
  ▼  CartItemController wraps result:
       new APIResponse("Item added!", cartDto)
  │
  ▼  JSON response to client
```

---

## 8. Domain Model (Entity Relationships)

```
User ─────────── Cart (1:1)
                   │
                   └──── CartItem (1:N) ──── Product (N:1)
                                               │
                                               ├── Category (N:1)
                                               └── Image (1:N)

User ─────────── Order (1:N)
                   │
                   └──── OrderItem (1:N) ──── Product (N:1)

Role ──────────── User (M:N, via join table)
```

---

## 9. Infrastructure

| Component | Details |
|---|---|
| Database | MySQL 8.0 in Docker (`second-shops-db`, port `3306`) |
| DB name | `second_shops_db` |
| App DB user | `app_user` / `app_password` (limited) |
| Root credentials | `root` / `admin` |
| Schema management | `ddl-auto=update` — Hibernate alters tables on startup |
| Init SQL | `docker/mysql/init/01-init.sql` (grants, etc.) |

**Start the database:**

```bash
docker-compose up -d
```

---

## 10. Seed Data (DataInitializer)

Fires on `ApplicationReadyEvent`. Idempotent — safe to restart.

| Account | Email | Password | Roles |
|---|---|---|---|
| Admin | `admin@shop.com` | `admin123` | ROLE_ADMIN + ROLE_USER |
| Test User 1–5 | `user1@shop.com` … `user5@shop.com` | `password123` | ROLE_USER |

---

## 11. Key Design Decisions

| Decision | Rationale |
|---|---|
| Interface-per-service (`IXxxService`) | Enables mocking in tests; explicit contract separation |
| Stateless JWT (no sessions) | Scales horizontally; fits SPA/mobile clients |
| `APIResponse { message, data }` wrapper | Consistent envelope for all endpoints |
| `ddl-auto=update` in dev | Zero migration friction during development; switch to `validate` in production |
| Dual mapper in `ProductMapper` | Demonstrates both approaches for learning; `mapToProductDto` is used by `ProductController` |
