import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage.jsx'
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx'
import HistoryPage from '../features/history/pages/HistoryPage.jsx'
import UsersPage from '../features/users/pages/UsersPage.jsx'
import RequireAuth from '../features/auth/routes/RequireAuth.jsx'
import { useAuth } from '../features/auth/context/AuthContext.jsx'
import ServerErrorPage from '../shared/components/ServerErrorPage.jsx'
import {
  SERVER_ERROR_EVENT,
  SERVER_RECOVERY_EVENT,
} from '../shared/services/serverStatus.js'

function App() {
  const { isAuthenticated, login } = useAuth()
  const [serverError, setServerError] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleServerError = (event) => {
      setServerError(
        event?.detail ?? {
          status: 500,
          message: 'The server is currently unavailable.',
        },
      )
    }

    const handleServerRecovery = () => {
      setServerError(null)
    }

    window.addEventListener(SERVER_ERROR_EVENT, handleServerError)
    window.addEventListener(SERVER_RECOVERY_EVENT, handleServerRecovery)

    return () => {
      window.removeEventListener(SERVER_ERROR_EVENT, handleServerError)
      window.removeEventListener(SERVER_RECOVERY_EVENT, handleServerRecovery)
    }
  }, [])

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage onLogin={login} />
              )
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/history"
            element={
              <RequireAuth>
                <HistoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="/users"
            element={
              <RequireAuth>
                <UsersPage />
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
          />
        </Routes>
      </BrowserRouter>
      <ServerErrorPage
        detail={serverError}
        onRetry={() => window.location.reload()}
      />
    </>
  )
}

export default App
