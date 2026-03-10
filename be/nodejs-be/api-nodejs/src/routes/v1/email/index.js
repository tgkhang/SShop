import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import emailController from '#controllers/email.controller.js'

const router = express.Router()

router.post('/template', asyncHandler(emailController.newTemplate))
router.post('/send-verify', asyncHandler(emailController.sendVerifyEmailToken))

export const emailRouter = router
