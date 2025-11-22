# NawaRide - Ride-Hailing Platform for Nawa-Lahore

A lightweight, web-based ride-hailing application designed for small towns in Punjab, Pakistan.

## Features

- **Rider App**: Request rides, track drivers, view history
- **Driver App**: Accept rides, navigate, earn points, track targets
- **Admin Dashboard**: Manage users, fares, verify drivers, control system
- **Real-time Updates**: WebSocket-based ride matching and tracking
- **PWA Support**: Installable web app for mobile experience
- **Maps Integration**: Leaflet.js with OpenStreetMap

## Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS
- Socket.IO Client
- Leaflet.js
- PWA Support

### Backend
- Node.js + Express
- Socket.IO
- PostgreSQL + PostGIS
- JWT Authentication
- Bcrypt

## Project Structure

```
nawaride/
├── backend/          # Node.js API server
├── frontend/         # React PWA
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
