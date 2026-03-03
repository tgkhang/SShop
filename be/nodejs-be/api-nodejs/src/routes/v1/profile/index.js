import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'
import ProfileController from '#controllers/profile.controller.js'
import { grantAccess } from '#middlewares/rbac'

const router = express.Router()

//router.use(authenticationV2)

// admin
router.get('/viewAllProfile', grantAccess('readAny', 'profile'), asyncHandler(ProfileController.getAllProfiles))

// shop
router.get('/viewOwnProfile', grantAccess('readOwn', 'profile'), asyncHandler(ProfileController.getOwnProfile))

export const profileRouter = router
