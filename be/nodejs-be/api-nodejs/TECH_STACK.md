# Tech Stack

## Backend Framework & Runtime
- **Node.js**: JavaScript runtime environment with ES Modules support
- **Express.js v5**: Web application framework for building RESTful APIs, routing, and middleware management

## Database & Data Management
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose v9**: MongoDB ODM for schema validation, data modeling, and database queries
- **Redis v5**: In-memory data store for distributed locking, caching, and session management

## Security & Authentication
- **JWT (jsonwebtoken)**: Token-based authentication and authorization system
- **bcryptjs**: Password hashing and encryption for secure credential storage
- **Helmet**: Security middleware for setting HTTP headers (production only)
- **CORS**: Cross-origin resource sharing configuration for API access control
- **API Key Authentication**: Custom API key validation and permission-based access control

## Development Tools
- **Nodemon**: Auto-restart development server on file changes
- **ESLint**: Code linting and quality checks
- **Morgan**: HTTP request logging middleware with environment-based modes (dev/combined)
- **Cross-env**: Cross-platform environment variable management

## Middleware & Utilities
- **Cookie-parser**: Parse and handle HTTP cookies
- **Compression**: Response compression to reduce payload size
- **Dotenv**: Environment variable configuration management
- **Async-exit-hook**: Graceful shutdown handling for async operations

## Code Quality & Utilities
- **Lodash**: JavaScript utility library for data manipulation
- **Slugify**: URL-friendly string generation for product names/categories
- **ms**: Time string parsing and conversion (e.g., "2d" to milliseconds)
- **http-status-codes**: Standardized HTTP status code constants

## Design Patterns & Architecture
- **Factory Pattern**: Dynamic product type creation with registry-based instantiation
- **Builder Pattern**: Fluent API for constructing complex objects (discounts, queries, validators)
- **Repository Pattern**: Data access layer abstraction for database operations (cart, discount, inventory, product)
- **Service Layer Pattern**: Business logic separation from controllers
- **MVC Architecture**: Model-View-Controller separation with routes, controllers, services, and models

## API Features
- **RESTful API Design**: Versioned API endpoints (v1)
- **Authentication System**: JWT access/refresh tokens with Bearer token authorization
- **E-commerce Features**:
  - Product management (CRUD operations with type-specific storage)
  - Shopping cart functionality
  - Discount/coupon system with builder pattern validation
  - Order checkout with inventory reservation
  - Inventory tracking and stock management
- **Distributed Locking**: Redis-based pessimistic locking for concurrent order processing
- **Health Check Endpoint**: Application status monitoring

## Development Practices
- **Environment-based Configuration**: Separate dev/production modes
- **Error Handling**: Centralized error response handling with custom error classes
- **Async Operations**: Async handler wrapper for route handlers
- **Cache Control**: No-store policy for API responses to prevent stale data
- **Database Connection Monitoring**: Connection counting and overload detection
- **Code Documentation**: Markdown documentation for authentication flows, patterns, and business logic


redis pub sub, notification system

rabbitmq, message queue, s3 + cloudfront