# Aile Sağlık (family-health)

Ailece sağlıklı beslenme/aktivite takibi ve oyunlaştırma için mobil-öncelikli PWA.
Hobi projesi. UI dili tamamen Türkçe. Yol haritası: `ROADMAP.md`.

## Stack

- Vite + React 19 + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`)
- `react-router` (v7, `react-router` paketi — `react-router-dom` değil)
- Dexie (IndexedDB) — veri tamamen cihazda, backend yok
- `vite-plugin-pwa` — autoUpdate, manifest `vite.config.ts` içinde

## Komutlar

- `npm run dev` — geliştirme sunucusu
- `npm run build` — `tsc --noEmit` + vite build (PWA manifest + SW üretir)
- `npm run preview` — build önizleme

## Tema ve ikonlar

- Dark mode: semantik token'lar (`src/index.css` — canvas/surface/muted/
  line/ink/soft/faint). Bileşenlerde ham `bg-white`/`slate-*` KULLANMA;
  token sınıflarını kullan. Aksan renklerine (emerald vb.) gerektiğinde
  `dark:` varyantı eklenir.
- Tema tercihi localStorage `fh:theme` ('light'|'dark'|yok=system);
  `<html class="dark">` index.html'deki erken script + `useTheme` yönetir.
- İkonlar: `src/ui/icons.tsx` (currentColor, duotone). Besin grubu/öğün
  ikon-renk eşlemeleri `src/ui/appIcons.tsx`. Emoji yalnızca profil
  avatarlarında ve mesaj metinlerinde kullanılır.

## Mimari kurallar

- UI, veriye YALNIZCA `src/data/repositories` arayüzleri üzerinden erişir
  (Dexie implementasyonu `repositories/dexie.ts`). İleride backend eklenirse
  yeni implementasyon yazılır, UI değişmez.
- Tarihler her yerde yerel `YYYY-MM-DD` string'i (`src/lib/dates.ts` yardımcıları).
- Aktif profil id'si localStorage `fh:activeProfileId` anahtarında; hook:
  `src/features/profile/useActiveProfile.ts`.
- Besin grubu / öğün / porsiyon sabitleri tek yerde: `src/data/types.ts`.
- Türk yemekleri seed listesi: `src/data/foods.ts`; kullanıcı girişleri
  `customFoods` tablosunda öğrenilir.
- Beslenme yaklaşımı bilinç odaklı: kalori sayımı YOK, besin grubu dengesi var.
  Mesajlar yargılamayan tonda (`src/features/nutrition/insights.ts`).

## Release ve changelog

- `main` = production; her push Vercel'i otomatik deploy eder.
- SemVer; kaynak gerçeklik `package.json`. Sürüm UI'a `__APP_VERSION__`
  define'ı ile gömülür (`vite.config.ts`).
- Her anlamlı değişiklik commit'ine `CHANGELOG.md` → `[Yayınlanmadı]`
  bölümüne madde eklenir (✨ Yeni / 🔧 İyileştirme / 🐛 Düzeltme).
- Release `/release` komutuyla yapılır (`.claude/skills/release/SKILL.md`):
  bump + changelog derleme + `src/data/changelog.ts` senkronu + tag +
  GitHub Release. `changelog.ts`'e release dışında dokunulmaz.
- Uygulama içi "Yenilikler ✨" sheet'i güncelleme sonrası bir kez gösterilir
  (localStorage `fh:lastSeenVersion`), Profil sayfasından tekrar açılır.

## Doğrulama

Playwright (`playwright-core` devDependency) kuruludur; bu ortamda Chromium'u
`executablePath: '/opt/pw-browsers/chromium'` ile başlat.
