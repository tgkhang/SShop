'use strict'

import { StatusCodes } from 'http-status-codes'

class SuccessResponse {
  constructor({ message, statusCode = StatusCodes.OK, reasonStatusCode = StatusCodes.CREATED, metadata = {} }) {
    this.message = message || 'Success'
    this.statusCode = statusCode
    this.reasonStatusCode = reasonStatusCode
    this.metadata = metadata
  }

  send(res, headers = {}) {
    return res.status(this.statusCode).json(this)
  }
}

class OK extends SuccessResponse {
  constructor({ message = 'OK', metadata = {} } = {}) {
    super({ message, statusCode: StatusCodes.OK, reasonStatusCode: StatusCodes.OK, metadata })
  }
}

class CREATED extends SuccessResponse {
  constructor({ options = {}, message = 'Created', metadata = {} } = {}) {
    super({ message, statusCode: StatusCodes.CREATED, reasonStatusCode: StatusCodes.CREATED, metadata })
    this.options = options
  }
}

export { SuccessResponse, OK, CREATED }
