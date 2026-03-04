// example custom log
import winston from 'winston'
import 'winston-daily-rotate-file'
import { env } from '#configs/environment.js'
import { v4 as uuidv4 } from 'uuid'
const { printf } = winston.format

class MyLogger {
  constructor() {
    const formatPrint = printf(({ level, message, context, requestId, timestamp, metadata }) => {
      return `[${timestamp}]::[${level.toUpperCase()}]::[${context}]::[requestId: ${requestId}]::${message}::${metadata ? JSON.stringify(metadata) : ''}`
    })

    this.logger = winston.createLogger({
      level: env.LOG_LEVEL,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        formatPrint
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
          dirname: 'src/logs',
          filename: 'mylogger-%DATE%.info.log',
          datePattern: 'YYYY-MM-DD',
          zipArchive: true, // true: backup log files will be compressed to .gz
          maxSize: '20m', // rotate after 20MB
          maxFiles: '14d', // keep logs for 14 days
          format: winston.format.combine(
            winston.format.timestamp({
              format: 'YYYY-MM-DD HH:mm:ss',
            }),
            formatPrint
          ),
          level: 'info', // only log 'info' and above to file, 'debug' will be ignored in file
        }),
        new winston.transports.DailyRotateFile({
          dirname: 'src/logs',
          filename: 'mylogger-%DATE%.error.log',
          datePattern: 'YYYY-MM-DD',
          zipArchive: true, // true: backup log files will be compressed to .gz
          maxSize: '20m', // rotate after 20MB
          maxFiles: '14d', // keep logs for 14 days
          format: winston.format.combine(
            winston.format.timestamp({
              format: 'YYYY-MM-DD HH:mm:ss',
            }),
            formatPrint
          ),
          level: 'error',
        }),
      ],
    })
  }

  commonParams(params) {
    let context, req, metadata
    if (!Array.isArray(params)) {
      context = params
    } else {
      ;[context, req, metadata] = params
    }

    const requestId = req?.requestId || uuidv4() // generate a new requestId if not provided
    return { requestId, context, metadata }
  }

  log(message, params) {
    const paramLog = this.commonParams(params)
    const logObject = Object.assign(
      {
        message,
      },
      paramLog
    )
    this.logger.info(logObject)
  }

  error(message, params) {
    const paramLog = this.commonParams(params)
    const logObject = Object.assign(
      {
        message,
      },
      paramLog
    )
    this.logger.error(logObject)
  }
}

export const mylogger = new MyLogger()
