'use strict'

import { Client, GatewayIntentBits } from 'discord.js'
import { env } from '#configs/environment.js'

class DiscordLoggerService {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    })

    this.channelId = env.DISCORD_CHANNEL_ID

    this.client.on('ready', () => {
      console.log(`[LoggerService] Discord bot ready as ${this.client.user.tag}`)
    })

    this.client.login(env.DISCORD_BOT_TOKEN).catch((err) => {
      console.error('[LoggerService] Discord login failed:', err.message)
    })
  }

  /**
   * Send a plain text message to the Discord log channel.
   */
  sendMessage(message = '') {
    const channel = this.client.channels.cache.get(this.channelId)
    if (channel) {
      channel.send(message).catch(console.error)
    } else {
      console.error('[LoggerService] Channel not found:', this.channelId)
    }
  }

  /**
   * Send formatted HTTP request info to Discord.
   * @param {{ reqInfo: object, resInfo?: object }} payload
   */
  sendToDiscord({ reqInfo, resInfo = null }) {
    const lines = [
      '```',
      `[HTTP REQUEST]`,
      `Time     : ${new Date().toISOString()}`,
      `Method   : ${reqInfo.method}`,
      `URL      : ${reqInfo.url}`,
      `IP       : ${reqInfo.ip}`,
      `Headers  : ${JSON.stringify(reqInfo.headers, null, 2)}`,
      reqInfo.body && Object.keys(reqInfo.body).length
        ? `Body     : ${JSON.stringify(reqInfo.body, null, 2)}`
        : `Body     : (empty)`,
      reqInfo.query && Object.keys(reqInfo.query).length
        ? `Query    : ${JSON.stringify(reqInfo.query, null, 2)}`
        : null,
      resInfo ? `Status   : ${resInfo.statusCode}` : null,
      '```',
    ]
      .filter(Boolean)
      .join('\n')

    this.sendMessage(lines)
  }
}

// singleton
export const LoggerService = new DiscordLoggerService()
