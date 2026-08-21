import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isKeyConfigured = PUBLISHABLE_KEY && !PUBLISHABLE_KEY.includes('YOUR_CLERK_PUBLISHABLE_KEY');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isKeyConfigured ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App missingKey={true} />
    )}
  </React.StrictMode>,
)

