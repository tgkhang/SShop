'use strict'

export const htmlEmail = () => {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Email Verification</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
    <h2>Verify your email</h2>
    <p>Hello {{email}},</p>
    <p>Click the button below to verify your email address for {{app_name}}:</p>
    <p>
      <a
        href="{{link_verify}}"
        style="display: inline-block; background: #0f766e; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none;"
      >
        Verify Email
      </a>
    </p>
    <p>If the button does not work, use this link:</p>
    <p>{{link_verify}}</p>
  </body>
</html>
`
}
