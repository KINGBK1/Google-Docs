import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

import LoginPage from "./components/Auth/Auth";
import Dashboard from "./components/Dashboard/Dashboard";
import TextEditor from "./components/Text Editor/TextEditor";
import Error from "./components/ErrorPage/Error";
import RestrictedUserPage from "./components/RestrictedUserPage/RestrictedUserPage";

const ProtectedRoute = ({ isAuthenticated, isLoading, children }) => {
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const checkCookieToken = () => {
      const token = getCookie("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const isExpired = decoded.exp * 1000 < Date.now();
          setIsAuthenticated(!isExpired);
        } catch (err) {
          console.error("Invalid token", err);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkCookieToken();
  }, []);

  return (
    <GoogleOAuthProvider clientId={client_id}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isLoading ? null : isAuthenticated ? (
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
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Anyone can access document routes, TextEditor handles restrictions internally */}
          <Route path="/documents/:documentId" element={<TextEditor />} />
          <Route path="/restricted/:documentId" element={<RestrictedUserPage />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
