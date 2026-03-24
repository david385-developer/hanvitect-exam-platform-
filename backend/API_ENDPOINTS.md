# API Endpoints

Base URL: `http://localhost:5000/api`

---

## Authentication (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |

### Request Bodies

**Register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Login**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

## Authentication (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Get current user (requires `Authorization: Bearer <token>`) |

---

## OTP (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/otp/send` | Send OTP to email |
| POST | `/otp/verify` | Verify OTP |

### Request Bodies

**Send OTP**
```json
{
  "email": "user@example.com"
}
```

**Verify OTP**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

---

## Exam Flow

### Step 1: Submit Exam Form (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/exam/form` | Submit exam form, creates session, sends OTP to user's email |

**Request Body**
```json
{
  "course": "Computer Science",
  "education": "B.Tech",
  "termsAccepted": true
}
```

### Step 2: Verify OTP (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/exam/verify-otp` | Verify OTP before exam start |

**Request Body**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "examSessionId": "<session_id>"
}
```

### Step 3: Start Exam (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/exam/request-otp` | Resend OTP for exam session |
| POST | `/exam/start` | Start exam with 6 languages |

**Request OTP (Resend)**
```json
{
  "examSessionId": "<session_id>"
}
```

**Start Exam**
```json
{
  "examSessionId": "<session_id>",
  "selectedLanguages": ["Java", "Python", "JavaScript", "C++", "Go", "Rust"]
}
```

---

## Exam (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exam/session/:examSessionId/questions` | Get questions (without correct answers) |
| POST | `/exam/cheating` | Log cheating event |
| POST | `/exam/submit` | Submit exam answers |
| GET | `/exam/session/:examSessionId/result` | Get exam result |
| GET | `/exam/session/:examSessionId/status` | Get session status |

**Log Cheating Event**
```json
{
  "examSessionId": "<session_id>",
  "eventType": "tab_switch"
}
```
Event types: `tab_switch`, `window_blur`, `dev_tools`, `camera_off`

**Submit Exam**
```json
{
  "examSessionId": "<session_id>",
  "answers": {
    "<question_id>": "<selected_option>",
    "<question_id>": ""
  }
}
```

---

## Admin (Protected, Admin Role Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/exam/questions` | Create new question |

**Request Body**
```json
{
  "course": "Computer Science",
  "language": "Java",
  "question": "What is Java?",
  "options": ["A language", "A framework", "A database"],
  "correctAnswer": "A language"
}
```

---

## Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |

---

## Headers

- `Content-Type: application/json` - For all POST/PUT requests
- `Authorization: Bearer <JWT_TOKEN>` - For protected routes
