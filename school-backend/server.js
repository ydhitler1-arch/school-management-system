const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const connectDB = require('./db');
const authRoutes       = require('./routes/authroutes');
const studentRoutes    = require('./routes/studentroutes');
const teacherRoutes    = require('./routes/teacherroutes');
const classRoutes      = require('./routes/classroutes');
const attendanceRoutes = require('./routes/attendanceroutes');
const gradesRoutes     = require('./routes/gradesroutes');
const feesRoutes       = require('./routes/feesroutes');

const app = express();

// ── security headers ───────────────────────────────────────────────────
app.use(helmet());

// ── HTTP request logging ───────────────────────────────────────────────
// 'combined' = Apache-style logs with IP, method, path, status, response time
// great for debugging production issues
app.use(morgan('combined'));

// ── CORS ───────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
}));

app.use(express.json());

// ── NoSQL injection protection ─────────────────────────────────────────
// strips out keys starting with $ or containing . from req.body, req.params, req.query
// prevents attacks like { "email": { "$gt": "" } }
app.use(mongoSanitize());

// ── rate limiting ──────────────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 20,
    standardHeaders: true, legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later." }
});
app.use('/api/auth/login', authLimiter);

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 300,
    standardHeaders: true, legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
});
app.use('/api', apiLimiter);

// ── database ───────────────────────────────────────────────────────────
connectDB();

// ── health check ───────────────────────────────────────────────────────
// Render and uptime monitors ping this to confirm the service is alive
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()) + 's'
    });
});

app.get("/", (req, res) => res.send("Backend running..."));

// ── routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/students',   studentRoutes);
app.use('/api/teachers',   teacherRoutes);
app.use('/api/classes',    classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades',     gradesRoutes);
app.use('/api/fees',       feesRoutes);

// ── error handlers ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
