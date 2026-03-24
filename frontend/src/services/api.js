import axios from 'axios';

const api = axios.create({
  // Explicit base URL for predictable integration (avoids relying on dev proxy).
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authService = {
  login: async (email, password) => {
    console.log('[CLIENT][AUTH][LOGIN] sending:', { email });
    const r = await api.post('/auth/login', { email, password });
    console.log('[CLIENT][AUTH][LOGIN] response message:', r.data?.message);
    return r.data;
  },
  register: async (name, email, password, role = 'user') => {
    console.log('[CLIENT][AUTH][REGISTER] sending:', { name, email, role });
    const r = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
    });
    console.log('[CLIENT][AUTH][REGISTER] response message:', r.data?.message);
    return r.data;
  },
  getMe: () => api.get('/auth/me').then((r) => r.data),
};

export const examService = {
  submitForm: (course, education, termsAccepted) =>
    api.post('/exam/form', { course, education, termsAccepted }).then((r) => r.data),
  verifyOTP: (email, otp, examSessionId) =>
    api.post('/exam/verify-otp', { email, otp, examSessionId }).then((r) => r.data),
  requestOTP: (examSessionId) =>
    api.post('/exam/request-otp', { examSessionId }).then((r) => r.data),
  startExam: (selectedLanguages) =>
    api.post('/exam/start', { selectedLanguages }).then((r) => r.data),
  getQuestions: (examSessionId) =>
    api.get(`/exam/session/${examSessionId}/questions`).then((r) => r.data),
  submitExam: (examSessionId, answers) =>
    api.post('/exam/submit', { examSessionId, answers }).then((r) => r.data),
  logCheating: (examSessionId, eventType) =>
    api.post('/exam/cheating', { examSessionId, eventType }).then((r) => r.data),
  getResult: (examSessionId) =>
    api.get(`/exam/session/${examSessionId}/result`).then((r) => r.data),
  getStatus: (examSessionId) =>
    api.get(`/exam/session/${examSessionId}/status`).then((r) => r.data),
};

export default api;
