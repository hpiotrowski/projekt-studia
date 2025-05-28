import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Render the app (StrictMode removed to prevent Keycloak double initialization)
createRoot(document.getElementById('root')).render(
  <App />
)
