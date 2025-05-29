import React, { useState } from 'react';
import "./Auth.css";
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage({ setAuth }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isErrorName, setIsErrorName] = useState(false);
  const [isErrorPassword, setIsErrorPassword] = useState(false);
  const [isErrorConfirmPassword, setIsErrorConfirmPassword] = useState(false);

  const [nameErrorMessage, setNameErrorMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState("");

  const [nameColor, setNameColor] = useState("#000000");
  const [passwordColor, setPasswordColor] = useState("#000000");
  const [confirmPasswordColor, setConfirmPasswordColor] = useState("#000000");

  const navigate = useNavigate();

  function validate(e) {
    e.preventDefault(); // Prevent default form submission
    let isValid = true;

    // Validate Name
    if (name.trim() === "") {
      setIsErrorName(true);
      setNameErrorMessage("Name is required");
      setNameColor("red");
      isValid = false;
    } else if (name.trim().length < 3) {
      setIsErrorName(true);
      setNameErrorMessage("Name must be at least 3 characters long");
      setNameColor("red");
      isValid = false;
    } else {
      setIsErrorName(false);
      setNameErrorMessage("");
      setNameColor("green");
    }

    // Validate Password
    if (password.trim() === "") {
      setIsErrorPassword(true);
      setPasswordErrorMessage("Password is required");
      setPasswordColor("red");
      isValid = false;
    } else if (password.trim().length < 6) {
      setIsErrorPassword(true);
      setPasswordErrorMessage("Password must be at least 6 characters long");
      setPasswordColor("red");
      isValid = false;
    } else {
      setIsErrorPassword(false);
      setPasswordErrorMessage("");
      setPasswordColor("green");
    }

    // Validate Confirm Password
    if (confirmPassword.trim() === "") {
      setIsErrorConfirmPassword(true);
      setConfirmPasswordErrorMessage("Confirm Password is required");
      setConfirmPasswordColor("red");
      isValid = false;
    } else if (confirmPassword !== password) {
      setIsErrorConfirmPassword(true);
      setConfirmPasswordErrorMessage("Passwords do not match");
      setConfirmPasswordColor("red");
      isValid = false;
    } else {
      setIsErrorConfirmPassword(false);
      setConfirmPasswordErrorMessage("");
      setConfirmPasswordColor("green");
    }

    if (isValid) {
      // Perform your submit logic here (e.g., API call for regular login)
      console.log("Regular login submitted successfully!", { name, password });
      // You would typically make an API call here to authenticate the user
    }
  }

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
      console.error("Google Login Failed:", err.response?.data || err.message);
    }
  };

  return (
    <div className="signin-container">
      <div className="img-container"></div>
      <div className="form-container">
        <form onSubmit={validate} action="POST">
          <label htmlFor="name">Name : </label>
          <input
            type="text"
            id="name"
            placeholder='Enter your name'
            style={{ borderColor: nameColor }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {isErrorName && <span className="error-message">{nameErrorMessage}</span>}

          <label htmlFor="password">Password : </label>
          <input
            type="password"
            id="password"
            placeholder='Enter your password'
            style={{ borderColor: passwordColor }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isErrorPassword && <span className="error-message">{passwordErrorMessage}</span>}

          <div className="confirm-password-container">
            <label htmlFor="confirmPassword">Confirm Password : </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder='Confirm your password'
              style={{ borderColor: confirmPasswordColor }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {isErrorConfirmPassword && <span className="error-message">{confirmPasswordErrorMessage}</span>}
          </div>

          <div className="btn">
            <button type="submit">Submit</button>
          </div>
        </form>
        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log("Google Login Failed")}
            text="Sign in with Google"
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;