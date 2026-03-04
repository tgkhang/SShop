import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
// import { authenticationV2 } from '#auth/authUtils.js'
import { RBACController } from '#controllers/rbac.controller.js'
const router = express.Router()

//router.use(authenticationV2)

router.post('/createRole', asyncHandler(RBACController.createRole))
router.post('/createResource', asyncHandler(RBACController.createResource))
router.get('/listRoles', asyncHandler(RBACController.listRole))
router.get('/listResources', asyncHandler(RBACController.listResource))

export const rbacRouter = router
