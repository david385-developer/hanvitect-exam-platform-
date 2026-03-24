# MCQ Exam Platform - Frontend

React (Vite) frontend for the secure MCQ exam system.

## Setup

```bash
npm install
npm run dev
```

Runs on http://localhost:5173. Uses proxy to backend at http://localhost:5000.

## Build

```bash
npm run build
```

## Flow

1. **Login** or Register
2. **Exam Form** – Course, Education, Terms (name/email from auth)
3. **OTP Verify** – Enter 6-digit OTP sent to email
4. **Start Exam** – Select 6 languages
5. **Exam** – 30 questions, timer, anti-cheating
6. **Result** – Score, pass/fail

## Anti-Cheating

- Right-click, copy, paste, select disabled
- Tab switch / window blur detected → backend logged
- Camera required (blocks if denied)
- Back button and refresh discouraged
