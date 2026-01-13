import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'
import uploadController from '#controllers/upload.controller.js'
import { uploadDisk, uploadMemory } from '#configs/multer.config.js'

const router = express.Router()

router.use(authenticationV2)

// upload 1 image
router.post('/product/thumb', uploadDisk.single('file'), asyncHandler(uploadController.uploadFileLocal))

// s3
router.post('/product/bucket', uploadMemory.single('file'), asyncHandler(uploadController.uploadImageFromLocalToS3))

router.post('/product', asyncHandler(uploadController.uploadFile))

export const uploadRouter = router
