# Builder Pattern Implementation in Discount Service

## Overview

This document explains the refactoring of the Discount Service using the **Builder Pattern** to reduce code duplication, improve maintainability, and enhance readability.

## Table of Contents

1. [What is the Builder Pattern?](#what-is-the-builder-pattern)
2. [Problems Solved](#problems-solved)
3. [Implementation Details](#implementation-details)
4. [Before vs After Comparison](#before-vs-after-comparison)
5. [Benefits](#benefits)
6. [Usage Examples](#usage-examples)

---

## What is the Builder Pattern?

The Builder Pattern is a creational design pattern that provides a flexible solution to constructing complex objects. It separates the construction of a complex object from its representation, allowing the same construction process to create different representations.

### Key Characteristics:
- **Fluent Interface**: Method chaining for readable code
- **Step-by-step construction**: Build objects incrementally
- **Encapsulation**: Complex construction logic hidden inside builders
- **Reusability**: Same builder can be used across multiple places


## Implementation Details

Three builder classes:

### 1. DiscountValidator Builder
**Location**: `src/builders/discount.validator.builder.js`

**Purpose**: Centralize all discount validation logic

**Methods**:
- `validateExists()` - Check if discount exists
- `validateActive()` - Check if discount is active
- `validateDateRange()` - Validate current date within discount period
- `validateMaxUses()` - Check remaining uses
- `validateMinOrderValue(totalOrder)` - Validate minimum order requirement
- `validateUserUsageLimit(userId)` - Check per-user usage limits
- `validateDateRangeForCreation(startDate, endDate)` - Validate dates for creation

### 2. DiscountQueryBuilder
**Location**: `src/builders/discount.query.builder.js`

**Purpose**: Eliminate repetitive product query construction

**Methods**:
- `setShopId(shopId)` - Filter by shop
- `setPublishedOnly()` - Filter published products only
- `setProductIds(productIds)` - Filter specific products
- `setLimit(limit)` - Set result limit
- `setPage(page)` - Set pagination
- `setSort(sort)` - Set sorting order
- `setSelect(fields)` - Select specific fields
- `execute()` - Execute the query

### 3. DiscountBuilder
**Location**: `src/builders/discount.builder.js`

**Purpose**: Simplify discount object creation

**Methods**:
- `setName()`, `setDescription()`, `setType()`, `setCode()`, `setValue()`
- `setMinOrderValue()`, `setMaxValue()`, `setStartDate()`, `setEndDate()`
- `setMaxUses()`, `setUsesCount()`, `setMaxUserUses()`, `setShopId()`
- `setIsActive()`, `setAppliesTo()`
- `build()` - Return the constructed discount object

---

## Before vs After Comparison

### Example 1: Creating a Discount Code

#### ❌ **BEFORE** (Lines 51-69)

```javascript
const newDiscount = await DiscountModel.create({
  discount_name: name,
  discount_description: description,
  discount_type: type,
  discount_code: code,
  discount_value: value,
  discount_min_order_value: min_order_value || 0,
  discount_max_value: max_value,
  discount_start_date: new Date(startDate),
  discount_end_date: new Date(endDate),
  discount_max_uses: max_uses || 1,
  discount_uses_count: uses_count || 0,
  discount_users_used: [],
  discount_max_user_uses: max_uses_per_user || 1,
  discount_shopId: shopId,
  discount_is_ative: is_active !== undefined ? is_active : true, // TYPO!
  discount_applies_to: applies_to || 'all_products',
  discount_product_ids: applies_to === 'specific_products' ? product_ids : [],
})
```

**Problems**:
- 18 lines of verbose field mapping
- Easy to make typos (note the `discount_is_ative` bug)
- Repeated default value logic (`|| 0`, `|| 1`)
- Hard to see the overall structure

#### ✅ **AFTER** (Lines 57-76)

```javascript
const discountData = new DiscountBuilder()
  .setName(name)
  .setDescription(description)
  .setType(type)
  .setCode(code)
  .setValue(value)
  .setMinOrderValue(min_order_value)
  .setMaxValue(max_value)
  .setStartDate(startDate)
  .setEndDate(endDate)
  .setMaxUses(max_uses)
  .setUsesCount(uses_count)
  .setMaxUserUses(max_uses_per_user)
  .setShopId(shopId)
  .setIsActive(is_active)
  .setAppliesTo(applies_to, product_ids)
  .build()

const newDiscount = await DiscountModel.create(discountData)
```

**Improvements**:
- ✨ Fluent, readable interface
- ✨ Default values handled inside builder
- ✨ No typos - field names encapsulated
- ✨ Self-documenting code
- ✨ Easy to add/remove fields

---

### Example 2: Product Query Construction

#### ❌ **BEFORE** (Lines 91-114)

```javascript
let products

if (discount_applies_to === 'all_products') {
  products = await ProductRepo.findAllProducts({
    filter: {
      product_shop: convertToObjectId(shopId),
      isPublished: true,
    },
    limit: +limit,
    page: +page,
    sort: 'ctime',
    select: ['product_name'],
  })
} else if (discount_applies_to === 'specific_products') {
  products = await ProductRepo.findAllProducts({
    filter: {
      _id: { $in: discount_product_ids },
      product_shop: convertToObjectId(shopId),
      isPublished: true,
    },
    limit: +limit,
    page: +page,
    sort: 'ctime',
    select: ['product_name'],
  })
}
```

**Problems**:
- 24 lines of duplicated query configuration
- Only difference is `_id: { $in: discount_product_ids }`
- Same parameters repeated in both branches
- Hard to maintain if query structure changes

#### ✅ **AFTER** (Lines 96-109)

```javascript
const queryBuilder = new DiscountQueryBuilder()
  .setShopId(shopId)
  .setPublishedOnly()
  .setLimit(limit)
  .setPage(page)
  .setSort('ctime')
  .setSelect(['product_name'])

if (discount_applies_to === 'specific_products') {
  queryBuilder.setProductIds(discount_product_ids)
}

const products = await queryBuilder.execute()
```

**Improvements**:
- ✨ 13 lines instead of 24 (46% reduction)
- ✨ No duplication - single query builder
- ✨ Conditional logic simplified to one line
- ✨ Easy to add new query options
- ✨ Reusable across the entire codebase

---

### Example 3: Discount Validation

#### ❌ **BEFORE** (Lines 145-180)

```javascript
if (!foundDiscount || !foundDiscount.discount_is_ative) { // TYPO!
  throw new NotFoundError('Discount code not found or inactive')
}

const {
  discount_is_active,
  discount_max_uses,
  discount_start_date,
  discount_end_date,
  discount_min_order_value
} = foundDiscount

if (!discount_is_active) {
  throw new BadRequestError('Discount code is inactive')
}

if (!discount_max_uses) {
  throw new BadRequestError('Discount code has reached its maximum uses')
}

if (new Date() < new Date(discount_start_date) || new Date() > new Date(discount_end_date)) {
  throw new BadRequestError('Discount code is not valid in this time range')
}

let totalAmount = 0
if (discount_min_order_value > 0) {
  totalOrder = products.reduce((acc, product) => { // MISSING 'const'!
    return acc + product.price * product.quantity
  }, 0)

  if (totalOrder < discount_min_order_value) {
    throw new BadRequestError(`Order total must be at least ${discount_min_order_value} to apply this discount`)
  }
}

if (discount_max_user_uses > 0) {
  const userUsesCount = discount_users_used.find((user) => user.userId === userId)
  if (userUsesCount && userUsesCount.count >= discount_max_user_uses) {
    throw new BadRequestError('You have reached the maximum uses for this discount code')
  }
}
```

**Problems**:
- 35+ lines of validation logic
- Repeated in multiple methods
- Contains bugs (typo, missing const)
- Hard to see all validations at a glance
- Mixing calculation with validation

#### ✅ **AFTER** (Lines 141-152)

```javascript
// Calculate total order value
const totalOrder = products.reduce((acc, product) => {
  return acc + product.price * product.quantity
}, 0)

// Validate discount using builder pattern - chain all validations
new DiscountValidator(foundDiscount)
  .validateActive()
  .validateMaxUses()
  .validateDateRange()
  .validateMinOrderValue(totalOrder)
  .validateUserUsageLimit(userId)
```

**Improvements**:
- ✨ 11 lines instead of 35+ (69% reduction)
- ✨ All validations in one readable chain
- ✨ No bugs - encapsulated logic
- ✨ Clear separation of concerns
- ✨ Easy to add/remove validations
- ✨ Reusable validation logic

---

### Example 4: Cancel Discount Code

#### ❌ **BEFORE** (Lines 217-226) - **BROKEN CODE!**

```javascript
const result = await DiscountModel.findOneAndUpdate(
  $pull:{
    discount_users_used: { userId: convertToObjectId(userId) }
  }
  $inc: {
    discountmaxuse :1
    discoutn usecoutn -1
  }
  return result
)
```

**Problems**:
- ❌ **SYNTAX ERRORS** - Invalid MongoDB update syntax
- ❌ Missing query parameter
- ❌ Missing commas and braces
- ❌ Typos in field names
- ❌ Code won't run at all!

#### ✅ **AFTER** (Lines 191-211)

```javascript
// Validate discount using builder pattern
new DiscountValidator(foundDiscount).validateActive()

const result = await DiscountModel.findOneAndUpdate(
  {
    discount_code: codeId,
    discount_shopId: convertToObjectId(shopId),
  },
  {
    $pull: {
      discount_users_used: userId,
    },
    $inc: {
      discount_max_uses: 1,
      discount_uses_count: -1,
    },
  },
  { new: true }
)

return result
```

**Improvements**:
- ✨ **FIXED** - Proper MongoDB syntax
- ✨ Correct query structure with filter, update, options
- ✨ Proper field names
- ✨ Added validation using builder
- ✨ Returns updated document

---

## Benefits

### 1. **Code Reduction**
- **Validation logic**: 69% reduction (35+ lines → 11 lines)
- **Query construction**: 46% reduction (24 lines → 13 lines)
- **Overall service file**: More concise and maintainable

### 2. **Bug Prevention**
- ✅ Fixed typo: `discount_is_ative` → `discount_is_active`
- ✅ Fixed missing `const` declaration
- ✅ Fixed broken MongoDB syntax
- ✅ Encapsulation prevents future typos

### 3. **Maintainability**
- Single source of truth for validation rules
- Easy to add new validations
- Changes propagate automatically
- Better separation of concerns

### 4. **Readability**
- Self-documenting code
- Fluent interfaces read like English
- Clear intent at each step
- Easier for new developers

### 5. **Testability**
- Builders can be unit tested independently
- Mock builders for service tests
- Test validation rules in isolation

### 6. **Extensibility**
- Add new validations without touching service
- Extend builders with new methods
- Compose validations differently per use case

---

## Usage Examples

### Using DiscountValidator

```javascript
// Simple validation
new DiscountValidator(discount)
  .validateExists()
  .validateActive()

// Chain multiple validations
new DiscountValidator(discount)
  .validateActive()
  .validateDateRange()
  .validateMaxUses()
  .validateMinOrderValue(1000)
  .validateUserUsageLimit('user123')
```

### Using DiscountQueryBuilder

```javascript
// Query all products for a shop
const products = await new DiscountQueryBuilder()
  .setShopId(shopId)
  .setPublishedOnly()
  .setLimit(20)
  .setPage(1)
  .execute()

// Query specific products
const specificProducts = await new DiscountQueryBuilder()
  .setShopId(shopId)
  .setPublishedOnly()
  .setProductIds(['id1', 'id2', 'id3'])
  .setSort('price')
  .setSelect(['product_name', 'price'])
  .execute()
```

### Using DiscountBuilder

```javascript
// Build a discount object
const discount = new DiscountBuilder()
  .setName('Summer Sale')
  .setCode('SUMMER2024')
  .setType('percentage')
  .setValue(20)
  .setMaxValue(100)
  .setStartDate('2024-06-01')
  .setEndDate('2024-08-31')
  .setShopId(shopId)
  .setIsActive(true)
  .setAppliesTo('all_products')
  .build()

// Create in database
await DiscountModel.create(discount)
```

---

## File Structure

```
src/
├── builders/
│   ├── discount.builder.js          # Discount object construction
│   ├── discount.query.builder.js     # Product query construction
│   └── discount.validator.builder.js # Validation logic
├── services/
│   └── discount.service.js           # Refactored service using builders
└── docs/
    └── builder-pattern-implementation.md # This document
```

---

## Key Takeaways

### Outstanding Features

1. **Fluent Interface** 🔗
   - Method chaining creates readable, self-documenting code
   - Reads like natural language

2. **DRY Principle** 🔄
   - No more copy-paste validation
   - Single source of truth

3. **Separation of Concerns** 📦
   - Validation logic separated from business logic
   - Query construction separated from usage

4. **Error Prevention** 🛡️
   - Encapsulation prevents typos
   - Type safety through methods
   - Consistent behavior

5. **Easy Testing** 🧪
   - Test builders independently
   - Mock easily in unit tests
   - Validate complex scenarios

6. **Scalability** 📈
   - Add features without modifying existing code
   - Reuse builders across services
   - Maintain consistency

---

## Migration Notes

When using the refactored discount service:

1. **No API changes** - All service methods maintain the same signatures
2. **Backward compatible** - Existing code calling the service works unchanged
3. **Internal improvements only** - Refactoring is transparent to consumers
4. **Better error messages** - Validation errors are more consistent
5. **Performance** - No performance impact, same database queries

---

## Future Enhancements

Potential improvements using the builder pattern:

1. **Conditional Validations**
   ```javascript
   validator
     .validateActive()
     .when(discount.type === 'percentage', v => v.validateMaxPercentage())
   ```

2. **Async Validations**
   ```javascript
   await validator
     .validateActive()
     .validateCodeUniqueness(code, shopId)
   ```

3. **Custom Error Messages**
   ```javascript
   validator
     .validateActive('This promotion has expired')
     .validateMaxUses('Sorry, this code is sold out')
   ```

4. **Builder Presets**
   ```javascript
   DiscountBuilder.createSeasonalSale()
   DiscountBuilder.createFlashDeal()
   DiscountBuilder.createFirstPurchaseDiscount()
   ```

---

## Conclusion

The Builder Pattern implementation in the Discount Service demonstrates how design patterns can:
- Reduce code duplication by 46-69%
- Fix critical bugs and syntax errors
- Improve readability and maintainability
- Enable easier testing and extensibility

This refactoring transforms repetitive, error-prone code into clean, maintainable, and reusable components.

---

**Last Updated**: 2025-12-05
**Author**: Development Team
**Related Files**:
- [discount.service.js](../src/services/discount.service.js)
- [discount.builder.js](../src/builders/discount.builder.js)
- [discount.query.builder.js](../src/builders/discount.query.builder.js)
- [discount.validator.builder.js](../src/builders/discount.validator.builder.js)
