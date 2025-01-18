# OpenAI Telegram Bot

This repository contains a Telegram bot built with Node.js and TypeScript. The bot integrates with OpenAI's API to process and respond to messages.

## Requirements

- Node.js (v18.x or higher recommended)
- npm (Node Package Manager)
- An OpenAI API key
- A Telegram bot token

## Obtaining an OpenAI API Key

To use this bot, you'll need an API key from OpenAI. Follow these steps to get your key:

1. Visit [OpenAI's API platform](https://platform.openai.com/).
2. Sign up for an account or log in if you already have one.
3. Navigate to the [API keys section](https://platform.openai.com/settings/organization/api-keys) and generate a new key.

## Creating a Telegram Bot Token

To interact with Telegram's Bot API, you need a bot token. Here's how to create one:

1. Open Telegram and search for the "BotFather" user.
2. Start a chat and use the `/newbot` command to create a new bot.
3. Follow the instructions to set a name and username for your bot.
4. BotFather will provide a token; keep this token secure as it allows control over your bot.

## Setup

To set up and run the bot, follow these steps:

1. Clone or download the repository to your local machine.
2. Navigate to the bot's directory
3. Install the project dependencies by running the following command:

    ```bash
    npm install
    ```

4. Copy the .env.example file to a new file named `.env`.

    ```bash
    cp .env.example .env
    ```

5. Open the `.env` file and replace the placeholders with your OpenAI API key and Telegram bot token:

    ```env
    OPENAI_API_KEY='your_openai_api_key_here'
    TELEGRAM_BOT_TOKEN='your_telegram_bot_token_here'

    # List of authorized group IDs, comma separated
    ALLOWED_GROUP_IDS=
    ```  

6. Start the bot by running the following command:

    ```bash
    npm run dev
    ```

## References

- [OpenAI API Documentation](https://platform.openai.com/docs/overview)
- [Telegraf package](https://www.npmjs.com/package/telegraf)
- [Telegraf entities references](https://telegraf.js.org/)