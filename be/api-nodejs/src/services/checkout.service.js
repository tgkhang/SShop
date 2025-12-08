'use strict'

import { BadRequestError } from '#core/error.response.js'
import { CartRepo } from '#models/repository/cart.repo.js'
import { ProductRepo } from '#models/repository/product.repo.js'
import { DiscountService } from './discount.service.js'

/*
{
  cartId: string,
  userId: string,
  shop_order_ids: [{
    shopId, shop_discount:[
    {
     shopId, discountId, code
    }], item_products[
    { price ,quanitty,productId}]
  }]
}
*/
class CheckoutService {
  static async checkoutReview({ cartId, userId, shop_order_ids }) {
    // check cart exists
    const foundCart = await CartRepo.findActiveCartById({ cartId })
    if (!foundCart) throw new BadRequestError('Cart not found')

    const checkout_orders = {
      totalPrice: 0,
      feeShip: 0,
      totalDiscount: 0,
      totalCheckout: 0,
    }

    const shop_order_ids_new = []

    // sum bill
    for (let i = 0; i < shop_order_ids.length; i++) {
      const { shopId, shop_discounts = [], item_products = [] } = shop_order_ids[i]

      const checkProductServer = await ProductRepo.checkProductByServer(item_products)

      if (!checkProductServer || checkProductServer.length <= 0)
        throw new BadRequestError('No products available for checkout')

      const checkoutPrice = checkProductServer.reduce((acc, product) => {
        return acc + product.price * product.quantity
      }, 0)

      checkout_orders.totalPrice += checkoutPrice
      const itemCheckout = {
        shopId,
        shop_discounts,
        priceRaw: checkoutPrice,
        priceApplyDiscount: checkoutPrice, // TO-DO: Apply discount later
        item_products: checkProductServer,
      }

      if (shop_discounts && shop_discounts.length > 0) {
        const { totalPrice = 0, discount = 0 } = await DiscountService.getDiscountAmount({
          code: shop_discounts[0].code,
          userId,
          shopId,
          products: checkProductServer,
        })
        checkout_orders.totalDiscount += discount

        if (discount > 0) {
          itemCheckout.priceApplyDiscount = checkoutPrice - discount
        }
      }

      checkout_orders.totalCheckout += itemCheckout.priceApplyDiscount

      shop_order_ids_new.push(itemCheckout)
    }
    return {
      shop_order_ids,
      shop_order_ids_new,
      checkout_orders,
    }
  }

  static async orderByUser({ shop_order_ids, cartId, userId, user_address = {}, user_payment = {} }) {
    const { shop_order_ids_new, checkout_orders } = await this.checkoutReview({
      cartId,
      userId,
      shop_order_ids: shop_order_ids ,
    })

    const products = shop_order_ids_new.flatMap(order => order.item_products)
    
  }
}

export { CheckoutService }
