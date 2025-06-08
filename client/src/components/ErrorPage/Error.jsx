import React from 'react'
import "./Error.css"
import { useNavigate } from 'react-router-dom';

const Error = () => {

    const navigate = useNavigate() ; 
  return (
    <div className='error-page'>
        <h1>404 | Page Not Found</h1>
        <br />
        <button onClick={()=> navigate('/')}>Go To Home</button>
    </div>
  )
}

export default Error ; 