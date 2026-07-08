import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router'
import { TodayPage } from './features/nutrition/TodayPage'
import { HistoryPage } from './features/nutrition/HistoryPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { useActiveProfile } from './features/profile/useActiveProfile'

const TABS = [
  { to: '/', label: 'Bugün', emoji: '🍽️' },
  { to: '/gecmis', label: 'Geçmiş', emoji: '📅' },
  { to: '/profil', label: 'Profil', emoji: '👤' },
]

function TabBar() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                isActive ? 'text-emerald-600' : 'text-slate-400'
              }`
            }
          >
            <span className="text-xl">{t.emoji}</span>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function Shell() {
  const { id, loading } = useActiveProfile()
  const location = useLocation()

  // Profil seçilmeden diğer sayfalara girilmez
  if (!loading && id === null && location.pathname !== '/profil') {
    return <Navigate to="/profil" replace />
  }

  return (
    <div className="min-h-dvh">
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/gecmis" element={<HistoryPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
