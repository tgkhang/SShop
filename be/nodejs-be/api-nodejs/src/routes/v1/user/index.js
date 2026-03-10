import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import userController from '#controllers/user.controller.js'

const router = express.Router()

router.post('/new-user', asyncHandler(userController.createNewUser))
router.get('/check-email', asyncHandler(userController.checkRegisterEmailTaken))
router.post('/verify-email', asyncHandler(userController.verifyEmailToken))

export const userRouter = router
