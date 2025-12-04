import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'
import ProductController from '#controllers/product.controller.js'

const router = express.Router()

// Public routes (no authentication required)
router.get('/search/:keySearch', asyncHandler(ProductController.getListSearchProduct))
router.get('', asyncHandler(ProductController.findAllProducts))
router.get('/:product_id', asyncHandler(ProductController.findProduct))

// Authentication required for all product routes below
router.use(authenticationV2)

// Create new product
router.post('', asyncHandler(ProductController.createProduct))

//query
router.get('/drafts/all', asyncHandler(ProductController.getAllDraftsForShop))

router.get('/published/all', asyncHandler(ProductController.getAllPublishForShop))

router.put('/publish/:product_id', asyncHandler(ProductController.publishProductByShop))

router.put('/unpublish/:product_id', asyncHandler(ProductController.unPublishProductByShop))

//end query

export const productRouter = router
