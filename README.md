# XOOM - Ride-Hailing Platform

A modern, mobile-first ride-hailing application with beautiful UI and real-time features.

## Features

- **Rider App**: Request rides, track drivers, view history with stunning mobile UI
- **Driver App**: Accept rides, navigate, manage earnings with radius control
- **Admin Dashboard**: Manage users, fares, verify drivers, control system
- **Real-time Updates**: WebSocket-based ride matching and tracking
- **PWA Support**: Installable web app for native mobile experience
- **Maps Integration**: Leaflet.js with OpenStreetMap (100% Free)

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite Build Tool
- Shadcn UI Components
- TailwindCSS
- Socket.IO Client
- Leaflet.js for Maps
- PWA Support

### Backend
- Node.js + Express
- Socket.IO (Real-time)
- PostgreSQL + PostGIS
- JWT Authentication
- Bcrypt

## Project Structure

```
xoom/
├── backend/          # Node.js API server
├── frontend/         # React + TypeScript PWA
├── docs/            # Documentation
└── package.json     # Root workspace config
```

## Getting Started

### Prerequisites
- Node.js 18+ LTS
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run database migrations
npm run migrate --workspace=backend

# Start development servers
npm run dev
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend
```

### Build for Production

```bash
npm run build
npm start
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for VPS deployment instructions.

## License

MIT
