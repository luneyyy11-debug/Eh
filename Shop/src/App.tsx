import { Navigate, Route, Routes, useLocation, useNavigate, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ToastViewport, useConfirm } from './components/ui'
import { useApp } from './context/AppContext'
import { Icon, type IconName } from './components/Icon'
import { useI18n } from './i18n/I18nProvider'
import DashboardPage from './pages/Dashboard'
import LoginPage from './pages/Login'
import AddStockPage from './pages/AddStock'
import StockPage from './pages/Stock'
import UnitDetailsPage from './pages/UnitDetails'
import SellPhonePage from './pages/SellPhone'
import SalesHistoryPage from './pages/SalesHistory'
import SaleReceiptPage from './pages/SaleReceipt'
import ReportsPage from './pages/Reports'
import CataloguePage from './pages/Catalogue'
import SyncCentrePage from './pages/SyncCentre'
import SettingsPage from './pages/Settings'

interface NavItem {
  to: string
  key: string
  icon: IconName
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', key: 'nav.dashboard', icon: 'dashboard' },
  { to: '/add', key: 'nav.addStock', icon: 'plusCircle' },
  { to: '/stock', key: 'nav.stock', icon: 'box' },
  { to: '/sell', key: 'nav.sell', icon: 'scan' },
  { to: '/sales', key: 'nav.sales', icon: 'receipt' },
  { to: '/reports', key: 'nav.reports', icon: 'chart' },
  { to: '/catalogue', key: 'nav.catalogue', icon: 'catalogue' },
  { to: '/sync', key: 'nav.sync', icon: 'sync' },
  { to: '/settings', key: 'nav.settings', icon: 'settings' }
]

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useApp()
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function NavItemLink({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
  return (
    <NavLink to={to} className={className}>
      {children}
    </NavLink>
  )
}

function Shell({ children }: { children: ReactNode }) {
  const { session, logout, online } = useApp()
  const { t } = useI18n()
  const confirm = useConfirm()
  const location = useLocation()

  const isActive = (to: string) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to))

  const doLogout = async () => {
    const ok = await confirm(t('common.signOut'), t('common.signOut'))
    if (ok) logout()
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="phone" size={22} />
          </span>
          <span className="brand-text">
            <strong>Dukan Mobile</strong>
            <small>Mobile shop system</small>
          </span>
        </div>
        <nav className="side-nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavItemLink key={item.to} to={item.to} className={isActive(item.to) ? 'active' : ''}>
              <Icon name={item.icon} size={19} />
              <span>{t(item.key as never)}</span>
            </NavItemLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className={`conn ${online ? 'conn-on' : 'conn-off'}`}>
            <span className="conn-dot" />
            {online ? t('common.online') : t('common.offline')}
          </div>
          <div className="side-user">
            <div className="side-user-meta">
              <strong>{session?.user.name}</strong>
              <small>{session?.user.role === 'owner' ? t('common.owner') : t('common.cashier')}</small>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void doLogout()}>
              {t('common.signOut')}
            </button>
          </div>
        </div>
      </aside>
      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>
      <nav className="bottom-nav" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <NavItemLink key={item.to} to={item.to} className={isActive(item.to) ? 'active' : ''}>
            <Icon name={item.icon} size={20} />
            <span>{t(item.key as never)}</span>
          </NavItemLink>
        ))}
      </nav>
      <ToastViewport />
    </div>
  )
}

export default function App() {
  const { session } = useApp()
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route
        element={
          <RequireAuth>
            <Shell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/add" element={<AddStockPage />} />
                <Route path="/stock" element={<StockPage />} />
                <Route path="/stock/:unitId" element={<UnitDetailsPage />} />
                <Route path="/sell" element={<SellPhonePage />} />
                <Route path="/sales" element={<SalesHistoryPage />} />
                <Route path="/sales/:saleId" element={<SaleReceiptPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/catalogue" element={<CataloguePage />} />
                <Route path="/sync" element={<SyncCentrePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Shell>
          </RequireAuth>
        }
      >
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function NotFound() {
  const { t } = useI18n()
  const navigate = useNavigate()
  return (
    <div className="page-loading">
      <h2>{t('notFound.title')}</h2>
      <p>{t('notFound.hint')}</p>
      <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
        {t('notFound.home')}
      </button>
    </div>
  )
}
