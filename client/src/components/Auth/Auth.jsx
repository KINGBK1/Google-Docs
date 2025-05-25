import React from 'react';
import "./Auth.css";
import GoogleDocsImg from '../../assets/Google-Docs.png';
import { GoogleLogin } from '@react-oauth/google';
function LoginPage() {

  return (
    <div className="signin-container">
      <div className="img-container"></div>
      <div className="form-container">
        <div>
          <label htmlFor="name" className="name">Name : </label>
          <input type="text" />
        </div>
        <div>
          <label htmlFor="D.O.B" className="name">D.O.B : </label>
          <input type="text" />
        </div>
        {/* <div className='terms'>
          <label htmlFor="agree">I Agree to All Terms and Conditions</label>
          <input type="checkbox" name="agree"  />
        </div> */}
        <div className="g-auth">
          <GoogleLogin
            onSuccess={credentialResponse => {
              console.log(credentialResponse);
            }}
            onError={() => {
              console.log('Login Failed');
            }}
          />
        </div>
      </div>

    </div>
  );
}

export default LoginPage;

{/* <img src="Google-Docs=Clone/client/src/assets/Google-Docs.png" alt="Google-Docs" className="side-img" /> */ }