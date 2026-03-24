# Hanvitect Exam Platform

A full-stack online examination platform with advanced anti-cheating features.

## Project Structure

```
hanvitect_assignment/
├── backend/          # Node.js/Express API server
│   ├── src/         # Source code
│   ├── package.json
│   └── README.md
├── frontend/         # React/Vite client application
│   ├── src/         # Source code
│   ├── package.json
│   └── README.md
├── .gitignore       # Git ignore rules
└── README.md        # This file
```

## Features

- **User Authentication**: Registration and login with JWT
- **Exam Management**: Create and take exams with multiple questions
- **Anti-Cheating System**:
  - Fullscreen enforcement
  - Camera monitoring
  - Tab/window switch detection
  - Screenshot attempt prevention
  - Auto-submit on violations
- **Modern UI**: Professional, responsive design with toast notifications

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (assumed from database.js)
- JWT for authentication
- Email service for OTP

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios for API calls
- React Router for navigation

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB database

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-github-repo-url>
   cd hanvitect_assignment
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.sample .env  # Configure your environment variables
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## API Documentation

See `backend/API_ENDPOINTS.md` for detailed API documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes.