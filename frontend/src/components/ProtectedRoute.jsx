import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children, roles = [] }) {
  const { token, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
