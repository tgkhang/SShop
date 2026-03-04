import { env } from '#configs/environment.js'
import { Client, GatewayIntentBits } from 'discord.js'

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

const token = env.DISCORD_BOT_TOKEN
client.login(token)

// test
client.on('messageCreate', (message) => {
  if (message.author.bot) return
  if (message.content === 'ping') {
    message.reply('pong')
  }
})
