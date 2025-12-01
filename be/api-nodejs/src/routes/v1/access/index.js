import express from 'express'
import accessController from '../../../controllers/access.controller.js'

const router = express.Router()

router.post('/signup', accessController.signUp)

export const acessRouter = router
