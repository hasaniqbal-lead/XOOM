# XOOM - Ride-Hailing Platform 🚗💨

A modern, mobile-first ride-hailing application with beautiful UI and real-time features. Built with React, TypeScript, Node.js, and PostgreSQL.

![XOOM Banner](https://img.shields.io/badge/XOOM-Ride%20Hailing-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?style=flat-square)

---

## 🚀 Quick Start (Clone & Run in Seconds!)

Get XOOM running on your machine with automated setup:

### Windows

```cmd
git clone <repository-url>
cd zymo
setup-windows.bat
```

### Ubuntu/Linux

```bash
git clone <repository-url>
cd zymo
chmod +x setup-ubuntu.sh
./setup-ubuntu.sh
```

The setup script will:
- ✅ Check and install all prerequisites
- ✅ Setup PostgreSQL database
- ✅ Install all dependencies
- ✅ Configure environment files
- ✅ Run database migrations

Then start the app:

```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 and you're ready! 🎉

**📖 For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md)**

---

## ✨ Features

- 🚕 **Rider App**: Request rides with real-time tracking and beautiful mobile UI
- 🚗 **Driver App**: Accept rides, navigate, track earnings with location updates
- 👨‍💼 **Admin Dashboard**: Manage users, fares, verify drivers, control system
- ⚡ **Real-time Updates**: Socket.IO-based ride matching and live tracking
- 📱 **PWA Support**: Installable web app for native mobile experience
- 🗺️ **Maps Integration**: Leaflet.js with OpenStreetMap (100% Free, no API key!)
- ⭐ **Rating System**: Review drivers and riders after each trip
- 💰 **Dynamic Fare**: Distance-based pricing with minimum fare
- 🌐 **Urdu Support**: Built-in support for Urdu language
- 🔒 **Secure Auth**: JWT-based authentication with bcrypt

---

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **Shadcn UI** - Beautiful, accessible components
- **TailwindCSS** - Utility-first CSS
- **Socket.IO Client** - Real-time communication
- **Leaflet.js** - Interactive maps
- **Tanstack Query** - Data fetching & caching
- **React Router** - Client-side routing

### Backend
- **Node.js** + Express
- **Socket.IO** - Real-time WebSocket
- **PostgreSQL** - Relational database
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing

---

## 📁 Project Structure

```
zymo/
├── backend/
│   ├── config/           # Database configuration
│   ├── middleware/       # Auth, CORS, validation
│   ├── routes/           # API endpoints
│   ├── migrations/       # Database migrations
│   ├── scripts/          # Setup & utility scripts
│   └── server.js         # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # Auth & Socket contexts
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API services
│   │   └── lib/          # Utilities
│   └── public/           # Static assets
├── docs/
│   ├── SETUP.md          # Detailed setup guide
│   └── DEEP_DIVE_ANALYSIS.md  # Architecture analysis
├── setup-windows.bat     # Windows automated setup
├── setup-ubuntu.sh       # Linux automated setup
└── README.md             # You are here!
```

---

## 📋 Prerequisites

Before running XOOM, ensure you have:

| Software | Minimum Version | Download |
|----------|----------------|----------|
| Node.js | 16.x (18.x LTS recommended) | [nodejs.org](https://nodejs.org/) |
| PostgreSQL | 12.x (14.x+ recommended) | [postgresql.org](https://www.postgresql.org/download/) |
| npm | 8.x (comes with Node.js) | - |
| Git | 2.x | [git-scm.com](https://git-scm.com/) |

---

## 📖 Documentation

- **[Complete Setup Guide](docs/SETUP.md)** - Detailed installation for Windows, Ubuntu, and manual setup
- **[Deep Dive Analysis](docs/DEEP_DIVE_ANALYSIS.md)** - Architecture, features, and technical analysis
- **[API Documentation](#)** - Coming soon
- **[Troubleshooting](#)** - See [docs/SETUP.md#troubleshooting](docs/SETUP.md#-troubleshooting)

---

## 🏃 Development

### Start Development Servers

```bash
# Terminal 1 - Backend (http://localhost:3000)
cd backend
npm start

# Terminal 2 - Frontend (http://localhost:5173)
cd frontend
npm run dev
```

### Available Scripts

```bash
# Backend
cd backend
npm start              # Start server
npm run dev            # Start with nodemon (auto-reload)
npm run migrate        # Run database migrations

# Frontend
cd frontend
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run type-check     # Check TypeScript types
```

---

## 🚀 Production Deployment

### Build for Production

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production mode
cd backend
NODE_ENV=production npm start
```

### Ubuntu VPS Deployment

See the comprehensive deployment guide in [docs/SETUP.md#production-deployment](docs/SETUP.md#-production-deployment) for:

- Server setup and configuration
- Nginx reverse proxy
- PM2 process manager
- SSL certificate with Let's Encrypt
- Database backups
- Security best practices

---

## 🔐 Default Configuration

After setup, these are the default credentials:

**Database:**
- Database: `xoom`
- User: `xoom_user`
- Password: `xoom_password`

**Test Accounts:** (Create via signup page)
- Rider: +923001234567
- Driver: +923009876543
- Password: test1234 (min 8 characters)

**⚠️ IMPORTANT:** Change default passwords in production!

---

## 🎯 Key Features Explained

### For Riders
- Search and select pickup/drop locations on map
- View estimated fare before booking
- Real-time driver tracking
- Rate and review drivers
- View ride history

### For Drivers
- Automatic location broadcasting every 10 seconds
- Receive ride requests in real-time
- Accept/decline rides
- Track today's rides and earnings
- View pickup and drop locations on map
- Complete rides and receive ratings

### Real-time Communication
- Socket.IO for instant updates
- Driver location updates
- Ride status changes (assigned, started, completed)
- Push notifications (ready for integration)

---

## 🐛 Troubleshooting

### Quick Fixes

**Database connection error:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
pg_ctl status                     # Windows
```

**Port already in use:**
```bash
# Change port in backend/.env
PORT=3001
```

**Frontend can't connect:**
```bash
# Verify backend is running
curl http://localhost:3000/api/health

# Check frontend/.env
VITE_API_URL=http://localhost:3000
```

See [Complete Troubleshooting Guide](docs/SETUP.md#-troubleshooting) for more solutions.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Create account | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/rides` | Create ride | Yes |
| GET | `/api/rides` | Get user rides | Yes |
| PATCH | `/api/rides/:id/accept` | Accept ride | Yes |
| PATCH | `/api/rides/:id/complete` | Complete ride | Yes |
| POST | `/api/reviews` | Submit review | Yes |
| GET | `/api/users/profile` | Get profile | Yes |

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for beautiful components
- [Leaflet.js](https://leafletjs.com/) for maps
- [OpenStreetMap](https://www.openstreetmap.org/) for free map tiles
- [Socket.IO](https://socket.io/) for real-time features

---

**Made with ❤️ for modern ride-hailing**
