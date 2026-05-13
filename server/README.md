# 🗳️ CampusVote — Node.js/Express Backend

Backend server for **Amrapali University Head Boy Election System**.

## 📁 Server Folder Structure

```
server/
├── index.js              ← Main Express server (entry point)
├── db.js                 ← Flat-file database helper (reads/writes database.json)
├── package.json          ← Dependencies
├── .env                  ← Environment variables (credentials)
├── .env.example          ← Template (safe to share)
├── .gitignore
├── middleware/
│   └── auth.js           ← Faculty authentication middleware
└── routes/
    ├── auth.js           ← POST /api/auth/faculty-login
    ├── vote.js           ← POST /api/vote, GET /api/vote/check
    ├── candidates.js     ← CRUD /api/candidates
    └── results.js        ← /api/results + election management
```

## 🚀 How to Run

```powershell
# 1. Go into server folder
cd server

# 2. Install dependencies (first time only)
npm install

# 3. Start the server
node index.js

# 4. Open browser
# http://localhost:5500
```

Or use **nodemon** for auto-restart during development:
```powershell
npm run dev
```

## 📡 API Reference

### 🔓 Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/data` | Full data (legacy compat) |
| GET | `/api/candidates` | All candidates |
| GET | `/api/candidates/:course` | Candidates by course |
| POST | `/api/vote` | Cast a vote |
| GET | `/api/vote/check` | Check if already voted |

### 🔐 Faculty-Only Endpoints (require Authorization header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/faculty-login` | Faculty login → returns token |
| GET | `/api/results` | All results |
| GET | `/api/results/:course` | Results by course |
| POST | `/api/results/reset` | Reset all votes |
| POST | `/api/results/toggle` | Open/close election |
| POST | `/api/candidates/:course` | Add candidate |
| PUT | `/api/candidates/:course/:id` | Edit candidate |
| DELETE | `/api/candidates/:course/:id` | Delete candidate |

### Faculty Auth Header
After login, use the returned token in subsequent requests:
```
Authorization: Bearer 99976:factstar524@gmail.com
```

## 🔑 Environment Variables (`.env`)

```env
PORT=5500
NODE_ENV=development
FACULTY_EMAIL=factstar524@gmail.com
FACULTY_EMPID=99976
ALLOWED_ORIGIN=*
```

## 🛡️ Security Features

- Faculty credentials stored **server-side only** (not in browser JS)
- Rate limiting: 5 vote attempts / 15 min per IP
- Rate limiting: 10 login attempts / 15 min per IP
- Server-side vote deduplication (email + mobile + rollNo)
- Helmet.js security headers
- Input validation on all endpoints
- Atomic database writes (temp file + rename)
