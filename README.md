# School Management System

A full-stack web application for managing school operations — students, teachers, classes, attendance, grades, fees, and timetables.

**Live Demo:** https://school-management-system-livid-one.vercel.app

---

## Features

- **Authentication** — JWT-based login with Admin and Teacher roles
- **Students** — add, edit, search, and soft-delete student records
- **Teachers** — manage teacher profiles and login accounts atomically
- **Classes** — create classes and assign class teachers
- **Attendance** — mark daily attendance per class with present/absent toggle
- **Grades** — record exam results; auto-calculates grade letter (A+–F); printable report cards
- **Fees** — track fee records, mark payments, view overdue alerts on dashboard
- **Timetable** — set weekly class schedules with subjects, teachers, and times
- **Dashboard** — live stats, today's attendance summary, overdue fee alerts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT + bcryptjs |
| Hosting | Render (backend), Vercel (frontend) |

---

## Project Structure

```
school-management-system/
├── school-backend/
│   ├── models/          # Mongoose schemas (User, Student, Teacher, Class, Attendance, Grade, Fee, Timetable)
│   ├── controllers/     # Business logic for each entity
│   ├── routes/          # Express route definitions
│   ├── middleware/      # JWT auth, role authorization, input validation
│   ├── db.js            # MongoDB connection
│   ├── server.js        # Express app entry point
│   └── seedAdmin.js     # One-time admin account creation script
│
└── school-frontend/
    ├── pages/           # HTML pages (login, students, teachers, classes, attendance, grades, fees, timetable)
    ├── js/              # JavaScript per page + shared auth.js and config.js
    ├── components/      # Shared navbar
    ├── styles.css       # Global design system
    └── vercel.json      # Vercel routing config
```

---

## Local Setup

### Prerequisites
- Node.js v18+
- A MongoDB Atlas account (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/school-management-system.git
cd school-management-system
```

### 2. Set up the backend
```bash
cd school-backend
npm install
```

Create a `.env` file (copy from `.env.example`):
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/schoolDB
PORT=5000
JWT_SECRET=your-long-random-secret
FRONTEND_URL=http://localhost:3000
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Create the first admin account:
```bash
node seedAdmin.js "Your Name" admin@email.com yourpassword
```

Start the backend:
```bash
npm run dev
```

### 3. Set up the frontend
```bash
cd ../school-frontend
```

Open `js/config.js` and set:
```js
const CONFIG = {
    API_URL: "http://localhost:5000"
};
```

Then serve it:
```bash
npm install
npm start
```

Open http://localhost:3000 and log in with your admin credentials.

---

## Deployment

- **Backend** → [Render](https://render.com) — set Root Directory to `school-backend`, add environment variables
- **Frontend** → [Vercel](https://vercel.com) — set Root Directory to `school-frontend`, no build command needed
- Update `school-frontend/js/config.js` with your Render URL before deploying frontend

---

## Security

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens expire after 8 hours
- Helmet.js for secure HTTP headers
- express-mongo-sanitize for NoSQL injection protection
- Rate limiting: 20 login attempts / 300 API requests per 15 minutes
- Input validation on all POST/PUT endpoints via express-validator
- CORS restricted to configured frontend URL in production

---

## Role Permissions

| Feature | Admin | Teacher |
|---------|-------|---------|
| View all data | ✅ | ✅ |
| Add/edit students, teachers, classes | ✅ | ❌ |
| Mark attendance | ✅ | ✅ |
| Add grades | ✅ | ✅ |
| Edit/delete grades | ✅ | ❌ |
| Mark fees as paid | ✅ | ✅ |
| Add/edit fee records | ✅ | ❌ |
| Manage user accounts | ✅ | ❌ |
| Edit timetable | ✅ | ❌ |

---

## License

This project was built as an internship final project. All rights reserved.
