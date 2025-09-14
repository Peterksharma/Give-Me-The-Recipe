# Give Me The Recipe (GMTR)

A full-stack recipe extraction application that can extract ingredients, instructions, and recipe titles from recipe websites.

## Architecture

- **Frontend**: Next.js with React and Tailwind CSS
- **Backend**: Express.js server with web scraping capabilities
- **API Endpoints**: 
  - `/api/extract-recipe` - Extract recipe title
  - `/api/extract-ingredients` - Extract ingredients list
  - `/api/extract-instructions` - Extract cooking instructions

## Quick Start

### Option 1: Build and Run (Production)
```bash
# Install all dependencies
npm run install-all

# Build the Next.js app and start the server
npm run build-and-start
```

### Option 2: Development Mode
```bash
# Install all dependencies
npm run install-all

# Run both client and server in development mode
npm run dev
```

## Manual Setup

### 1. Install Dependencies
```bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install

# Server dependencies
cd ../server && npm install
```

### 2. Build the Application
```bash
# Build the Next.js client
cd client && npm run build
```

### 3. Start the Server
```bash
# Start the Express server
cd server && npm start
```

## API Usage

### Extract Recipe Title
```bash
curl -X POST http://localhost:3001/api/extract-recipe \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example-recipe-site.com/recipe"}'
```

### Extract Ingredients
```bash
curl -X POST http://localhost:3001/api/extract-ingredients \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example-recipe-site.com/recipe"}'
```

### Extract Instructions
```bash
curl -X POST http://localhost:3001/api/extract-instructions \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example-recipe-site.com/recipe"}'
```

## Development

- The client runs on `http://localhost:3000` (Next.js dev server)
- The server runs on `http://localhost:3001` (Express server)
- API calls from the client are proxied to the server via Next.js rewrites

## Project Structure

```
gmtr/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   └── lib/           # Utility functions
│   └── out/               # Built static files (generated)
├── server/                # Express backend
│   ├── routes/            # API route handlers
│   ├── utils/             # Utility functions
│   └── test/              # Test files
└── package.json           # Root package.json with build scripts
```
