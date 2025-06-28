import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState, useEffect } from "react";
import axios from "axios";

import LoginPage from "./components/Auth/Auth";
import Dashboard from "./components/Dashboard/Dashboard";
import TextEditor from "./components/Text Editor/TextEditor";
import Error from "./components/ErrorPage/Error";
import RestrictedUserPage from "./components/RestrictedUserPage/RestrictedUserPage";

const ProtectedRoute = ({ isAuthenticated, isLoading, children }) => {
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/status`,
          { withCredentials: true }
        );
        if (res.status === 200 && res.data.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <GoogleOAuthProvider clientId={client_id} scope="https://www.googleapis.com/auth/drive.file">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isLoading ? (
                <div style={{ textAlign: "center", marginTop: "20vh" }}>Loading...</div>
              ) : isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage setAuth={setIsAuthenticated} />
              )
            }
          />

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                <Dashboard setIsAuthenticated={setIsAuthenticated} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents/:documentId"
            element={<TextEditor setIsAuthenticated={setIsAuthenticated} />}
          />

          <Route path="/restricted/:documentId" element={<RestrictedUserPage />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
