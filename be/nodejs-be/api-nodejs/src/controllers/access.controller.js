import { StatusCodes } from 'http-status-codes'
import { AccessService } from '#services/access.service.js'
import { CREATED, SuccessResponse } from '#core/success.response.js'

class AccessController {
  login = async (req, res, next) => {
    new SuccessResponse({
      metadata: await AccessService.login(req.body),
    }).send(res)
  }
  signUp = async (req, res, next) => {
    const result = await AccessService.signUp(req.body)
    // return res.status(StatusCodes.OK).json(result)

    new CREATED({
      message: 'Shop created successfully',
      metadata: result,
      options: {
        limit: 10,
      },
    }).send(res)
  }
  logout = async (req, res, next) => {
    new SuccessResponse({
      message: 'Logout successful',
      metadata: await AccessService.logout({
        keyStore: req.keyStore,
      }),
    }).send(res)
  }

  handlerRefreshToken = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get new token successfully',
      metadata: await AccessService.handlerRefreshToken({
        refreshToken: req.refreshToken,
        user: req.user,
        keyStore: req.keyStore,
      }),
    }).send(res)
  }
}

export default new AccessController()
