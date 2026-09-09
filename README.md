# 🏢 Ascendion Office Seat Booking

A full-stack MEAN (MongoDB, Express, Angular 17, Node.js) web app for office seat booking across 5 Ascendion locations.

## Features
- **Multi-location** seat booking (HYD, BLR, CHN, PNE, VDR)
- **24-hour cross-midnight** shift support (e.g. 22:00 → 06:00)
- **Real-time** seat availability via Socket.io
- **OTP email verification** for registration & password reset
- **Role-based access** — Employee & Admin
- **Admin panel** — manage users, seats, locations, block dates, analytics, audit log
- **OneDrive Excel sync** via Microsoft Graph API
- **Dark mode**, responsive (mobile/tablet/desktop), PWA-ready
- **Scheduled jobs** — reminders, weekly digest, auto-complete bookings

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Docker (optional, for MongoDB + Redis)

### 1. Start MongoDB & Redis
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd server
cp .env.example .env    # Edit with your values
npm install
node seed.js            # Seed locations, admin user, sample seats
npm run dev             # Starts on http://localhost:3000
```

Default admin: `admin@ascendion.com` / `Admin@1234`

### 3. Frontend Setup
```bash
cd client
npm install
npm start               # Starts on http://localhost:4200
```

### 4. Open Browser
Go to `http://localhost:4200`

## Sharing with Employees

### Option A: Deploy to Azure (Recommended)
1. **Backend** → Azure App Service
2. **Frontend** → Azure Static Web Apps
3. **Database** → Azure Cosmos DB (MongoDB API) or MongoDB Atlas
4. **Redis** → Azure Cache for Redis

### Option B: Share via Internal Network
1. Build the Angular app: `cd client && npm run build`
2. Serve the `dist/` folder from Express (add static file serving to server.js)
3. Deploy on any internal server — employees access via browser

### Option C: Docker
```bash
# Build and run everything
docker-compose up -d
cd server && npm start
# Serve client build from Express
```

## Project Structure
```
├── client/          # Angular 17+ frontend
│   ├── src/app/
│   │   ├── core/        # Guards, interceptors
│   │   ├── services/    # API, Auth, Socket, Toast, Theme
│   │   └── features/    # auth, home, booking, my-bookings, notifications, profile, admin
│   └── ...
├── server/          # Express.js backend
│   ├── controllers/ # Request handlers
│   ├── models/      # Mongoose schemas
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   ├── jobs/        # BullMQ email queue
│   ├── cron/        # Scheduled jobs
│   └── sockets/     # Socket.io handlers
└── docker-compose.yml
```

## API Endpoints
- `POST /api/auth/register` — Register + OTP
- `POST /api/auth/login` — Login (JWT cookie)
- `GET /api/seats/available` — Available seats
- `POST /api/bookings` — Create booking
- `GET /api/admin/*` — Admin endpoints (users, seats, locations, analytics, audit)

## Environment Variables
See `server/.env.example` for all required config.
