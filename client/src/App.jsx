import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
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

const DocumentAccessGuard = ({ children }) => {
  const { documentId } = useParams();
  const [accessState, setAccessState] = useState("loading"); // "loading", "allowed", "denied", "notfound"

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/documents/${documentId}/restricted-status`,
          { withCredentials: true }
        );

        if (res.status === 200 && res.data.isEligible === false) {
          setAccessState("allowed");
        } else {
          setAccessState("denied");
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setAccessState("notfound");
        } else {
          setAccessState("denied");
        }
      }
    };

    checkAccess();
  }, [documentId]);

  if (accessState === "loading") return <div>Checking document access...</div>;
  if (accessState === "denied") return <Navigate to={`/restricted/${documentId}`} replace />;
  if (accessState === "notfound") return <Navigate to="/404" replace />;
  return children;
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
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                <DocumentAccessGuard>
                  <TextEditor setIsAuthenticated={setIsAuthenticated} />
                </DocumentAccessGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/restricted/:documentId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                <RestrictedUserPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Error />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
