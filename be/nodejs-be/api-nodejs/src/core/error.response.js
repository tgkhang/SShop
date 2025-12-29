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
    super(statusCode || StatusCodes.CONFLICT, message || 'Conflict Request')
  }
}

class BadRequestError extends ErrorReponse {
  constructor(message, statusCode) {
    super(statusCode || StatusCodes.BAD_REQUEST, message || 'Bad Request')
  }
}

class AuthFailureError extends ErrorReponse {
  constructor(message, statusCode) {
    super(statusCode || StatusCodes.UNAUTHORIZED, message || 'Unauthorized')
  }
}

class NotFoundError extends ErrorReponse {
  constructor(message, statusCode) {
    super(statusCode || StatusCodes.NOT_FOUND, message || 'Not Found')
  }
}

class ForbiddenError extends ErrorReponse {
  constructor(message, statusCode) {
    super(statusCode || StatusCodes.FORBIDDEN, message || 'Forbidden')
  }
}

export { ErrorReponse, ConflictRequestError, BadRequestError, AuthFailureError, NotFoundError, ForbiddenError }
