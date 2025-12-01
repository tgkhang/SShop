'use strict'

import { CONFLICT, StatusCodes } from 'http-status-codes'

// can use like or using library
// const StatusCode = {
//   FORBIDDEN: 403,
//   CONFLICT: 409,
// }
// const ReasonStatusCode = {
//   FORBIDDEN: ' Bad Request',
//   CONFLICT: ' Conflict Request',
// }

class ErrorReponse extends Error {
  constructor(statusCode, message) {
    super(message)
    // Assign the HTTP status code here
    this.statusCode = statusCode

    // Record the Stack Trace for easier debugging
    Error.captureStackTrace(this, this.constructor)
  }
}

class ConflictRequestError extends ErrorReponse {
  constructor(message, statusCode) {
    super(message || 'Conflict Request', statusCode || StatusCodes.CONFLICT)
  }
}

class BadRequestError extends ErrorReponse {
  constructor(message, statusCode) {
    super(message || 'Bad Request', statusCode || StatusCodes.BAD_REQUEST)
  }
}

export { ErrorReponse, ConflictRequestError, BadRequestError }
