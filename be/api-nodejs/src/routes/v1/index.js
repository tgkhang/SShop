import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { accessRouter } from '#routes/v1/access/index.js'
import { apiKey, permission } from '#auth/checkAuthen.js'
import { productRouter } from './product/index.js'
import { discountRouter } from './discount/index.js'
import { cartRouter } from './cart/index.js'
import { checkoutRouter } from './checkout/index.js'
const Router = express.Router()

// Check APIv1 status
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'API is running' })
})

// check api
Router.use(apiKey)

// permission
Router.use(permission('read'))

Router.use('/shop', accessRouter)

Router.use('/product', productRouter)

Router.use('/discount', discountRouter)

Router.use('/cart', cartRouter)

Router.use('/checkout', checkoutRouter)

export const APIs_V1 = Router
