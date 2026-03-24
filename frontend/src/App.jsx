import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { ExamFormPage } from './pages/ExamFormPage';
import { OTPVerifyPage } from './pages/OTPVerifyPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StartExamPage } from './pages/StartExamPage';
import { ExamPage } from './pages/ExamPage';
import { ResultPage } from './pages/ResultPage';
import './App.css';

function App() {
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        {toast && <div className="toast">{toast}</div>}
        <Routes>
          <Route path="/login" element={<LoginPage showToast={showToast} />} />
          <Route path="/register" element={<RegisterPage showToast={showToast} />} />
          <Route
            path="/exam-form"
            element={
              <ProtectedRoute>
                <ExamFormPage showToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/otp"
            element={
              <ProtectedRoute>
                <OTPVerifyPage showToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/otp-verify"
            element={
              <ProtectedRoute>
                <OTPVerifyPage showToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/start-exam"
            element={
              <ProtectedRoute>
                <StartExamPage showToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam"
            element={
              <ProtectedRoute>
                <ExamPage showToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result"
            element={
              <ProtectedRoute>
                <ResultPage showToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLoginPage showToast={showToast} />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
