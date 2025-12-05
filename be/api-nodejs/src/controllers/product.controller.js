import { SuccessResponse } from '#core/success.response.js'

// v1
// import { ProductService } from '#services/product.service.js'
// v2 super
import { ProductService } from '#services/product.service.super.js'

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

  updateProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Update product successfully!',
      metadata: await ProductService.updateProduct({
        type: req.body.product_type,
        productId: req.params.product_id,
        payload: {
          ...req.body,
          product_shop: req.user.userId,
        },
      }),
    }).send(res)
  }

  // query
  getAllDraftsForShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list drafts for shop successfully!',
      metadata: await ProductService.findAllDraftsForShop({
        product_shop: req.user.userId,
        limit: req.query.limit,
        skip: req.skip,
      }),
    }).send(res)
  }

  getAllPublishForShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list published for shop successfully!',
      metadata: await ProductService.findAllPublishForShop({
        product_shop: req.user.userId,
        limit: req.query.limit,
        skip: req.skip,
      }),
    }).send(res)
  }

  publishProductByShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Publish product successfully!',
      metadata: await ProductService.publishProductByShop({
        product_shop: req.user.userId,
        product_id: req.params.product_id,
      }),
    }).send(res)
  }

  unPublishProductByShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Unpublish product successfully!',
      metadata: await ProductService.unPublishProductByShop({
        product_shop: req.user.userId,
        product_id: req.params.product_id,
      }),
    }).send(res)
  }

  getListSearchProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Search products successfully!',
      metadata: await ProductService.searchProductByUser({
        keySearch: req.params.keySearch,
      }),
    }).send(res)
  }

  findAllProducts = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get all products successfully!',
      metadata: await ProductService.findAllProducts(req.query),
    }).send(res)
  }

  findProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get product successfully!',
      metadata: await ProductService.findProduct({
        product_id: req.params.product_id,
      }),
    }).send(res)
  }

  // end query
}

export default new ProductController()
