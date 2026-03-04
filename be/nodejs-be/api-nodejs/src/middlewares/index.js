import { LoggerService } from '#services/logger.service.js'

// function to push to logger log discord
const pushToDiscordLogger = async (req, res, next) => {
  try {
    const reqInfo = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        authorization: req.headers['authorization'] ? '[PRESENT]' : '[ABSENT]',
      },
      body: req.body,
      query: req.query,
    }

    // Capture status code after response is sent
    res.on('finish', () => {
      LoggerService.sendToDiscord({
        reqInfo,
        resInfo: { statusCode: res.statusCode },
      })
    })
    
    next()
  } catch (error) {
    // logger errors should never block the request
    console.error('[pushToDiscordLogger] Error:', error.message)
    next()
  }
}

export { pushToDiscordLogger }
