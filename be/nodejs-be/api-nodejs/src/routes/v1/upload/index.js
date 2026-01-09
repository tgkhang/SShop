import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'
import uploadController from '#controllers/upload.controller.js'
import { uploadDisk } from '#configs/multer.config.js'

const router = express.Router()

router.use(authenticationV2)

router.post('/product', asyncHandler(uploadController.uploadFile))

// upload 1 image
router.post('/product/thumb', uploadDisk.single('file'), asyncHandler(uploadController.uploadFileLocal))

export const uploadRouter = router
