# Product Creation with Factory Pattern

For detailed comparison of factory pattern implementations, see: [factory-pattern-comparison.md](./factory-pattern-comparison.md)

## Dual-Collection Storage Architecture

### Reason to Create Documents in Both Product and Type-Specific Collections

When creating a new product, we create two documents:
1. One in the type-specific collection (clothes, electronics, furniture)
2. One in the general Products collection

### Advantages
- **Efficient Querying**
  - Fast general queries: "Get all products" → Query only Products collection
  - Type-specific queries: "Get all electronics with manufacturer='Sony'" → Query electronics collection directly
  - Indexed searches: You can create specialized indexes on type-specific fields

### Disadvantages
- Data duplication (some fields stored in both collections)
- Two write operations per product creation (potential consistency issues)
- More complex to maintain and debug


# Product Service Factory Pattern - Two Implementations Compared

## Overview

This document compares two different implementations of the Factory Pattern used in the product service layer. Both create products with dual-collection storage (general Product collection + type-specific collections).

---

## Version 1: Switch-Case Factory Pattern
**File:** [src/services/product.service.js](../src/services/product.service.js)

### Implementation
```javascript
class ProductFactory {
  static async createProduct(type, payload) {
    switch (type) {
      case 'Clothing':
        return new Clothing(payload).createProduct()
      case 'Electronics':
        return new Electronics(payload).createProduct()
      default:
        throw new BadRequestError(`Invalid product type: ${type}`)
    }
  }
}
```

### Characteristics
- **Simple and Direct**: Uses a switch statement to map product types to classes
- **Static Mapping**: Product types are hardcoded in the switch cases
- **Easy to Read**: Clear, straightforward logic that's easy to understand at a glance

### Pros
- ✅ Simple implementation, minimal code
- ✅ Easy to understand for beginners
- ✅ Good for small number of product types (2-5 types)
- ✅ No setup required, works immediately

### Cons
- ❌ **Not Scalable**: Adding new product types requires modifying the factory class
- ❌ **Violates Open/Closed Principle**: Must modify existing code to extend functionality
- ❌ **Tight Coupling**: Factory is tightly coupled to all product classes
- ❌ **No Runtime Extensibility**: Cannot add product types dynamically

### When to Use
- Small applications with fixed product types
- Proof of concept or MVP development
- When simplicity is more important than extensibility

---

## Version 2: Registry-Based Factory Pattern
**File:** [src/services/product.service.super.js](../src/services/product.service.super.js)

### Implementation
```javascript
class ProductFactory {
  static productRegistry = {}

  static registerProductType(type, classRef) {
    ProductFactory.productRegistry[type] = classRef
  }

  static async createProduct(type, payload) {
    const productClass = ProductFactory.productRegistry[type]
    if (productClass) {
      return new productClass(payload).createProduct()
    } else {
      throw new BadRequestError(`Invalid product type: ${type}`)
    }
  }
}

// Registration
ProductFactory.registerProductType('Clothing', Clothing)
ProductFactory.registerProductType('Electronics', Electronics)
ProductFactory.registerProductType('Furniture', Furniture)
```

### Characteristics
- **Dynamic Registry**: Uses a registry object to map types to classes
- **Registration Pattern**: Product types are registered separately from the factory logic
- **Extensible**: New types can be added without modifying the factory method

### Pros
- ✅ **Follows Open/Closed Principle**: Open for extension, closed for modification
- ✅ **Scalable**: Easy to add unlimited product types
- ✅ **Loose Coupling**: Factory doesn't need to know about specific product classes
- ✅ **Runtime Extensibility**: Can register new types at runtime (e.g., from plugins)
- ✅ **Better Separation of Concerns**: Registration is separated from creation logic
- ✅ **Plugin Architecture Ready**: Supports modular architecture where product types can be loaded dynamically

### Cons
- ❌ Slightly more complex to understand initially
- ❌ Requires registration step before use
- ❌ Small performance overhead (object lookup vs switch)

### When to Use
- Production applications expecting growth
- Systems with many product types (5+ types)
- Applications requiring plugin/module architecture
- When following SOLID principles is important
- Long-term maintainable codebases

---

## Syntax Comparison

### Adding a New Product Type

**Version 1 (Switch-Case):**
```javascript
// 1. Create the product class
class Furniture extends Product {
  async createProduct() {
    const newFurniture = await FurnitureModel.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    })
    if (!newFurniture) throw new BadRequestError('Create new furniture error')

    const newProduct = await super.createProduct(newFurniture._id)
    if (!newProduct) throw new BadRequestError('Create new product error')

    return newProduct
  }
}

// 2. Modify ProductFactory (REQUIRED)
class ProductFactory {
  static async createProduct(type, payload) {
    switch (type) {
      case 'Clothing':
        return new Clothing(payload).createProduct()
      case 'Electronics':
        return new Electronics(payload).createProduct()
      case 'Furniture':  // ← Must add this case
        return new Furniture(payload).createProduct()
      default:
        throw new BadRequestError(`Invalid product type: ${type}`)
    }
  }
}
```

**Version 2 (Registry-Based):**
```javascript
// 1. Create the product class
class Furniture extends Product {
  async createProduct() {
    const newFurniture = await FurnitureModel.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    })
    if (!newFurniture) throw new BadRequestError('Create new furniture error')

    const newProduct = await super.createProduct(newFurniture._id)
    if (!newProduct) throw new BadRequestError('Create new product error')

    return newProduct
  }
}

// 2. Register the type (Factory code unchanged!)
ProductFactory.registerProductType('Furniture', Furniture)
```

---

## Dual-Collection Storage Pattern

Both versions use the same dual-collection storage approach:

### Architecture
```
When creating a product:
1. Create document in type-specific collection (clothes, electronics, furniture)
   → Returns _id
2. Create document in general Products collection using that _id
   → Links both documents via shared _id
```

### Benefits
- **Efficient General Queries**: "Get all products" queries only the Products collection
- **Fast Type-Specific Queries**: "Get electronics by manufacturer" queries electronics collection directly
- **Specialized Indexing**: Each collection can have indexes optimized for its fields
- **Type Safety**: Type-specific validation rules per collection

### Disadvantages
- **Data Duplication**: Some fields stored in both collections
- **Two Write Operations**: Each product creation requires 2 database writes
- **Consistency Concerns**: Must ensure both writes succeed or roll back
- **Complexity**: More moving parts to maintain

---

## Recommendation

### Use Version 1 (Switch-Case) if:
- Building a small application or prototype
- Have 5 or fewer product types
- Product types are fixed and won't change frequently
- Team is less experienced with design patterns

### Use Version 2 (Registry-Based) if:
- Building a production e-commerce platform
- Expect to add many product types over time
- Want to support dynamic product type loading
- Following enterprise architecture patterns
- Building a system that may support plugins/extensions

---

## Migration Path

If you start with Version 1 and need to migrate to Version 2:

1. Add the registry system to ProductFactory
2. Register existing product types
3. Update the createProduct method to use the registry
4. Remove the switch statement
5. Test thoroughly

The product classes themselves don't need to change, making migration straightforward.
