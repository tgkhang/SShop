# Architecture Layers: Repository, Service, Model, Controller

## Overview - Layered Architecture Pattern

This document explains the **Repository Pattern** and **Layered Architecture** used in this Node.js project, comparing it with Java/Spring Boot where applicable.

```
┌──────────────────────────────────────────────┐
│          CONTROLLER LAYER                    │
│  (Routes/HTTP handlers - Request/Response)   │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│          SERVICE LAYER                       │
│  (Business Logic - Orchestration)            │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│        REPOSITORY LAYER                      │
│  (Data Access - Database Queries)            │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│          MODEL LAYER                         │
│  (Database Schema - Data Structure)          │
└──────────────────────────────────────────────┘
```

---

## 1. MODEL LAYER (Schema Definition)

### What is it?
Defines the **database schema** and **data structure** using Mongoose (ORM for MongoDB).

### Comparison with Java:
- **Node.js (Mongoose)**: `mongoose.Schema` - defines structure
- **Java/Spring**: `@Entity` class with JPA annotations

### What SHOULD be in Model:
- ✅ Database schema definition
- ✅ Field types and validations
- ✅ Default values
- ✅ Indexes
- ✅ Virtual properties (computed fields)
- ✅ Instance methods (model-specific helpers)
- ✅ Schema middleware (pre/post hooks)

### What SHOULD NOT be in Model:
- ❌ Business logic
- ❌ Database QUERIES (find, update, delete)
- ❌ HTTP request/response handling
- ❌ Validation of business rules

---

## 2. REPOSITORY LAYER (Data Access)

### What is it?
The **Repository Pattern** is a design pattern that provides an **abstraction layer** between the business logic (Service) and the data source (Database). It encapsulates all database operations.

### Comparison with Java:
This is **EXACTLY THE SAME** concept as in Java/Spring:
- **Node.js**: `CartRepo` with functions like `createUserCart()`, `findUserCart()`
- **Java/Spring**: `CartRepository extends JpaRepository<Cart, Long>` with methods like `findByUserId()`, `save()`

Both abstract away the database implementation details from the business logic.

### What SHOULD be in Repository:
- ✅ **Pure database queries** (CRUD operations)
- ✅ **Data access methods** (find, create, update, delete)
- ✅ **Query optimization** (select, populate, lean)
- ✅ **Complex database operations** (aggregations, joins)
- ✅ **Transaction handling** (if needed)
- ✅ **Reusable queries** used by multiple services

### What SHOULD NOT be in Repository:
- ❌ **Business logic** (calculations, validations)
- ❌ **Calling other repositories** (orchestration)
- ❌ **HTTP request/response handling**
- ❌ **Error handling** beyond database errors
- ❌ **Data transformation** for business purposes

### Key Rules:
1. **Repository should NOT call Service** - only Model
2. **Repository should be dumb** - just execute queries
3. **Repository methods should be reusable** - generic enough for multiple use cases
4. **One repository per Model** - `CartRepo` for `CartModel`, `ProductRepo` for `ProductModel`

### Example:
```javascript
// src/models/repository/cart.repo.js
import { CartModel } from '#models/cart.model.js'

// ✅ GOOD: Pure database query
const findUserCart = async ({ userId }) => {
  return await CartModel.findOne({
    cart_userId: userId,
    cart_state: 'active'
  }).lean().exec()
}

// ✅ GOOD: Data access operation
const updateUserCartQuantity = async ({ userId, product }) => {
  const { productId, quantity } = product
  const query = {
    cart_userId: userId,
    cart_state: 'active',
    'cart_products.productId': productId,
  }
  const updateSet = {
    $inc: { 'cart_products.$.quantity': quantity },
  }
  const options = { upsert: true, new: true }

  return await CartModel.findOneAndUpdate(query, updateSet, options).lean().exec()
}

// ❌ BAD: Business logic in repository
const addToCartWithValidation = async ({ userId, product }) => {
  // Checking product stock - this is business logic!
  const productInStock = await ProductModel.findById(product.productId)
  if (productInStock.quantity < product.quantity) {
    throw new Error('Not enough stock')
  }
  return await CartModel.create({ userId, product })
}

export const CartRepo = {
  findUserCart,
  updateUserCartQuantity,
}
```

---

## 3. SERVICE LAYER (Business Logic)

### What is it?
Contains **business logic** and **orchestrates** operations by calling repositories.

### Comparison with Java:
- **Node.js**: `CartService` with static methods
- **Java/Spring**: `@Service` annotated class with `@Autowired` repositories

### What SHOULD be in Service:
- ✅ **Business logic** (rules, calculations, validations)
- ✅ **Orchestration** (calling multiple repositories)
- ✅ **Data transformation** (formatting for business needs)
- ✅ **Complex workflows** (multi-step operations)
- ✅ **Transaction coordination** (across multiple repos)
- ✅ **Calling other services** (if needed)
- ✅ **Throwing business errors** (NotFoundError, ValidationError)

