'use strict' // use strict to enforce stricter parsing and error handling in JavaScript

import { SuccessResponse } from '#core/success.response.js'
import UserService from '#services/user.service.js'

class UserController {
  createNewUser = async (req, res, next) => {
    new SuccessResponse({
      message: 'Create new user request accepted',
      metadata: await UserService.createNewUser({
        ...req.body,
      }),
    }).send(res)
  }

  checkRegisterEmailTaken = async (req, res, next) => {
    new SuccessResponse({
      message: 'Check register email status successfully',
      metadata: await UserService.checkRegisterEmailTaken({
        email: req.query.email,
      }),
    }).send(res)
  }

  verifyEmailToken = async (req, res, next) => {
    new SuccessResponse({
      message: 'Verify email successfully',
      metadata: await UserService.verifyEmailToken({
        email: req.body.email || req.query.email,
        token: req.body.token || req.query.token,
      }),
    }).send(res)
  }
}

export default new UserController()
