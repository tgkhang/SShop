import { SuccessResponse } from '#core/success.response.js'
import { CartService } from '#services/cart.service.js'

class CartController {
  addToCart = async (req, res, next) => {
    new SuccessResponse({
      message: 'Add to cart successfully!',
      metadata: await CartService.addToCart({
        userId: req.user.userId,
        product: req.body,
      }),
    }).send(res)
  }

  updateCart = async (req, res, next) => {
    new SuccessResponse({
      message: 'Update cart successfully!',
      metadata: await CartService.updateCart({
        userId: req.user.userId,
        shop_order_ids: req.body.shop_order_ids,
      }),
    }).send(res)
  }

  deleteCartItem = async (req, res, next) => {
    new SuccessResponse({
      message: 'Delete cart item successfully!',
      metadata: await CartService.deleteCartItem({
        userId: req.user.userId,
        productId: req.body.productId,
      }),
    }).send(res)
  }

  getListCartItems = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get cart successfully!',
      metadata: await CartService.getListCartByUserId({
        userId: req.user.userId,
      }),
    }).send(res)
  }

  clearCart = async (req, res, next) => {
    new SuccessResponse({
      message: 'Clear cart successfully!',
      metadata: await CartService.clearCart({
        userId: req.user.userId,
      }),
    }).send(res)
  }
}

export default new CartController()