### What SHOULD NOT be in Service:
- ❌ **Direct Model access** (always use Repository)
- ❌ **HTTP concerns** (request/response objects)
- ❌ **Routing logic**
- ❌ **Database query implementation details**

### Key Rules:
1. **Service should ONLY call Repository** - NEVER call Model directly
2. **Service contains business rules** - "What should happen"
3. **Service orchestrates** - combines multiple repo calls
4. **Service validates business constraints** - stock levels, permissions, etc.

### Example:
```javascript
// src/services/cart.service.js
import { CartRepo } from '#models/repository/cart.repo.js'
import { ProductRepo } from '#models/repository/product.repo.js'
import { NotFoundError } from '#core/error.response'

class CartService {
  // ✅ GOOD: Business logic with repository calls
  static async addToCart({ userId, product = {} }) {
    // Check if user cart exists
    const userCart = await CartRepo.findUserCart({ userId })

    if (!userCart) {
      return await CartRepo.createUserCart({ userId, product })
    }

    // Business logic: Check if product already in cart
    const productExists = userCart.cart_products.some(
      (item) => item.productId === product.productId
    )

    if (!productExists) {
      return await CartRepo.createUserCart({ userId, product })
    }

    return await CartRepo.updateUserCartQuantity({ userId, product })
  }

  // ✅ GOOD: Validation + orchestration
  static async updateCart({ userId, shop_order_ids = [] }) {
    const { productId, quantity, shopId } = shop_order_ids[0]?.item_products[0] || {}

    // Business validation: Check product exists
    const foundProduct = await ProductRepo.getProductById({ productId })
    if (!foundProduct) throw new NotFoundError('Product not found')

    // Business validation: Verify shop ownership
    if (foundProduct.product_shopId.toString() !== shopId) {
      throw new NotFoundError('Product does not belong to this shop')
    }

    // Business rule: Delete if quantity is 0
    if (quantity === 0) {
      return await CartRepo.deleteCartItem({ userId, productId })
    }

    return await CartRepo.updateUserCartQuantity({ userId, product: { productId, quantity } })
  }

  // ❌ BAD: Direct model access
  static async getBadExample({ userId }) {
    // Don't do this! Use CartRepo.findUserCart instead
    return await CartModel.findOne({ cart_userId: userId })
  }
}

export { CartService }
```

---

## 4. CONTROLLER LAYER (HTTP Handlers)

### What is it?
Handles **HTTP requests and responses**, validates input, calls services.

### Comparison with Java:
- **Node.js**: Express route handlers or controller classes
- **Java/Spring**: `@RestController` with `@GetMapping`, `@PostMapping`

### What SHOULD be in Controller:
- ✅ **HTTP request handling** (req, res, next)
- ✅ **Input validation** (body, params, query)
- ✅ **Calling services** (business logic delegation)
- ✅ **Response formatting** (status codes, JSON structure)
- ✅ **Error handling** (try/catch for HTTP errors)
- ✅ **Authentication/Authorization checks**

### What SHOULD NOT be in Controller:
- ❌ **Business logic** (delegate to Service)
- ❌ **Database queries** (use Service -> Repository)
- ❌ **Complex data transformations**
- ❌ **Calling repositories directly**

### Example:
```javascript
// src/controllers/cart.controller.js
import { CartService } from '#services/cart.service.js'
import { SuccessResponse } from '#core/success.response'

class CartController {
  // ✅ GOOD: HTTP handling + service call
  static async addToCart(req, res, next) {
    try {
      const { userId } = req.user
      const { product } = req.body

      const result = await CartService.addToCart({ userId, product })

      new SuccessResponse({
        message: 'Product added to cart',
        metadata: result,
      }).send(res)
    } catch (error) {
      next(error)
    }
  }

  // ✅ GOOD: Input validation + delegation
  static async updateCart(req, res, next) {
    try {
      const { userId } = req.user
      const { shop_order_ids } = req.body

      // Simple input validation
      if (!shop_order_ids || !shop_order_ids.length) {
        return res.status(400).json({ message: 'Invalid input' })
      }

      const result = await CartService.updateCart({ userId, shop_order_ids })

      new SuccessResponse({
        message: 'Cart updated',
        metadata: result,
      }).send(res)
    } catch (error) {
      next(error)
    }
  }

  // ❌ BAD: Business logic in controller
  static async badExample(req, res, next) {
    // Don't do business logic here!
    const cart = await CartRepo.findUserCart({ userId: req.user.userId })
    if (!cart.cart_products.length) {
      // This is business logic - should be in Service
      cart.cart_products.push(req.body.product)
    }
    return res.json(cart)
  }
}

export { CartController }
```

---

## Question: Should Service EVER call Model directly?

### Short Answer: NO

### Rule:
**Service -> Repository -> Model**

**NEVER:**
~~Service -> Model~~

### Why?
1. **Separation of concerns** - Service shouldn't know HOW data is accessed
2. **Reusability** - Repository methods can be reused across services
3. **Testing** - Easier to mock repositories than models
4. **Maintainability** - Database changes only affect Repository layer
5. **Consistency** - All data access goes through one place

