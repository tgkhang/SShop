import express from 'express'
import accessController from '#controllers/access.controller.js'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authentication } from '#auth/authUtils.js'

const router = express.Router()

router.post('/signup', asyncHandler(accessController.signUp))

router.post('/login', asyncHandler(accessController.login))

router.use(authentication)

router.post('/logout', asyncHandler(accessController.logout))
router.post('/refresh-token', asyncHandler(accessController.handlerRefreshToken))

export const accessRouter = router
