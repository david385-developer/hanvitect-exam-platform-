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
  const [cameraReady, setCameraReady] = useState(false);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const [antiCheatActive, setAntiCheatActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [isAlertActive, setIsAlertActive] = useState(false);
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
      setIsCameraInitializing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
      setCameraGranted(true);
      setTimeout(() => {
        setIsCameraInitializing(false);
      }, 2000);
      return true;
    } catch {
      setIsCameraInitializing(false);
      showToast('Camera permission is required to proceed.');
      setCameraReady(false);
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
    if (!antiCheatActive) return;
    if (isAlertActive) return;

    setIsAlertActive(true);
    setTimeout(() => setIsAlertActive(false), 1500);

    const now = Date.now();
    if (now - lastViolationRef.current < VIOLATION_COOLDOWN) return;

    lastViolationRef.current = now;

    setWarnings((prev) => {
      const count = prev + 1;
      if (count >= 3) {
        showToast('Too many violations. Auto submitting...');
        handleAutoSubmit();
      } else {
        showToast(`Warning ${count}/3: Do not leave the exam window.`);
      }

      // backend integration
      examService.logCheating(examSessionId, type).catch(console.error);
      if (hookViolation) hookViolation(type);

      return count;
    });
  };

  useEffect(() => {
    if (questions.length === 0 || submitted) return;

    let mounted = true;
    const setupCamera = async () => {
      const camera = await startCamera();
      if (!camera) {
        navigate('/exam-form', { replace: true });
        return;
      }
    };

    const timer = setTimeout(() => setupCamera(), 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (!examStarted) stopCamera();
    };
  }, [questions.length, submitted, navigate, stopCamera, examStarted]);

  const generateMockQuestions = () => {
    const sample = [
      {
        question: 'What is JavaScript?',
        options: ['Language', 'Database', 'OS', 'Browser'],
        answer: 0,
      },
      {
        question: 'What is React?',
        options: ['Library', 'Language', 'Server', 'OS'],
        answer: 0,
      },
      {
        question: 'What is Node.js?',
        options: ['Runtime', 'Framework', 'DB', 'Compiler'],
        answer: 0,
      },
    ];

    return Array.from({ length: 30 }, (_, i) => ({
      ...sample[i % sample.length],
      _id: (i + 1).toString(),
    }));
  };

  useEffect(() => {
    if (!questions || questions.length === 0) {
      setQuestions(generateMockQuestions());
    }
  }, [questions]);

  const handleSubmitClick = () => {
    if (submitted) return;
    setSubmitted(true);
    stopCamera();
    submitAnswers(answersRef.current);
  };

  const handleStartExam = async () => {
    const fullscreen = await enterFullscreen();
    if (!fullscreen) {
      return;
    }

    setExamStarted(true);
    setTimeout(() => {
      setAntiCheatActive(true);
    }, 1000);
  };

  useEffect(() => {
    if (submitted || questions.length === 0 || !examStarted) return;
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
  }, [submitted, questions.length, submitAnswers, examStarted]);

  const blockBack = (e) => {
    e.preventDefault();
    showToast('Back navigation is disabled during the exam.');
    window.history.pushState(null, '', window.location.href);
    return false;
  };
  useEffect(() => {
    if (questions.length > 0 && !submitted && antiCheatActive) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', blockBack);
      window.addEventListener('beforeunload', blockBack);
    }
    return () => {
      window.removeEventListener('popstate', blockBack);
      window.removeEventListener('beforeunload', blockBack);
    };
  }, [questions.length, submitted, antiCheatActive]);

  useEffect(() => {
    const handleVisibility = () => {
      if (isCameraInitializing) return;
      if (!antiCheatActive) return;
      if (document.hidden) handleViolation('tab-switch');
    };

    const handleBlur = () => {
      if (isCameraInitializing) return;
      if (!antiCheatActive) return;
      handleViolation('window-blur');
    };

    const handlerFSExit = () => {
      if (!antiCheatActive) return;
      if (!document.fullscreenElement) handleViolation('fullscreen-exit');
    };

    const handlerPrintScreen = (e) => {
      if (!antiCheatActive) return;
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

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handlerFSExit);
    document.addEventListener('keydown', handlerPrintScreen);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handlerFSExit);
      document.removeEventListener('keydown', handlerPrintScreen);
    };
  }, [antiCheatActive, isCameraInitializing]);

  useEffect(() => {
    if (!antiCheatActive) return;

    const interval = setInterval(() => {
      if (!videoRef.current?.srcObject) {
        handleViolation('camera-off');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [antiCheatActive]);


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

  if (!examStarted) {
    return (
      <div className="exam-page exam-setup">
        <div className="setup-card">
          <h1>Exam Setup</h1>
          <p>Camera access has been granted. Click "Start Exam" to begin.</p>
          <div className={`camera-container ${cameraGranted ? 'visible' : ''}`}>
            <span className="camera-label">Camera Setup</span>
            <video ref={videoRef} autoPlay muted playsInline />
          </div>
          <button onClick={handleStartExam} className="btn-primary start-exam-btn">
            Start Exam
          </button>
        </div>
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

      <div className={`camera-container ${cameraGranted && examStarted ? 'visible' : ''}`}>
        <span className="camera-label">Camera Active</span>
        <video ref={videoRef} autoPlay muted playsInline />
      </div>
    </div>
  );
}
