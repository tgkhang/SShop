import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'
import ProductController from '#controllers/product.controller.js'
import { cacheMiddleware } from '#middlewares/cache.middleware.js'
import { CACHE_PRODUCT } from '#configs/constants.js'

const router = express.Router()

// Public routes (no authentication required)
router.get('/search/:keySearch', asyncHandler(ProductController.getListSearchProduct))
router.get('', asyncHandler(ProductController.findAllProducts))
router.get('/:product_id', asyncHandler(ProductController.findProduct))

// Authentication required for all product routes below
router.use(authenticationV2)

// Create new product
router.post('', asyncHandler(ProductController.createProduct))

router.post('/spu/new', asyncHandler(ProductController.createNewSpu))

router.get(
  '/spu/:spu_id',
  cacheMiddleware({ keyPrefix: CACHE_PRODUCT.SPU, getKey: (req) => `${CACHE_PRODUCT.SPU}:${req.params.spu_id}` }),
  asyncHandler(ProductController.getOneSpu)
)

router.get(
  '/sku/:product_id/all',
  asyncHandler(ProductController.getAllSkusBySpuId)
)

router.get(
  '/sku/:product_id/:sku_id',
  cacheMiddleware({ keyPrefix: CACHE_PRODUCT.SKU, getKey: (req) => `${CACHE_PRODUCT.SKU}:${req.params.product_id}:${req.params.sku_id}` }),
  asyncHandler(ProductController.getOneSku)
)

// Update product
router.patch('/:product_id', asyncHandler(ProductController.updateProduct))

//query
router.get('/drafts/all', asyncHandler(ProductController.getAllDraftsForShop))

router.get('/published/all', asyncHandler(ProductController.getAllPublishForShop))

router.put('/publish/:product_id', asyncHandler(ProductController.publishProductByShop))

router.put('/unpublish/:product_id', asyncHandler(ProductController.unPublishProductByShop))

//end query

export const productRouter = router
