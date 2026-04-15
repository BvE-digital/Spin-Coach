import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './components/auth/LoginPage'
import { SetupForm } from './components/session/SetupForm'
import { DebriefScreen } from './components/session/DebriefScreen'
import { SummaryScreen } from './components/session/SummaryScreen'
import { HistoryList } from './components/history/HistoryList'
import { ManagerDashboard } from './components/dashboard/ManagerDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/session/setup" replace />} />
            <Route path="/session/setup" element={<SetupForm />} />
            <Route path="/session/debrief" element={<DebriefScreen />} />
            <Route path="/session/summary" element={<SummaryScreen />} />
            <Route path="/history" element={<HistoryList />} />
            <Route path="/history/:id" element={<HistoryList />} />
            <Route path="/dashboard" element={<ManagerDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
