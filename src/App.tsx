import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router'
import { TodayPage } from './features/nutrition/TodayPage'
import { NutritionPage } from './features/nutrition/NutritionPage'
import { HistoryPage } from './features/nutrition/HistoryPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { WhatsNewAutoPrompt } from './features/changelog/WhatsNewSheet'
import { useActiveProfile } from './features/profile/useActiveProfile'
import { IconBowl, IconCalendar, IconUser } from './ui/icons'

// Bugün sekmesi, dashboard'dan açılan alt ekranlarda da aktif görünür
const HOME_PATHS = ['/', '/beslenme', '/vucudum']

const TABS = [
  { to: '/', label: 'Bugün', Icon: IconBowl },
  { to: '/gecmis', label: 'Geçmiş', Icon: IconCalendar },
  { to: '/profil', label: 'Profil', Icon: IconUser },
]

function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((t) => {
          const active = t.to === '/' ? HOME_PATHS.includes(pathname) : pathname === t.to
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                active ? 'text-emerald-600' : 'text-faint'
              }`}
            >
              <t.Icon className="h-6 w-6" />
              {t.label}
            </NavLink>
          )
        })}
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
        <Route path="/beslenme" element={<NutritionPage />} />
        <Route path="/gecmis" element={<HistoryPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
      <WhatsNewAutoPrompt />
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
