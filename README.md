# Discord DM-All Bot

This bot sends direct messages to members of your Discord server.

## ⚠️ WARNING ⚠️

Mass DMing server members is generally against Discord's Terms of Service and could result in your bot being banned. Use this code for educational purposes only.

## Setup

1. Create a Discord Application and Bot at the [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable the necessary intents (Server Members Intent and Message Content Intent)
3. Invite the bot to your server with proper permissions
4. Copy your bot token
5. Edit `config.json` with your bot token, server ID, and the message you want to send
6. Run `npm install` to install dependencies
7. Start the bot with `npm start`

## Configuration

Edit `config.json` to customize:
- `token`: Your Discord bot token
- `guildId`: The ID of your Discord server
- `message`: The message to send to members

## Running the Bot