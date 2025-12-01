import { StatusCodes } from 'http-status-codes'
import { AccessService } from '#services/access.service.js'
import { CREATED } from '#core/success.response'

class AccessController {
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
}

export default new AccessController()
