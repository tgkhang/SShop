import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'
import cartController from '#controllers/cart.controller.js'

const router = express.Router()

// Authentication required for all cart routes
router.use(authenticationV2)

// Get user cart
router.get('/', asyncHandler(cartController.getListCartItems))

// Add product to cart
router.post('/', asyncHandler(cartController.addToCart))

// Update cart (quantity)
router.patch('/', asyncHandler(cartController.updateCart))

// Delete item from cart
router.delete('/', asyncHandler(cartController.deleteCartItem))

// Clear entire cart
router.delete('/clear', asyncHandler(cartController.clearCart))

export const cartRouter = router
