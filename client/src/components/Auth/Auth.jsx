import React from 'react';
import "./Auth.css";
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage({ setAuth }) {
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google", {
        token: credentialResponse.credential,
      });

      if (res.status === 200) {
        // Save user to local storage
        localStorage.setItem("user", JSON.stringify(res.data.user));

        // Update auth state
        setAuth(true);

        // Navigate to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
    }
  };

  return (
    <div className="signin-container">
      <div className="form-container">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Google Login Failed")}
        />
      </div>
    </div>
  );
}

export default LoginPage;
