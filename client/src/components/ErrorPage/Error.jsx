import React from 'react'
import "./Error.css"
import { useNavigate } from 'react-router-dom';

const Error = () => {
    const navigate = useNavigate();

    return (
        <div className='error-page'>
            <div className="animated-bg"></div>

            <div className="error-content">
                <img src="assets/Google_Docs_Logo.svg" alt="" className="comp-logo" />
                <h1>404 | Page Not Found</h1>
                <h3>You Must Login First to Continue</h3>
                <button onClick={() => navigate('/')}>Login</button>
            </div>
        </div>
    )
}

export default Error;
