# Postback Backend

This is the backend server for handling postback functionality in the Game Pro application.

## Features

- **Postback Receiver**: Receives and stores postback requests from external sources
- **Postback Sender**: Proxy service to send postbacks to external URLs (avoiding CORS issues)
- **Postback Testing**: Automated testing of postback URLs with configurable intervals
- **API Management**: API key generation and rate limiting
- **Game Management**: CRUD operations for game offers
- **Email Services**: Send emails with configurable SMTP settings

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Postback Endpoints

- `GET /proxy-postback?target=<url>` - Proxy GET requests to external URLs
- `POST /proxy-postback` - Proxy POST requests to external URLs
- `GET /api/received-postbacks` - Get all received postbacks
- `POST /api/receive-postback` - Receive a postback (used internally)
- `DELETE /api/received-postbacks` - Clear all postbacks

### Game Management

- `GET /api/games` - Get all games
- `POST /api/games` - Add a new game
- `PUT /api/games/:id` - Update a game
- `DELETE /api/games/:id` - Delete a game
- `POST /api/games/bulk` - Bulk add games

### API Keys

- `GET /api/apikeys` - Get all API keys
- `POST /api/apikeys` - Generate a new API key
- `PATCH /api/apikeys/:key` - Rename an API key
- `DELETE /api/apikeys/:key` - Delete an API key

### Public API (requires API key)

- `GET /api/public/games` - Get games (requires x-api-key header)
- `GET /api/public/postbacks` - Get postbacks (requires x-api-key header)
- `GET /api/public/users` - Get user stats (requires x-api-key header)

## Configuration

The server uses JSON files for data storage:

- `postbacks.json` - Stores received postbacks
- `games.json` - Stores game/offer data
- `api_keys.json` - Stores API keys
- `email_config.json` - Email configuration
- `campaigns.json` - Campaign data
- `offer_schedules.json` - Scheduled offers

## Environment Variables

Create a `.env` file in the postback_backend directory with:

```
PORT=5000
NODE_ENV=development
```

## CORS Configuration

The server is configured to accept requests from `http://localhost:3000` (React frontend). Update the CORS configuration in `server.js` if your frontend runs on a different port.

## Rate Limiting

- Public API endpoints are rate-limited to 10 requests per API key per day
- No rate limiting on internal endpoints

## Proxy Functionality

The proxy endpoints help avoid CORS issues when sending postbacks to external URLs from the frontend. They forward requests and log the responses for debugging purposes.
