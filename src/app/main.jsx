import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import { NotificationProvider } from '../shared/contexts/NotificationContext.jsx'
import { AuthProvider } from '../features/auth/context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </NotificationProvider>
  </StrictMode>,
)
