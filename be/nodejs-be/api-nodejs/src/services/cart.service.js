'use strict'

import { NotFoundError } from '#core/error.response.js'
import { ProductModel } from '#models/product.model.js'
import { CartRepo } from '#models/repository/cart.repo.js'
import { ProductRepo } from '#models/repository/product.repo.js'

// user
// add product to cart
// reduce product quantity
// increase product quantity
// get cart
// delete cart
// delete cart item

class CartService {
  static async addToCart({ userId, product = {} }) {
    // Check if user cart exists
    const userCart = await CartRepo.findUserCart({ userId })

    if (!userCart) {
      // No cart exists, create new cart with product
      return await CartRepo.createUserCart({ userId, product })
    }

    // Cart exists, check if product already in cart
    const productExists = userCart.cart_products.some(
      (item) => item.productId === product.productId
    )

    if (!productExists) {
      // Product not in cart, add it
      return await CartRepo.createUserCart({ userId, product })
    }

    // Product exists in cart, update quantity
    return await CartRepo.updateUserCartQuantity({ userId, product })
  }

  // update cart
  /*
  shop_order_ids: [
    {
      shopId: '',
      item_products: [
        {
          quantity, price, shopId, old_quantity, productId
        }
      ]
    }
  ]
  */
  static async updateCart({ userId, shop_order_ids = [] }) {
    const { productId, quantity, old_quantity, shopId } = shop_order_ids[0]?.item_products[0] || {}

    // Check if product exists in the product collection
    const foundProduct = await ProductRepo.getProductById({
      productId,
      model: ProductModel,
      unSelect: [],
    })
    if (!foundProduct) throw new NotFoundError('Product not found')

    // Verify product belongs to the correct shop
    if (foundProduct.product_shop.toString() !== shopId) {
      throw new NotFoundError('Product does not belong to this shop')
    }

    // If quantity is 0, delete product from cart
    if (quantity === 0) {
      return await CartRepo.deleteCartItem({ userId, productId })
    }

    // Update cart with quantity difference
    return await CartRepo.updateUserCartQuantity({
      userId,
      product: { productId, quantity: quantity - old_quantity },
    })
  }

  static async getListCartByUserId({ userId }) {
    return await CartRepo.findUserCart({ userId })
  }

  static async deleteCartItem({ userId, productId }) {
    return await CartRepo.deleteCartItem({ userId, productId })
  }

  static async clearCart({ userId }) {
    return await CartRepo.deleteUserCart({ userId })
  }
}

export { CartService }
