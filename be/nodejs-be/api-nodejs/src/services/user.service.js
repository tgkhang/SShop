'use strict'

import { BadRequestError, ConflictRequestError } from '#core/error.response.js'
import EmailService from '#services/email.service.js'
import OtpService from '#services/otp.service.js'
import { UserRepo } from '#models/repository/user.repo.js'

class UserService {
  async createNewUser({
    email = null,
    captcha = null, //optional
  }) {
    if (!email) throw new BadRequestError('Email is required')

    const normalizedEmail = String(email).trim().toLowerCase()
    const user = await UserRepo.findOneByEmail({ email: normalizedEmail })

    if (user) {
      throw new ConflictRequestError('Email already exists')
    }

    await EmailService.sendEmailToken({ email: normalizedEmail })

    return {
      email: normalizedEmail,
      message: 'Verification email has been sent',
    }
  }

  async checkRegisterEmailTaken({ email = null }) {
    if (!email) throw new BadRequestError('Email is required')

    const normalizedEmail = String(email).trim().toLowerCase()
    const user = await UserRepo.findOneByEmail({ email: normalizedEmail })

    return {
      email: normalizedEmail,
      isTaken: !!user,
    }
  }

  async verifyEmailToken({ email = null, token = null }) {
    if (!email || !token) {
      throw new BadRequestError('Email and token are required')
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    await OtpService.verifyToken({ email: normalizedEmail, token })

    const foundUser = await UserRepo.findOneByEmail({ email: normalizedEmail })
    if (foundUser) {
      if (foundUser.usr_status !== 'active') {
        await UserRepo.updateStatusByEmail({ email: normalizedEmail, status: 'active' })
      }

      return {
        email: normalizedEmail,
        verified: true,
      }
    }

    const nextUserId = await UserRepo.getNextUserId()
    const slug = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()

    await UserRepo.createUser({
      usr_id: nextUserId,
      usr_slug: slug,
      usr_name: slug,
      usr_email: normalizedEmail,
      usr_status: 'active',
    })

    return {
      email: normalizedEmail,
      verified: true,
    }
  }
}

export default new UserService()
