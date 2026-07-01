import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TopNav from '@/components/layout/TopNav'
import DashboardPage from '@/pages/DashboardPage'
import DealsPage from '@/pages/DealsPage'
import PositionsPage from '@/pages/PositionsPage'
import PeoplePage from '@/pages/PeoplePage'
import ProfilePage from '@/pages/people/ProfilePage'
import AccountsPage from '@/pages/AccountsPage'
import StatsPage from '@/pages/StatsPage'
import DemoPage from '@/pages/DemoPage'
import { RoleProvider } from '@/roles/role-context'

function App() {
  return (
    <RoleProvider>
    <BrowserRouter>
      <div className="h-screen bg-sidebar overflow-hidden flex flex-col">
        <TopNav />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/positions" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/positions" element={<PositionsPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/people/profile/:personId" element={<ProfilePage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/demo" element={<DemoPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
    </RoleProvider>
  )
}

export default App
