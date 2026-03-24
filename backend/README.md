# Hanvitect MCQ Exam Backend

Production-ready Node.js + Express + MongoDB backend for a secure MCQ exam system with multi-role auth and OTP verification.

## Features

- **Authentication**: JWT-based, multi-role (admin/user)
- **OTP Verification**: Email OTP for exam access (5 min expiry, max 3 attempts)
- **MCQ Exam**: 30 questions (6 languages × 5 each), anti-cheating, backend result calculation

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   ```bash
   cp .env.sample .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Start MongoDB** (local or cloud)

4. **Run**
   ```bash
   npm run dev
   # or
   npm start
   ```

## Seed Questions (Admin)

Create an admin user, then use POST `/api/exam/questions` to add questions. Each question needs:
- `course`, `language`, `question`, `options` (array), `correctAnswer` (must be in options)

Example: For course "Computer Science", add 5+ questions per language (e.g., Java, Python, JavaScript, C++, Go, Rust) to enable the exam.

## API

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for full endpoint documentation.

## Security

- Helmet, CORS, rate limiting
- Input validation (Joi) and sanitization
- Bcrypt password hashing
- JWT auth, role-based access
- Correct answers never sent to frontend
