import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  ArrowLeftRight,
  Building2,
  Users,
  BarChart3,
  Bell,
  Globe,
  RefreshCw,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Search,
  Sun,
  Moon,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/goals', label: 'Goals', icon: Target },
  { to: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/dashboard/virtual-accounts', label: 'Virtual Accounts', icon: Building2 },
  { to: '/dashboard/contributors', label: 'Contributors', icon: Users },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell, badge: 3 },
  { to: '/dashboard/community', label: 'Community Projects', icon: Globe },
  { to: '/dashboard/reconciliation', label: 'Reconciliation', icon: RefreshCw },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/goals': 'Goals',
  '/dashboard/goals/create': 'Create Goal',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/virtual-accounts': 'Virtual Accounts',
  '/dashboard/contributors': 'Contributors',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/community': 'Community Projects',
  '/dashboard/reconciliation': 'Reconciliation',
  '/dashboard/settings': 'Settings',
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dark, setDark] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const pageTitle = pageTitles[location.pathname] || 'Dashboard'

  return (
    <div className={`flex min-h-screen bg-[#F8FAFC] ${dark ? 'dark' : ''}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300
          ${sidebarOpen ? 'w-64' : 'w-0 lg:w-16'} overflow-hidden bg-dark`}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          {sidebarOpen && <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">ThriveFund</span>}
        </div>

        <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, badge }) => {
            const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm group
                  ${isActive ? 'bg-primary text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="flex-1 text-left font-medium whitespace-nowrap">{label}</span>}
                {sidebarOpen && badge && !isActive && (
                  <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                AO
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">Adebayo Okonkwo</p>
                <p className="text-slate-500 text-xs truncate">adebayo@thrivefund.ng</p>
              </div>
              <button onClick={() => navigate('/')} className="text-slate-500 hover:text-white transition-colors">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-dark transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
            </button>
            <h1 className="text-base font-semibold text-dark">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 text-sm text-slate-500">
              <Search size={14} />
              <input placeholder="Search..." className="bg-transparent outline-none w-40 text-dark placeholder:text-slate-400 text-sm" />
            </div>
            <NavLink to="/dashboard/notifications" className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-dark">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </NavLink>
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-dark"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-semibold">
              AO
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
