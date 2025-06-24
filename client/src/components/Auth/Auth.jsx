import React, { useState, useEffect } from 'react';
import "./Auth.css";
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SkeletonDashboard from './skeletal-loader/skeletal-loader';

function LoginPage({ setAuth }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => setIsLoading(false), 10000); // 
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  const handleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/google-login`,
        { token: credentialResponse.credential },
        { withCredentials: true }
      );

      if (res.status === 200) {
        setIsLoading(false);
        setAuth(true);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Google Login Failed:", err.response?.data || err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className={`fade-wrapper ${isLoading ? 'loading' : ''}`}>
      {isLoading ? (
        <SkeletonDashboard />
      ) : (
        <div className="light-wrapper">
          <div className="signin-card">
            <div className="image-pane" />
            <div className="login-pane">
              <h1>Welcome to BK-GDocs</h1>
              <p>Sign in with Google to start collaborating</p>
              <div className="google-login-container">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => console.log("Google Login Failed")}
                  text="continue_with"
                  theme="filled_black"
                  shape="pill"
                  size="large"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
