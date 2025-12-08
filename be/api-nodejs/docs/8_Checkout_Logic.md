# Checkout Logic: Cart vs Flexible Checkout

## Overview

This document explains two different checkout implementation approaches and why this project uses the **Flexible Checkout** pattern.

---

## Two Checkout Patterns

### Pattern 1: Traditional Cart-Based Checkout

**How it works:**

```
User -> Add to Cart -> Cart Database -> Checkout -> Read from Cart -> Create Order
```

**Request Structure:**

```javascript
POST /v1/checkout/review
{
  "cartId": "abc123"
  // Backend reads products from cart database
}
```

---

### Pattern 2: Flexible Checkout (Current Implementation)

**How it works:**

```
User -> Select Products -> Frontend Sends Products -> Backend Validates -> Create Order
```

**Request Structure:**

```javascript
POST /v1/checkout/review
{
  "cartId": "abc123",  // Optional - just for reference/tracking
  "shop_order_ids": [
    {
      "shopId": "shop1",
      "shop_discounts": [...],
      "item_products": [
        { "productId": "p1", "quantity": 2, "price": 29.99 },
        { "productId": "p2", "quantity": 1, "price": 49.99 }
      ]
    }
  ]
}
```

## Comparison Table

| Feature                | Traditional Cart-Based   | Flexible Checkout (Current)   |
| ---------------------- | ------------------------ | ----------------------------- |
| **Data Source**        | Cart database            | Request body                  |
| **Cart Requirement**   | Required                 | Optional                      |
| **Flexibility**        | Low                      | High                          |
| **Buy Now**            | L Must add to cart first | Direct checkout               |
| **Partial Checkout**   | L All or nothing         | Select specific items         |
| **Multiple Carts**     | L One cart only          | Combine from multiple sources |
| **Frontend Control**   | Limited                  | Full control                  |
| **Backend Validation** | Always validates         | Always validates              |
| **Security**           | Same                     | Same                          |

---

## Pros & Cons

### Traditional Cart-Based Checkout

#### Pros:

1. **Simpler Request** - Only need cartId
2. **Single Source of Truth** - Cart database is authoritative
3. **Easier to Understand** - Straightforward flow
4. **Less Data Transfer** - Small request payload
5. **Cart Sync** - Cart always matches checkout

#### Cons:

1. **Less Flexible** - Can't checkout items not in cart
2. **No "Buy Now"** - Must add to cart first
3. **Can't Partial Checkout** - All items or nothing
4. **Extra Database Calls** - Must read cart every time
5. **Mobile App Issues** - Requires cart sync across devices

---

### Flexible Checkout (Current Implementation)

#### Pros:

1. ** Checkout only some items from cart (not all)**

   - User has 10 items in cart, checkout only 3
   - Frontend sends only the 3 selected items

2. ** Checkout items not in cart (direct buy)**

   - "Buy Now" button on product page
   - Skip cart entirely

   ```javascript
   // Product page "Buy Now" - no cart needed
   {
     "cartId": null,  // No cart
     "shop_order_ids": [
       {
         "item_products": [
           { "productId": "direct-buy", "quantity": 1 }
         ]
       }
     ]
   }
   ```

3. ** Checkout from multiple carts**

   - User has cart on mobile and desktop
   - Merge items from both

   ```javascript
   // Combine items from different sources
   {
     "shop_order_ids": [
       {
         "shopId": "shop1",
         "item_products": [
           { "productId": "from-mobile-cart", "quantity": 1 },
           { "productId": "from-desktop-cart", "quantity": 2 },
           { "productId": "from-wishlist", "quantity": 1 }
         ]
       }
     ]
   }
   ```

4. ** More flexibility for the frontend**

   - Frontend decides what to checkout
   - Backend validates and calculates
   - Supports complex UX scenarios

5. ** Multiple Shops in One Checkout**

   ```javascript
   {
     "shop_order_ids": [
       {
         "shopId": "shop1",
         "item_products": [...]
       },
       {
         "shopId": "shop2",
         "item_products": [...]
       }
     ]
   }
   ```