### Exception (Rare):
Only in very simple CRUD apps where repository would just duplicate model calls. But even then, it's better to use Repository for consistency.

---

## Data Flow Example: Adding Product to Cart

```
1. HTTP Request
   POST /api/cart/add
   Body: { productId: '123', quantity: 2 }
   |
   v

2. CONTROLLER (cart.controller.js)
   - Validates request
   - Extracts userId from auth token
   - Calls CartService.addToCart()
   |
   v

3. SERVICE (cart.service.js)
   - Checks if cart exists (calls CartRepo.findUserCart)
   - Checks if product in cart (business logic)
   - Decides: create new or update existing
   - Calls CartRepo.createUserCart OR CartRepo.updateUserCartQuantity
   |
   v

4. REPOSITORY (cart.repo.js)
   - Executes database query
   - Uses CartModel to interact with MongoDB
   - Returns raw database result
   |
   v

5. MODEL (cart.model.js)
   - Mongoose schema defines structure
   - Database executes query
   - Returns document
```

---

## Common Mistakes to Avoid

### ❌ Service calling Model directly
```javascript
// BAD
class CartService {
  static async getCart({ userId }) {
    return await CartModel.findOne({ cart_userId: userId }) // ❌ Direct model access
  }
}
```

### ✅ Service calling Repository
```javascript
// GOOD
class CartService {
  static async getCart({ userId }) {
    return await CartRepo.findUserCart({ userId }) // ✅ Through repository
  }
}
```

---

### ❌ Repository with business logic
```javascript
// BAD
const addToCart = async ({ userId, product }) => {
  // ❌ Business logic in repository!
  const cart = await CartModel.findOne({ cart_userId: userId })
  if (!cart) {
    return await CartModel.create({ userId, products: [product] })
  }
  // This decision-making is business logic
  if (cart.products.some(p => p.id === product.id)) {
    return await CartModel.findOneAndUpdate(...)
  }
}
```

### ✅ Repository with pure queries
```javascript
// GOOD
const findUserCart = async ({ userId }) => {
  return await CartModel.findOne({ cart_userId: userId }) // ✅ Pure query
}

const createUserCart = async ({ userId, product }) => {
  return await CartModel.create({ userId, products: [product] }) // ✅ Pure create
}
```

---

### ❌ Controller with business logic
```javascript
// BAD
static async addToCart(req, res) {
  const cart = await CartService.getCart({ userId: req.user.id })
  // ❌ Business logic in controller!
  if (cart.products.length > 10) {
    return res.status(400).json({ error: 'Cart full' })
  }
  await CartService.addToCart(...)
}
```

### ✅ Controller delegating to Service
```javascript
// GOOD
static async addToCart(req, res) {
  // ✅ Just handle HTTP and delegate
  const result = await CartService.addToCart({
    userId: req.user.id,
    product: req.body.product
  })
  new SuccessResponse({ metadata: result }).send(res)
}
```

---

## Comparison with Java/Spring Boot

| Layer | Node.js (This Project) | Java/Spring Boot |
|-------|----------------------|------------------|
| **Model** | `cart.model.js` with Mongoose Schema | `@Entity` class with JPA |
| **Repository** | `cart.repo.js` with exported functions | `CartRepository extends JpaRepository` |
| **Service** | `cart.service.js` with static methods | `@Service` class with `@Autowired` |
| **Controller** | `cart.controller.js` or Express routes | `@RestController` with mappings |

### Key Similarities:
- Same layered architecture concept
- Same separation of concerns
- Repository Pattern works identically
- Data flow: Controller -> Service -> Repository -> Model

### Key Differences:
- **Node.js**: Uses exported functions and static methods
- **Java**: Uses dependency injection with annotations
- **Node.js**: Mongoose ORM for MongoDB
- **Java**: JPA/Hibernate ORM for SQL databases

---

## Summary: What Goes Where?

| Layer | Responsibility | Calls | Example |
|-------|---------------|-------|---------|
| **Model** | Schema definition | Nothing | `CartSchema`, field types |
| **Repository** | Database queries | Model only | `findOne()`, `create()`, `update()` |
| **Service** | Business logic | Repositories | Validation, orchestration, rules |
| **Controller** | HTTP handling | Services only | Request/response, auth |

---

## Best Practices

1. **Always use Repository from Service** - Never skip this layer
2. **Keep Repository methods generic** - Reusable across services
3. **Put business rules in Service** - Not in Repository or Controller
4. **Controller should be thin** - Just HTTP handling
5. **One Repository per Model** - Clear responsibility
6. **Service can call multiple Repositories** - Orchestration is OK
7. **Repository should NOT call other Repositories** - Keep it simple
8. **Use meaningful names** - `findUserCart`, not `getStuff`

---

## Final Answer: Service and Model

**Question: Should Service call Model directly?**

**Answer: NO, NEVER**

**Always follow:** `Service -> Repository -> Model`

This ensures:
- Clean architecture
- Easy testing
- Better maintainability
- Clear separation of concerns
- Reusable data access layer
