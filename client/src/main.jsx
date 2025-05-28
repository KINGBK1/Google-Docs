// main.jsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
<StrictMode>
  <GoogleOAuthProvider clientId="35252208750-bg9s2h22ke7nc1v3v3n5jkdcsa1siulv.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
</StrictMode>

)
