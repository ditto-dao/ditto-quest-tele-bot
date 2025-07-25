# Ditto Quest Telegram Bot Server

A comprehensive Telegram bot server that serves as the central hub for the Ditto Games ecosystem, featuring game interface management, Telegram Stars payment processing, and dynamic sticker pack generation for the Ditto Quest idle RPG game.

## 🎮 Project Overview

The Ditto Quest Telegram Bot Server is a critical component of the Ditto Games ecosystem that provides:

- **Game Console Interface**: Seamless access to Ditto Quest and Ditto Guess games through Telegram Mini Apps
- **Payment Processing**: Telegram Stars payment handling with real-time webhook forwarding to the main game server
- **Sticker Pack Management**: Telegram API integration for creating and updating personalized sticker packs with images generated by the main game server
- **User Engagement**: Broadcast messaging system for community announcements and events
- **Multi-Game Ecosystem**: Unified entry point for all Ditto-powered games

## 🚀 Key Features

### Game Integration
- **Ditto Quest Access**: Direct TMA (Telegram Mini App) integration for the idle RPG
- **Ditto Guess Integration**: Secondary game access with unified user experience
- **Development Environment**: Separate dev environment for testing and development

### Payment System
- **Telegram Stars Processing**: Native Telegram payment handling for in-game purchases
- **Real-time Webhooks**: Instant payment verification and forwarding to game servers
- **Purchase Validation**: Pre-checkout query handling with error recovery

### Sticker Pack Management
- **Telegram API Integration**: Receives generated sticker images from the main game server
- **Personalized Packs**: Creates unique sticker sets per user with custom naming
- **Image Processing**: Handles base64 image data received from the game server
- **Pack Management**: Automatic updates to existing sticker packs

### Admin Features
- **Broadcast System**: Message broadcasting to user base with admin controls
- **Test Environment**: Separate testing channels for safe deployment
- **User Analytics**: Community engagement tracking and management

## 🏗️ Architecture

### Core Components

```
├── Telegram Bot Interface
│   ├── Message Handling
│   ├── Inline Keyboard Management
│   └── Command Processing
├── Payment Processing Engine
│   ├── Stars Payment Handling
│   ├── Webhook Integration
│   └── Transaction Validation
├── Sticker Pack Service
│   ├── Telegram API Integration
│   ├── Image Data Processing
│   └── Pack Management
└── Express API Server
    ├── RESTful Endpoints
    ├── Health Monitoring
    └── External Integration
```

### Data Flow

1. **User Interaction**: Users interact with bot via Telegram interface
2. **Payment Processing**: Stars payments captured and forwarded to game server
3. **Sticker Pack Creation**: Main game server generates sticker images and sends to bot for Telegram API processing
4. **Real-time Updates**: Instant communication between bot and game systems

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- Telegram Bot Token (dev and production)
- Game server endpoints for webhook integration

### Environment Variables

Create a `.env` file with the following configuration:

```bash
# Environment
NODE_ENV=development # or 'prod'
EXPRESS_PORT=3001

# Bot Configuration
BOT_TOKEN_DEV=your_development_bot_token
BOT_TOKEN_PROD=your_production_bot_token
ADMIN_TELE_IDS="admin_id_1 admin_id_2"

# Game Links
TMA_LINK_DEV=https://your-dev-game-link.com
TMA_LINK_PROD=https://your-prod-game-link.com
TMA_LINK_TEST=https://your-test-game-link.com
DITTO_GUESS_LINK=https://your-ditto-guess-link.com

# Webhook Configuration
WEBHOOK_URL_DEV=https://your-dev-webhook.com/tg-stars/payment
WEBHOOK_URL_PROD=https://your-prod-webhook.com/tg-stars/payment
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ditto-quest-telegram-bot.git
   cd ditto-quest-telegram-bot
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the project**
   ```bash
   yarn build
   ```

5. **Start the server**
   ```bash
   # Development
   yarn dev
   
   # Production
   yarn start
   
   # With PM2 (recommended for production)
   yarn pm2
   ```

## 📡 API Documentation

### Telegram Bot Commands

- `/start` - Display welcome message with game access buttons
- `/broadcast` - Admin command for sending messages to all users
- `/broadcasttest` - Admin command for testing broadcast functionality

### HTTP Endpoints

#### Sticker Pack Creation
```http
POST /create-sticker-pack
Content-Type: application/json

{
  "telegramId": "user_telegram_id",
  "slimeId": 123,
  "images": [
    {
      "buffer": "base64_encoded_image_data",
      "emoji": "🟢"
    }
  ],
  "username": "optional_username"
}
```

**Response:**
```json
{
  "success": true,
  "stickerPackLink": "t.me/addstickers/pack_name",
  "stickerSetName": "pack_name"
}
```

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "telegram-bot-sticker-service"
}
```

### Webhook Events

The bot processes and forwards the following Telegram events:

- **successful_payment**: Telegram Stars payment completion
- **pre_checkout_query**: Payment pre-validation
- **message**: General message handling

## 🎯 Game Integration

### Ditto Quest Integration

The bot serves as the primary entry point for Ditto Quest, providing:

- TMA launch buttons for seamless game access
- Payment processing for in-game purchases
- Sticker pack creation from slime images generated by the main game server
- Community features and announcements

### Payment Flow

1. User initiates purchase in Ditto Quest
2. Game server creates Stars invoice
3. User completes payment through Telegram
4. Bot receives payment confirmation
5. Bot forwards payment data to game server webhook
6. Game server processes purchase and updates user account

### Sticker Pack Creation Flow

1. Main Ditto Quest server generates slime sticker images
2. Game server sends image data to bot via API endpoint
3. Bot processes base64 image data and creates/updates Telegram sticker pack
4. Bot sends sticker pack link to user via Telegram
5. User can add stickers to their Telegram collection

## 🚀 Deployment

### Production Deployment

The project includes PM2 configuration for production deployment:

```bash
# Build and deploy with PM2
yarn pm2

# Monitor processes
pm2 status
pm2 logs "Ditto Quest Telegram Bot"
```

### PM2 Configuration

The `pm2.config.json` includes:
- Automatic process restart on failure
- Environment variable management
- Log file configuration
- Node.js version specification

## 🔧 Development

### Available Scripts

```bash
# Development server with hot reload
yarn dev

# Production build
yarn build

# Production server
yarn start

# PM2 production deployment
yarn pm2

# PM2 development deployment
yarn pm2-dev

# Broadcast message utility
yarn broadcast-msg
```