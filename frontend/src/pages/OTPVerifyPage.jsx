import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { examService } from '../services/api';
import './OTP.css';

export function OTPVerifyPage({ showToast }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const initialExamSessionId = location.state?.examSessionId || localStorage.getItem('examSessionId');
  const initialEmail = location.state?.email || localStorage.getItem('otpEmail');
  const [examSessionId, setExamSessionId] = useState(initialExamSessionId);
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    if (!examSessionId || !email) {
      navigate('/exam-form', { replace: true });
      return;
    }
    localStorage.setItem('examSessionId', examSessionId);
    localStorage.setItem('otpEmail', email);
  }, [examSessionId, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      const msg = 'Enter a valid 6-digit OTP';
      setError(msg);
      showToast(msg);
      return;
    }
    setLoading(true);
    try {
      await examService.verifyOTP(email, otp, examSessionId);
      navigate('/start-exam', { state: { examSessionId } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      setError(msg);
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await examService.requestOTP(examSessionId);
      setError('');
      setOtp('');
      showToast('OTP resent to your email');
    } catch (err) {
      console.log(err.response?.data || err.message);
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      setError(msg);
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!examSessionId || !email) return null;

  return (
    <div className="otp-page">
      <div className="otp-card">
        <h1>Verify OTP</h1>
        <p className="otp-hint">Enter the 6-digit OTP sent to {email}</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="input-field otp-input"
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <div className="spinner"></div> : 'Verify'}
          </button>
          <button type="button" className="link-btn" onClick={handleResend} disabled={loading}>
            Resend OTP
          </button>
        </form>
      </div>
    </div>
  );
}
