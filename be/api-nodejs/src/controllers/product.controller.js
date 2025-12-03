import { SuccessResponse } from '#core/success.response.js'
import { ProductService } from '#services/product.service.js'

class ProductController {
  createProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Create product successfully!',
      metadata: await ProductService.createProduct(req.body.product_type, {
        ...req.body,
        product_shop: req.user.userId,
      }),
    }).send(res)
  }
}

export default new ProductController()
