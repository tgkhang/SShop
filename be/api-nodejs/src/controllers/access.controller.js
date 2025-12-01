import { StatusCodes } from 'http-status-codes'
import { AccessService } from '../services/access.service.js'

class AccessController {
  signUp = async (req, res, next) => {
    try {
      const result = await AccessService.signUp(req.body)

      return res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export default new AccessController()
