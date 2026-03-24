import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { examService } from '../services/api';
import './Form.css';

const COURSES = ['Computer Science', 'Engineering', 'Information Technology'];
const EDUCATION_OPTIONS = ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'BCA', 'MCA', 'Other'];

export function ExamFormPage({ showToast }) {
  const { user } = useAuth();
  const [course, setCourse] = useState('');
  const [education, setEducation] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!termsAccepted) {
      const msg = 'You must accept the terms and conditions';
      setError(msg);
      showToast(msg);
      return;
    }
    setLoading(true);
    try {
      const formData = { course, education, termsAccepted: !!termsAccepted };
      console.log('Sending Form Data:', formData);
      const { data } = await examService.submitForm(course, education, !!termsAccepted);
      navigate('/otp-verify', {
        state: {
          examSessionId: data.examSessionId,
          email: data.email,
        },
      });
    } catch (err) {
      console.log(err.response?.data);
      const msg = err.response?.data?.message || 'Failed to submit form';
      setError(msg);
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h1>Exam Registration</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <div className="field">
            <label>Name</label>
            <input
              type="text"
              value={user?.name || ''}
              readOnly
              disabled
              className="input-field"
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              disabled
              className="input-field"
            />
          </div>
          <div className="field">
            <label>Course *</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
              className="input-field"
            >
              <option value="">Select course</option>
              {COURSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Education *</label>
            <select
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              required
              className="input-field"
            >
              <option value="">Select education</option>
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="field checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              I accept the Terms & Conditions *
            </label>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <div className="spinner"></div> : 'Submit & Send OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}
