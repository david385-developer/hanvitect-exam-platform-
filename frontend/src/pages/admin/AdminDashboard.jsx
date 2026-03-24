import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import '../../App.css';
import './AdminDashboard.css';

const panels = ['analytics', 'users', 'questions', 'results', 'violations', 'config'];

export function AdminDashboard() {
  const [active, setActive] = useState('analytics');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [violations, setViolations] = useState([]);
  const [config, setConfig] = useState({ courses: [], languages: [] });
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const r = await adminService.getAnalytics();
        setAnalytics(r.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  useEffect(() => {
    const refresh = async () => {
      if (active === 'users') {
        const r = await adminService.getUsers({ search });
        setUsers(r.data.users);
      }
      if (active === 'questions') {
        const r = await adminService.getQuestions();
        setQuestions(r.data.questions);
      }
      if (active === 'results') {
        const r = await adminService.getResults();
        setResults(r.data.results);
      }
      if (active === 'violations') {
        const r = await adminService.getViolations();
        setViolations(r.data);
      }
      if (active === 'config') {
        const r = await adminService.getConfig();
        setConfig(r.data);
      }
    };

    refresh();
  }, [active, search]);

  const toggleBlock = async (userId, blocked) => {
    try {
      await adminService.blockUser(userId, blocked);
      setAlert(`User ${blocked ? 'blocked' : 'unblocked'} successfully`);
      const r = await adminService.getUsers({ search });
      setUsers(r.data.users);
    } catch (err) {
      console.error(err);
      setAlert('Failed to update user status');
    }
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>Admin</h2>
        <nav>
          {panels.map((name) => (
            <button key={name} className={active === name ? 'active' : ''} onClick={() => setActive(name)}>
              {name.replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </nav>
        <button className="btn-secondary" onClick={() => navigate('/logout')}>Logout</button>
      </aside>

      <main className="admin-main">
        {alert && <div className="admin-alert">{alert}</div>}
        {loading && <p>Loading...</p>}
        {!loading && active === 'analytics' && analytics && (
          <div className="admin-grid">
            <div className="admin-card">Total Users: {analytics.totalUsers}</div>
            <div className="admin-card">Total Exams: {analytics.totalExams}</div>
            <div className="admin-card">Pass: {analytics.passCount}</div>
            <div className="admin-card">Fail: {analytics.failCount}</div>
            <div className="admin-card">Violations: {analytics.violationsCount}</div>
          </div>
        )}

        {!loading && active === 'users' && (
          <>
            <div className="table-toolbar">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" />
            </div>
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.isBlocked ? 'Blocked' : 'Active'}</td>
                    <td>
                      <button onClick={() => toggleBlock(u._id, !u.isBlocked)}>
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {!loading && active === 'questions' && (
          <>
            <table className="admin-table">
              <thead>
                <tr><th>Question</th><th>Course</th><th>Language</th><th>Options</th></tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id}>
                    <td>{q.question}</td>
                    <td>{q.course}</td>
                    <td>{q.language}</td>
                    <td>{q.options.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {!loading && active === 'results' && (
          <>
            <table className="admin-table">
              <thead>
                <tr><th>User</th><th>Course</th><th>Score</th><th>Percentage</th><th>Pass/Fail</th></tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r._id}>
                    <td>{r.userId?.name || 'Anonymous'} ({r.userId?.email})</td>
                    <td>{r.course}</td>
                    <td>{r.correct}/{r.totalQuestions}</td>
                    <td>{r.percentage}%</td>
                    <td>{r.passFail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {!loading && active === 'violations' && (
          <table className="admin-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Cheating Events</th><th>Sessions</th></tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr key={v.userId || v.email}>
                  <td>{v.name || 'Unknown'}</td>
                  <td>{v.email || 'N/A'}</td>
                  <td>{v.totalCheating}</td>
                  <td>{v.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && active === 'config' && (
          <div className="admin-grid config-grid">
            <div className="admin-card"><strong>Courses</strong><ul>{config.courses.map((c) => <li key={c}>{c}</li>)}</ul></div>
            <div className="admin-card"><strong>Languages</strong><ul>{config.languages.map((l) => <li key={l}>{l}</li>)}</ul></div>
          </div>
        )}
      </main>
    </div>
  );
}