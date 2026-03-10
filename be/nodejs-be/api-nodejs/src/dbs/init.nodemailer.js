'use strict'
import { env } from '#configs/environment.js'
import nodemailer from 'nodemailer'

const transport = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: Number(env.MAIL_PORT || 587),
  secure: Number(env.MAIL_PORT) === 465,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASSWORD,
  },
})

export const mailTransport = transport

export const sendMail = async ({ to, subject, html, text = '' }) => {
  return await transport.sendMail({
    from: env.MAIL_USER,
    to,
    subject,
    html,
    text,
  })
}
