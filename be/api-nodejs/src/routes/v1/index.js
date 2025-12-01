import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { acessRouter } from './access/index.js'
const Router = express.Router()

// Check APIv1 status
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'API is running' })
})

Router.use('/shop', acessRouter)

export const APIs_V1 = Router
