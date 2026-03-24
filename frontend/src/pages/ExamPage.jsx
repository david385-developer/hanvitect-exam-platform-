import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { examService } from '../services/api';
import { useExamProtection } from '../hooks/useExamProtection';
import './Exam.css';

const EXAM_DURATION_MINUTES = 30;

export function ExamPage({ showToast }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const answersRef = useRef({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_MINUTES * 60);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(null);
  const [showCameraBlock, setShowCameraBlock] = useState(false);

  const [examStarted, setExamStarted] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const lastViolationRef = useRef(0);
  const VIOLATION_COOLDOWN = 2000;

  const videoRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const locationSessionId = location.state?.examSessionId;
  const [examSessionId, setExamSessionId] = useState(() => locationSessionId || localStorage.getItem('examSessionId'));
  const { questions: initialQuestions } = location.state || {};
  answersRef.current = answers;

  const submitAnswers = useCallback(async (ans, isAuto = false) => {
    if (!examSessionId) return;
    setLoading(true);
    try {
      const { data } = await examService.submitExam(examSessionId, ans || answersRef.current);
      navigate('/result', {
        state: {
          examSessionId,
          result: data.data || data,
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || '';
      const autoSubmitted =
        isAuto ||
        err.response?.data?.status === 'auto-submitted' ||
        err.response?.data?.data?.autoSubmitted;
      if (autoSubmitted) {
        navigate('/result', { state: { examSessionId } });
      } else {
        setSubmitted(false);
        setLoading(false);
        showToast(msg || 'Submit failed');
      }
    } finally {
      setLoading(false);
    }
  }, [examSessionId, navigate, showToast]);

  const handleAutoSubmit = useCallback(() => {
    setSubmitted(true);
    submitAnswers(answersRef.current, true);
  }, [submitAnswers]);

  const { requestCamera, stopCamera, enforceFullscreen, handleViolation: hookViolation } = useExamProtection(
    examSessionId,
    handleAutoSubmit,
    !submitted && questions.length > 0
  );

  useEffect(() => {
    if (!examSessionId) {
      navigate('/exam-form', { replace: true });
      return;
    }
    localStorage.setItem('examSessionId', examSessionId);

    if (initialQuestions?.length) {
      setQuestions(initialQuestions);
    } else {
      examService.getQuestions(examSessionId).then((res) => {
        setQuestions(res.data.questions || []);
        setAnswers(res.data.answers || {});
      }).catch(() => navigate('/exam-form', { replace: true }));
    }
  }, [examSessionId, initialQuestions, navigate]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraReady(true);
      setCameraGranted(true);
      return true;
    } catch {
      showToast('Camera required!');
      setIsCameraReady(false);
      setShowCameraBlock(true);
      return false;
    }
  };

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      return true;
    } catch {
      showToast('Fullscreen mode is required.');
      setIsFullscreen(false);
      return false;
    }
  };

  const handleViolation = (type) => {
    if (!examStarted || !isCameraReady || !isFullscreen) return;

    const now = Date.now();
    if (now - lastViolationRef.current < VIOLATION_COOLDOWN) return;

    lastViolationRef.current = now;

    setWarnings((prev) => {
      const count = prev + 1;
      showToast(`Violation: ${type} (${count}/3)`);

      // backend integration
      examService.logCheating(examSessionId, type).catch(console.error);
      if (hookViolation) hookViolation(type);

      if (count >= 3) {
        showToast('Too many violations. Auto submitting...');
        handleAutoSubmit();
      }

      return count;
    });
  };

  useEffect(() => {
    if (questions.length === 0 || submitted) return;

    let mounted = true;
    const prepareExam = async () => {
      const fullscreen = await enterFullscreen();
      if (!fullscreen) {
        navigate('/start-exam', { replace: true });
        return;
      }

      const camera = await startCamera();
      if (!camera) {
        navigate('/exam-form', { replace: true });
        return;
      }

      if (mounted) setExamStarted(true);
    };

    const timer = setTimeout(() => prepareExam(), 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [questions.length, submitted, navigate, stopCamera]);

  const handleSubmitClick = () => {
    if (submitted) return;
    setSubmitted(true);
    stopCamera();
    submitAnswers(answersRef.current);
  };

  useEffect(() => {
    if (submitted || questions.length === 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setSubmitted(true);
          submitAnswers(answersRef.current, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submitted, questions.length, submitAnswers]);

  const blockBack = (e) => {
    e.preventDefault();
    showToast('Back navigation is disabled during the exam.');
    window.history.pushState(null, '', window.location.href);
    return false;
  };
  useEffect(() => {
    if (questions.length > 0 && !submitted) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', blockBack);
      window.addEventListener('beforeunload', blockBack);
    }
    return () => {
      window.removeEventListener('popstate', blockBack);
      window.removeEventListener('beforeunload', blockBack);
    };
  }, [questions.length, submitted]);

  useEffect(() => {
    const handlerTab = () => {
      if (document.hidden) handleViolation('tab-switch');
    };
    const handlerBlur = () => handleViolation('blur');
    const handlerFSExit = () => {
      if (!document.fullscreenElement) handleViolation('fullscreen-exit');
    };
    const handlerPrintScreen = (e) => {
      if (e.key === 'PrintScreen') {
        handleViolation('screenshot');
        document.body.style.filter = 'blur(10px)';
        setTimeout(() => (document.body.style.filter = 'none'), 1500);
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleViolation('screenshot-shortcut');
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleViolation('print-attempt');
      }
    };

    document.addEventListener('visibilitychange', handlerTab);
    window.addEventListener('blur', handlerBlur);
    document.addEventListener('fullscreenchange', handlerFSExit);
    document.addEventListener('keydown', handlerPrintScreen);

    return () => {
      document.removeEventListener('visibilitychange', handlerTab);
      window.removeEventListener('blur', handlerBlur);
      document.removeEventListener('fullscreenchange', handlerFSExit);
      document.removeEventListener('keydown', handlerPrintScreen);
    };
  }, [examStarted, isCameraReady, isFullscreen]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!videoRef.current?.srcObject) {
        handleViolation('camera-off');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [examStarted, isCameraReady]);


  const selectAnswer = (qId, option) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!examSessionId) return null;

  if (showCameraBlock && cameraGranted === false) {
    return (
      <div className="exam-page camera-block">
        <div className="camera-block-card">
          <h1>Camera Access Required</h1>
          <p>You must allow camera access to take this exam. Please enable your webcam and refresh.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="exam-page">
        <div className="exam-loading">Loading exam...</div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const qId = q?._id;

  return (
    <div className="exam-page">
      {warnings > 0 && (
        <div className="violation-banner">
          Warning: {warnings} violation{warnings === 1 ? '' : 's'} detected.
        </div>
      )}

      <header className="exam-header">
        <span>Question {currentIndex + 1} / {questions.length}</span>
        <span className={`timer ${timeLeft < 300 ? 'warning' : ''}`}>{formatTime(timeLeft)}</span>
        <button
          type="button"
          className="btn-primary submit-exam-btn"
          onClick={handleSubmitClick}
          disabled={submitted || loading}
        >
          {loading ? <div className="spinner"></div> : 'Submit Exam'}
        </button>
      </header>

      <main className="exam-main">
        <div className="question-card">
          <h2>{q?.question}</h2>
          <div className="options">
            {(q?.options || []).map((opt) => (
              <label key={opt} className="option-label">
                <input
                  type="radio"
                  name={qId}
                  value={opt}
                  checked={answers[qId] === opt}
                  onChange={() => selectAnswer(qId, opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <nav className="question-nav">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="btn-primary"
          >
            Previous
          </button>          <div className="q-dots">
            {questions.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`q-dot ${i === currentIndex ? 'active' : ''} ${answers[questions[i]?._id] ? 'answered' : ''}`}
                onClick={() => setCurrentIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={currentIndex === questions.length - 1}
            className="btn-primary"
          >
            Next
          </button>
        </nav>
      </main>

      <div className={`camera-preview ${cameraGranted ? 'visible' : ''}`}>
        <video ref={videoRef} autoPlay muted playsInline className="camera-video" />
      </div>
    </div>
  );
}
