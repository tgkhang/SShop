import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'
import checkoutController from '#controllers/checkout.controller.js'

const router = express.Router()

// Authentication required for all checkout routes
router.use(authenticationV2)

// Review checkout (calculate totals, discounts, shipping)
router.post('/review', asyncHandler(checkoutController.checkoutReview))

export const checkoutRouter = router
