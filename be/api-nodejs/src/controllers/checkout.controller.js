import { SuccessResponse } from '#core/success.response.js'
import { CheckoutService } from '#services/checkout.service.js'

class CheckoutController {
  checkoutReview = async (req, res, next) => {
    new SuccessResponse({
      message: 'Checkout review retrieved successfully',
      metadata: await CheckoutService.checkoutReview({
        cartId: req.body.cartId,
        userId: req.user.userId,
        shop_order_ids: req.body.shop_order_ids,
      }),
    }).send(res)
  }

  orderByUser = async (req, res, next) => {
    new SuccessResponse({
      message: 'Order created successfully',
      metadata: await CheckoutService.orderByUser({
        cartId: req.body.cartId,
        userId: req.user.userId,
        shop_order_ids: req.body.shop_order_ids,
        user_address: req.body.user_address,
        user_payment: req.body.user_payment,
      }),
    }).send(res)
  }
}

export default new CheckoutController()
