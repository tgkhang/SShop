'use strict'

import { env } from '#configs/environment.js'
import { BadRequestError } from '#core/error.response.js'
import { sendMail } from '#dbs/init.nodemailer.js'
import OtpService from '#services/otp.service.js'
import TemplateService from '#services/template.service.js'
import { replacePlaceholder } from '#utils/index.js'
import { htmlEmail } from '#utils/template.html.js'


class EmailService {
  async sendEmailToken({ email }) {
    if (!env.MAIL_HOST || !env.MAIL_USER || !env.MAIL_PASSWORD) {
      throw new BadRequestError('Mail server is not configured')
    }

    const token = await OtpService.createNewToken({ email })

    let templateHtml = htmlEmail()
    try {
      const template = await TemplateService.getTemplateByName({ tem_name: 'HTML_EMAIL_TOKEN' })
      templateHtml = template.tem_html
    } catch (error) {
      // Fallback to local HTML template when DB template does not exist.
    }

    const appPort = env.LOCAL_DEV_APP_PORT || env.PORT || 3000
    const verifyLink = `http://localhost:${appPort}/v1/user/verify-email?token=${token}&email=${encodeURIComponent(email)}`

    const content = replacePlaceholder(templateHtml, {
      link_verify: verifyLink,
      app_name: 'SShop',
      email,
    })

    const info = await this.sendEmailVerifyLink({
      html: content,
      toEmail: email,
      subject: 'Verify your email address',
      text: `Verify your email by opening this link: ${verifyLink}`,
    })

    return {
      email,
      messageId: info?.messageId,
      accepted: info?.accepted || [],
    }
  }

  async sendEmailVerifyLink({ html, toEmail, subject = 'Verify your email', text = '' }) {
    return await sendMail({
      to: toEmail,
      subject,
      html,
      text,
    })
  }
}

export default new EmailService()
