import axios from 'axios';

const api = axios.create({
  // Explicit base URL for predictable integration (avoids relying on dev proxy).
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://hanvitect-exam-platform.onrender.com/api',
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
    console.log('[CLIENT][AUTH][user-login] sending:', { email });
    const r = await api.post('/auth/user/login', { email, password });
    console.log('[CLIENT][AUTH][user-login] response message:', r.data?.message);
    return r.data;
  },
  register: async (name, email, password) => {
    console.log('[CLIENT][AUTH][user-register] sending:', { name, email });
    const r = await api.post('/auth/user/register', {
      name,
      email,
      password,
    });
    console.log('[CLIENT][AUTH][user-register] response message:', r.data?.message);
    return r.data;
  },
  getMe: () => api.get('/auth/me').then((r) => r.data),
};

export const adminAuthService = {
  login: async (email, password) => {
    console.log('[CLIENT][AUTH][admin-login] sending:', { email });
    const r = await api.post('/auth/admin/login', { email, password });
    console.log('[CLIENT][AUTH][admin-login] response message:', r.data?.message);
    return r.data;
  },
  getMe: () => api.get('/auth/admin/me').then((r) => r.data),
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

export const adminService = {
  getAnalytics: () => api.get('/admin/analytics').then((r) => r.data),
  getUsers: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  blockUser: (userId, isBlocked) => api.patch(`/admin/users/${userId}/block`, { isBlocked }).then((r) => r.data),
  getQuestions: (params) => api.get('/admin/questions', { params }).then((r) => r.data),
  createQuestion: (payload) => api.post('/admin/questions', payload).then((r) => r.data),
  updateQuestion: (questionId, payload) => api.put(`/admin/questions/${questionId}`, payload).then((r) => r.data),
  deleteQuestion: (questionId) => api.delete(`/admin/questions/${questionId}`).then((r) => r.data),
  getResults: (params) => api.get('/admin/results', { params }).then((r) => r.data),
  getViolations: () => api.get('/admin/violations').then((r) => r.data),
  getConfig: () => api.get('/admin/config').then((r) => r.data),
};

export default api;
