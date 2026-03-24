import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { examService } from '../services/api';
import './StartExam.css';

const AVAILABLE_LANGUAGES = ['Java', 'Python', 'JavaScript', 'C++', 'Go', 'Rust'];

export function StartExamPage({ showToast }) {
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const initialExamSessionId = location.state?.examSessionId || localStorage.getItem('examSessionId');
  const [examSessionId] = useState(initialExamSessionId);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (!examSessionId) {
      navigate('/exam-form', { replace: true });
      return;
    }
    localStorage.setItem('examSessionId', examSessionId);
  }, [token, examSessionId, navigate]);

  if (!token || !examSessionId) return null;

  const toggleLanguage = (lang) => {
    setSelected((prev) => {
      if (prev.includes(lang)) return prev.filter((l) => l !== lang);
      if (prev.length >= 6) return prev;
      return [...prev, lang];
    });
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setError('');
    if (selected.length !== 6) {
      const msg = 'Select exactly 6 languages';
      setError(msg);
      showToast(msg);
      return;
    }
    setLoading(true);
    try {
      console.log('Token:', localStorage.getItem('token'));
      const { data } = await examService.startExam(selected);
      const sessionId = data.sessionId || data.examSessionId;
      if (sessionId) localStorage.setItem('examSessionId', sessionId);
      navigate('/exam', {
        state: {
          examSessionId: sessionId,
          questions: data.questions,
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start exam';
      setError(msg);
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="start-exam-page">
      <div className="start-exam-card">
        <h1>Select 6 Languages</h1>
        <p>Choose exactly 6 languages for your exam (5 questions per language = 30 total)</p>
        {error && <div className="error-msg">{error}</div>}
        <div className="language-grid">
          {AVAILABLE_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              className={`lang-btn ${selected.includes(lang) ? 'selected' : ''}`}
              onClick={() => toggleLanguage(lang)}
            >
              {lang}
            </button>
          ))}
        </div>
        <p className="selection-count">Selected: {selected.length} / 6</p>
        <button
          type="button"
          className="btn-primary"
          onClick={handleStart}
          disabled={selected.length !== 6 || loading}
        >
          {loading ? <div className="spinner"></div> : 'Start Exam'}
        </button>
      </div>
    </div>
  );
}
