import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { acessRouter } from '#routes/v1/access/index.js'
import { apiKey, permission } from '#auth/checkAuthen.js'
const Router = express.Router()

// Check APIv1 status
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'API is running' })
})

// check api
Router.use(apiKey)

// permission
Router.use(permission('read'))

Router.use('/shop', acessRouter)

export const APIs_V1 = Router
