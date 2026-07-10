import { useEffect } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router'
import { HomePage } from './features/home/HomePage'
import { NutritionPage } from './features/nutrition/NutritionPage'
import { FoodsPage } from './features/nutrition/FoodsPage'
import { BodyPage } from './features/body/BodyPage'
import { HistoryPage } from './features/nutrition/HistoryPage'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { PrivacyPage } from './features/legal/PrivacyPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { WhatsNewAutoPrompt } from './features/changelog/WhatsNewSheet'
import { useActiveProfile } from './features/profile/useActiveProfile'
import { IconBowl, IconCalendar, IconUser } from './ui/icons'

// Bugün sekmesi, dashboard'dan açılan alt ekranlarda da aktif görünür
const HOME_PATHS = ['/', '/beslenme', '/beslenme/besinler', '/vucudum']

const TABS = [
  { to: '/', label: 'Bugün', Icon: IconBowl },
  { to: '/gecmis', label: 'Geçmiş', Icon: IconCalendar },
  { to: '/profil', label: 'Profil', Icon: IconUser },
]

/** Sayfa değişince en üstten başla — önceki ekranın scroll'u taşınmasın */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

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
  const { profile, loading } = useActiveProfile()

  if (loading) return null

  // İlk kullanım: profil onboarding akışında oluşturulur
  if (!profile) {
    return (
      <>
        <OnboardingPage />
        <WhatsNewAutoPrompt />
      </>
    )
  }

  return (
    <div className="min-h-dvh">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/beslenme" element={<NutritionPage />} />
        <Route path="/beslenme/besinler" element={<FoodsPage />} />
        <Route path="/vucudum" element={<BodyPage />} />
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
      <ScrollToTop />
      <Routes>
        {/* Herkese açık: profil/onboarding kapısının dışında —
            App Store & TestFlight gizlilik bağlantısı buraya işaret eder */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Shell />} />
      </Routes>
    </BrowserRouter>
  )
}
