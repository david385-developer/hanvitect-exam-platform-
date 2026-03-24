import { useEffect, useRef, useState, useCallback } from 'react';
import { examService } from '../services/api';

export function useExamProtection(examSessionId, onAutoSubmit, enabled = true) {
  const hasCameraRef = useRef(false);
  const streamRef = useRef(null);
  const violationCountRef = useRef(0);
  const [warnings, setWarnings] = useState(0);

  const recordViolation = useCallback(
    async (eventType, userMessage) => {
      if (!enabled || !examSessionId) return;

      violationCountRef.current += 1;
      const newCount = violationCountRef.current;
      setWarnings(newCount);
      if (userMessage) alert(userMessage);

      try {
        const res = await examService.logCheating(examSessionId, eventType);
        if (res?.data?.autoSubmitted && onAutoSubmit) {
          onAutoSubmit();
          return;
        }
      } catch (err) {
        console.error('Failed to log cheating:', err);
      }

      if (newCount >= 3) {
        alert('Too many violations. Exam will be submitted automatically.');
        if (onAutoSubmit) onAutoSubmit();
      }
    },
    [enabled, examSessionId, onAutoSubmit]
  );

  const handleVisibility = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      recordViolation('tab_switch', 'Tab switch detected!');
    }
  }, [recordViolation]);

  const handleBlur = useCallback(() => {
    recordViolation('window_blur', 'Window focus lost!');
  }, [recordViolation]);

  const handleFullscreenChange = useCallback(() => {
    if (!document.fullscreenElement) {
      recordViolation('fullscreen_exit', 'Fullscreen exited. This is considered cheating.');
    }
  }, [recordViolation]);

  const handleContextMenu = useCallback((e) => e.preventDefault(), []);
  const handleCopy = useCallback((e) => e.preventDefault(), []);
  const handleCut = useCallback((e) => e.preventDefault(), []);
  const handlePaste = useCallback((e) => e.preventDefault(), []);
  const handleSelectStart = useCallback((e) => e.preventDefault(), []);
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'PrintScreen') {
      recordViolation('screenshot', 'Screenshot attempt detected.');
      document.body.style.filter = 'blur(10px)';
      setTimeout(() => {
        document.body.style.filter = 'none';
      }, 2000);
      return;
    }

    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      recordViolation('screenshot-shortcut', 'Screenshot shortcut blocked.');
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      recordViolation('print-attempt', 'Print screen / print attempt blocked.');
      return;
    }

    if (e.ctrlKey && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  }, [recordViolation]);

  useEffect(() => {
    if (!enabled || !examSessionId) return;

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', handleKeyDown);
    }; 
  }, [enabled, examSessionId, handleVisibility, handleBlur, handleFullscreenChange, handleContextMenu, handleCopy, handleCut, handlePaste, handleSelectStart, handleKeyDown]);

  const requestCamera = useCallback(
    async (videoEl) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        hasCameraRef.current = true;
        if (videoEl) videoEl.srcObject = stream;
        return true;
      } catch {
        hasCameraRef.current = false;
        await recordViolation('camera_access_denied', 'Camera access is required to take the exam.');
        return false;
      }
    },
    [recordViolation]
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const reportCameraOff = useCallback(() => {
    recordViolation('camera_off', 'Camera was turned off.');
  }, [recordViolation]);

  const enforceFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        return true;
      } catch (err) {
        alert('Fullscreen mode is required for the exam.');
        console.error('Fullscreen request failed:', err);
        return false;
      }
    }
    return true;
  }, []);

  return {
    requestCamera,
    stopCamera,
    reportCameraOff,
    enforceFullscreen,
    handleViolation: recordViolation,
    warnings,
    violationCount: violationCountRef.current,
  };
}
