import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import GoalsPage from './pages/dashboard/GoalsPage'
import CreateGoalPage from './pages/dashboard/CreateGoalPage'
import TransactionsPage from './pages/dashboard/TransactionsPage'
import VirtualAccountsPage from './pages/dashboard/VirtualAccountsPage'
import ContributorsPage from './pages/dashboard/ContributorsPage'
import AnalyticsPage from './pages/dashboard/AnalyticsPage'
import NotificationsPage from './pages/dashboard/NotificationsPage'
import CommunityPage from './pages/dashboard/CommunityPage'
import ReconciliationPage from './pages/dashboard/ReconciliationPage'
import SettingsPage from './pages/dashboard/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="goals/create" element={<CreateGoalPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="virtual-accounts" element={<VirtualAccountsPage />} />
        <Route path="contributors" element={<ContributorsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="reconciliation" element={<ReconciliationPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
