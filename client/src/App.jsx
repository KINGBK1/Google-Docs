import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState, useEffect } from "react";
import LoginPage from "./components/Auth/Auth";
import Dashboard from "./components/Dashboard/Dashboard";

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token");
      const isValid = !!token;
      setIsAuthenticated(isValid);
    };

    checkToken();
    window.addEventListener("storage", checkToken); 
    return () => {
      window.removeEventListener("storage", checkToken);
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId="35252208750-bg9s2h22ke7nc1v3v3n5jkdcsa1siulv.apps.googleusercontent.com">
      <Router>
        <Routes>
          {/* Public route */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage setAuth={setIsAuthenticated} />
              )
            }
          />

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
