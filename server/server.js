require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/validate');
const seatSocket = require('./sockets/seatSocket');
const { startCrons } = require('./cron/scheduler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:4200', credentials: true } });

app.set('io', io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:4200', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/seats', require('./routes/seat.routes'));
app.use('/api/locations', require('./routes/location.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Error handler
app.use(errorHandler);

// Socket.io
seatSocket(io);

// Start
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startCrons();
  });
}).catch(err => { console.error('DB connection failed:', err); process.exit(1); });

module.exports = app;
