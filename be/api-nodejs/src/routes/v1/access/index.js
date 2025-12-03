import express from 'express'
import accessController from '#controllers/access.controller.js'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'

const router = express.Router()

router.post('/signup', asyncHandler(accessController.signUp))

router.post('/login', asyncHandler(accessController.login))

router.use(authenticationV2)

router.post('/logout', asyncHandler(accessController.logout))
router.post('/refresh-token', asyncHandler(accessController.handlerRefreshToken))

export const accessRouter = router