6. ** Discount Flexibility**
   - Apply different discounts per shop
   - Frontend controls which discounts to apply
   ```javascript
   {
     "shop_order_ids": [
       {
         "shopId": "shop1",
         "shop_discounts": [
           { "code": "SHOP1SAVE" }
         ],
         "item_products": [...]
       }
     ]
   }
   ```

#### Cons:

1. **Larger Request Payload** - Send all product data
2. **Frontend Responsibility** - Must construct request correctly
3. **Potential Confusion** - Cart vs checkout data mismatch
4. **More Complex Request** - Nested structure

---

## Use Cases for Flexible Checkout

### Use Case 1: Partial Cart Checkout

**Scenario:** User has 5 items in cart, only wants to buy 2 now

**Traditional:** L Must remove 3 items, checkout, then re-add them
**Flexible:** Select 2 items, checkout directly

```javascript
// Cart has: [A, B, C, D, E]
// User selects: [A, C]
POST /v1/checkout/review
{
  "cartId": "user-cart-123",
  "shop_order_ids": [{
    "item_products": [
      { "productId": "A", "quantity": 1 },
      { "productId": "C", "quantity": 2 }
    ]
  }]
}
// B, D, E remain in cart
```

---

### Use Case 2: Buy Now (Direct Purchase)

**Scenario:** User sees a product, clicks "Buy Now" without adding to cart

**Traditional:** L Must add to cart first, then checkout
**Flexible:** Checkout directly

```javascript
// User on product page, clicks "Buy Now"
POST /v1/checkout/review
{
  "cartId": null,  // No cart needed
  "shop_order_ids": [{
    "item_products": [
      { "productId": "PRODUCT_ID", "quantity": 1 }
    ]
  }]
}
```

---

### Use Case 3: Cross-Device Shopping

**Scenario:** User adds items on mobile, more on desktop, checkout on tablet

**Traditional:** L Need cart sync mechanism
**Flexible:** Frontend fetches all items, sends to checkout

```javascript
// Tablet combines items from mobile + desktop
POST /v1/checkout/review
{
  "shop_order_ids": [{
    "item_products": [
      { "productId": "from-mobile", "quantity": 1 },
      { "productId": "from-desktop", "quantity": 2 },
      { "productId": "from-wishlist", "quantity": 1 }
    ]
  }]
}
```

---

### Use Case 4: Multiple Sellers in One Order

**Scenario:** User buys from 3 different shops in single checkout

**Traditional:** L Difficult to handle multiple carts
**Flexible:** Multiple shop_order_ids

```javascript
POST /v1/checkout/review
{
  "shop_order_ids": [
    {
      "shopId": "shop-1",
      "shop_discounts": [{ "code": "SHOP1SAVE" }],
      "item_products": [...]
    },
    {
      "shopId": "shop-2",
      "shop_discounts": [],
      "item_products": [...]
    },
    {
      "shopId": "shop-3",
      "shop_discounts": [{ "code": "SHOP3DEAL" }],
      "item_products": [...]
    }
  ]
}
```

---

## Why cartId is in the Request?

You might wonder: **If we're using flexible checkout, why include cartId?**

### Reasons for Including cartId:

1. **Order Tracking**

   - Link order back to original cart
   - Analytics: "What cart led to this order?"

2. **Cart Management** (Future Enhancement)

   - After order creation, clear the cart
   - Or remove checked-out items from cart

3. **Fraud Prevention**

   - Validate user actually created this cart
   - Detect suspicious checkout patterns

4. **User Experience** (Future)
   - "Return to cart" after checkout
   - Save cart for later

### Current Implementation:

```javascript
static async checkoutReview({ cartId, userId, shop_order_ids }) {
  // Currently: cartId just validates cart exists
  const foundCart = await CartRepo.findActiveCartById({ cartId })
  if (!foundCart) throw new BadRequestError('Cart not found')

  // But we DON'T use cart data - we use shop_order_ids
  // This is intentional for flexibility!
}
```

### Optional Enhancement:

You could make cartId truly optional:

```javascript
static async checkoutReview({ cartId, userId, shop_order_ids }) {
  // Optional cart validation
  if (cartId) {
    const foundCart = await CartRepo.findUserCart({ userId })
    if (!foundCart) throw new BadRequestError('Cart not found')
  }

  // Continue with flexible checkout
  // Works with or without cart!
}
```

---

## Real-World Example Comparison

### Scenario: User wants to buy 2 items from a cart containing 5 items

#### Traditional Cart-Based:

**Step 1:** Remove unwanted items from cart

```javascript
DELETE /v1/cart
{ "productId": "item3" }
DELETE /v1/cart
{ "productId": "item4" }
DELETE /v1/cart
{ "productId": "item5" }
```

**Step 2:** Checkout

```javascript
POST /v1/checkout/review
{ "cartId": "abc123" }
// Checks out item1 and item2
```

**Step 3:** Re-add items (if user wants them back)

```javascript
POST /v1/cart
{ "productId": "item3", "quantity": 1 }
POST /v1/cart
{ "productId": "item4", "quantity": 1 }
POST /v1/cart
{ "productId": "item5", "quantity": 1 }
```

**Total:** 7 API calls, cart modified

---

#### Flexible Checkout (Current):

**Step 1:** Checkout selected items

```javascript
POST /v1/checkout/review
{
  "cartId": "abc123",
  "shop_order_ids": [{
    "item_products": [
      { "productId": "item1", "quantity": 1 },
      { "productId": "item2", "quantity": 1 }
    ]
  }]
}
// item3, item4, item5 remain in cart untouched
```

**Total:** 1 API call, cart unchanged

---

## Implementation Details

### Request Structure Explained

```javascript
{
  // Optional - for tracking and reference
  "cartId": "69364cebe2602728842d734e",

  // Required - products to checkout
  "shop_order_ids": [
    {
      // Which shop these products belong to
      "shopId": "692c89f99b99687d40001051",

      // Optional discount codes for this shop
      "shop_discounts": [
        {
          "shopId": "692c89f99b99687d40001051",
          "discountId": "6935ba38e62bc896939931d2",
          "code": "SUMMER20"
        }
      ],

      // Products to checkout from this shop
      "item_products": [
        {
          "productId": "693074669f21432cf5d9c941",
          "quantity": 2,
          "price": 29.99  // Client price - IGNORED by server
        },
        {
          "productId": "69326f1852fa45b5d0da17be",
          "quantity": 1,
          "price": 49.99  // Client price - IGNORED by server
        }
      ]
    }
    // Can have multiple shops here
  ]
}
```

### Response Structure Explained

```javascript
{
  // Original request data (echoed back)
  "shop_order_ids": [...],

  // Processed data with server validation
  "shop_order_ids_new": [
    {
      "shopId": "692c89f99b99687d40001051",
      "shop_discounts": [...],
      "priceRaw": 109.97,              // Before discount
      "priceApplyDiscount": 109.97,    // After discount
      "item_products": [
        {
          // Server-validated product data
          "product_name": "Actual Product Name",
          "product_price": 29.99,       // SERVER price
          "product_quantity": 100,      // Available stock
          "product_shop": "692c89f99b99687d40001051",
          "price": 29.99,               // SERVER price
          "quantity": 2,                // Requested quantity
          "_id": "693074669f21432cf5d9c941"
        }
      ]
    }
  ],

  // Final totals
  "checkout_orders": {
    "totalPrice": 109.97,      // Total before discount
    "feeShip": 0,              // Shipping fee
    "totalDiscount": 0,        // Total discount applied
    "totalCheckout": 109.97    // FINAL total to pay
  }
}
```

---

## Best Practices

### Do:

1. **Always validate on server** - Never trust client data
2. **Use server prices** - Ignore client-submitted prices
3. **Check stock availability** - Prevent over-selling
4. **Validate discount codes** - Check eligibility and limits
5. **Log checkout attempts** - For analytics and fraud detection
6. **Handle errors gracefully** - Inform user of issues

### Don't:

1. **Trust client prices** - Always use database prices
2. **Skip validation** - Even if data comes from cart
3. **Modify cart during checkout** - Keep cart intact
4. **Allow checkout of unavailable products** - Check stock
5. **Ignore authentication** - Always verify user

---
