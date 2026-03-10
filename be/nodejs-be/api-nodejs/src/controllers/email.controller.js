'use strict'

import { SuccessResponse } from '#core/success.response.js'
import EmailService from '#services/email.service.js'
import TemplateService from '#services/template.service.js'

class EmailController {
  sendVerifyEmailToken = async (req, res, next) => {
    new SuccessResponse({
      message: 'Send verification email successfully',
      metadata: await EmailService.sendEmailToken({
        ...req.body,
      }),
    }).send(res)
  }

  newTemplate = async (req, res, next) => {
    new SuccessResponse({
      message: 'Create new template successfully!',
      metadata: await TemplateService.createNewTemplate({
        ...req.body,
      }),
    }).send(res)
  }
}

export default new EmailController()
