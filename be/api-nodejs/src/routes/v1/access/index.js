import express from 'express'
import accessController from '#controllers/access.controller.js'
import { asyncHandler } from '#middlewares/asyncHandler'

const router = express.Router()

router.post('/signup', asyncHandler(accessController.signUp))

export const acessRouter = router
