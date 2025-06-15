import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import LoginPage from "./components/Auth/Auth";
import Dashboard from "./components/Dashboard/Dashboard";
import TextEditor from "./components/Text Editor/TextEditor";
import Error from "./components/ErrorPage/Error";
// import dotenv from 'dotenv'

// dotenv.config() ; 

const ProtectedRoute = ({ isAuthenticated, children, isLoading }) => {
  if (isLoading) return null; // wait before checking
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token"); // getting the token from the localstorage
      if (token) {
        try {
          const decoded = jwtDecode(token); // extracring the expiry time fron the token 
          const isExpired = decoded.exp * 1000 < Date.now();
          if (!isExpired) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("token"); // if tocken is expired remove it from the local storage 
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error("Invalid token", err);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false); // checking is done now we can move furteher 
    };

    checkToken();
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

          <Route
            path="/documents/:documentId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                <TextEditor />
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
