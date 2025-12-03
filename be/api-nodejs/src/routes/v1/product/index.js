import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authentication } from '#auth/authUtils.js'
import ProductController from '#controllers/product.controller.js'

const router = express.Router()

// Authentication required for all product routes
router.use(authentication)

// Create new product
router.post('', asyncHandler(ProductController.createProduct))

export const productRouter = router
