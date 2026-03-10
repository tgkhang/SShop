'use strict'

import crypto from 'crypto'
import { BadRequestError } from '#core/error.response.js'
import { OtpLogModel } from '#models/otp.model.js'

class OtpService {
    async generateToken() {
        return crypto.randomBytes(24).toString('hex')
    }

    async createNewToken({ email }) {
        const token = await this.generateToken()

        await OtpLogModel.deleteMany({ otp_email: email })

        await OtpLogModel.create({
            otp_token: token,
            otp_email: email,
            otp_status: 'pending',
        })

        return token
    }

    async verifyToken({ email, token }) {
        const otp = await OtpLogModel.findOne({ otp_email: email, otp_token: token }).lean().exec()
        if (!otp) throw new BadRequestError('Invalid or expired verification token')

        await OtpLogModel.deleteOne({ _id: otp._id })
        return true
    }
}


export default new OtpService()
