import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'
import inventoryController from '#controllers/inventory.controller.js'

const router = express.Router()

router.use(authenticationV2)

router.post('/stock/add', asyncHandler(inventoryController.addStockToInventory))

export const inventoryRouter = router
