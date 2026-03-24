import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { examService } from '../services/api';
import './Result.css';

export function ResultPage({ showToast }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const locationSessionId = location.state?.examSessionId;
  const { result: stateResult } = location.state || {};
  const examSessionId = locationSessionId || localStorage.getItem('examSessionId');

  useEffect(() => {
    if (stateResult) {
      setResult(stateResult);
      setLoading(false);
      return;
    }
    if (!examSessionId) {
      navigate('/exam-form', { replace: true });
      return;
    }
    localStorage.setItem('examSessionId', examSessionId);
    examService.getResult(examSessionId)
      .then((res) => {
        setResult(res.data);
      })
      .catch(() => navigate('/exam-form', { replace: true }))
      .finally(() => setLoading(false));
  }, [examSessionId, stateResult, navigate]);

  if (loading) {
    return (
      <div className="result-page">
        <div className="result-loading">Loading result...</div>
      </div>
    );
  }

  if (!result) return null;

  const isPass = result.passFail === 'pass';

  return (
    <div className="result-page">
      <div className="result-card">
        <h1>Exam Result</h1>
        <div className={`result-badge ${isPass ? 'pass' : 'fail'}`}>
          {result.passFail?.toUpperCase()}
        </div>
        <div className="result-stats">
          <div className="stat">
            <span className="stat-value">{result.totalQuestions}</span>
            <span className="stat-label">Total Questions</span>
          </div>
          <div className="stat correct">
            <span className="stat-value">{result.correct}</span>
            <span className="stat-label">Correct</span>
          </div>
          <div className="stat wrong">
            <span className="stat-value">{result.wrong}</span>
            <span className="stat-label">Wrong</span>
          </div>
          <div className="stat">
            <span className="stat-value">{result.unanswered}</span>
            <span className="stat-label">Unanswered</span>
          </div>
        </div>
        <div className="percentage">
          <span>{result.percentage}%</span>
        </div>
        <Link to="/exam-form" className="btn-primary">Take Another Exam</Link>
      </div>
    </div>
  );
}
