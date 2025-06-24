import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';

import LoginPage from './components/Auth/Auth';
import Dashboard from './components/Dashboard/Dashboard';
import TextEditor from './components/Text Editor/TextEditor';
import Error from './components/ErrorPage/Error';

// Checks cookie & expiration
function useAuthCheck() {
  const [status, setStatus] = useState({ loading: true, auth: false });
  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (token) {
      try {
        const { exp } = jwtDecode(token);
        if (exp * 1000 > Date.now()) {
          return setStatus({ loading: false, auth: true });
        }
      } catch {}
    }
    setStatus({ loading: false, auth: false });
  }, []);
  return status;
}

function ProtectedRoute({ auth, loading, children }) {
  if (loading) return <div>Loading…</div>;
  return auth ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { loading, auth } = useAuthCheck();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            loading
              ? null
              : auth
              ? <Navigate to="/dashboard" replace />
              : <LoginPage />
          }
        />

        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute auth={auth} loading={loading}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents/:documentId"
          element={
            <ProtectedRoute auth={auth} loading={loading}>
              <TextEditor />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Error />} /> 
      </Routes>
    </BrowserRouter>
  );
}
