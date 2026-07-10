# afiet (family-health)

Ailece sağlıklı beslenme/aktivite takibi ve oyunlaştırma için mobil-öncelikli
uygulama. Hobi projesi. UI dili tamamen Türkçe. Yol haritası: `ROADMAP.md`.

**Monorepo** (npm workspaces): web uygulaması `apps/web/` altındadır
(`@afiet/web`); paylaşılan çekirdek `packages/core/` ve Expo uygulaması
`apps/mobile/` kademeli olarak ekleniyor. Aşağıdaki `src/...` yolları
`apps/web/src/...` olarak okunur.

Marka rehberi: `BRAND.md` — isim yazımı (hep küçük harf "afiet"), ses tonu,
tagline ("Sayma, dengele.") ve logo kuralları orada. UI metni yazarken uy.
İkon PNG'leri `apps/web/public/icon.svg`den `node apps/web/scripts/generate-icons.mjs`
ile üretilir. IndexedDB adı (`family-health`) ve `fh:` localStorage önekleri
rebrand'e rağmen DEĞİŞMEZ — mevcut kullanıcı verisini korur.

## Stack (web)

- Vite + React 19 + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`)
- `react-router` (v7, `react-router` paketi — `react-router-dom` değil)
- Dexie (IndexedDB) — veri tamamen cihazda, backend yok
- `vite-plugin-pwa` — autoUpdate, manifest `vite.config.ts` içinde

## Komutlar (kökten çalışır)

- `npm run dev` — web geliştirme sunucusu
- `npm run build` — `tsc --noEmit` + vite build (PWA manifest + SW üretir)
- `npm run preview` — build önizleme
- `npm run typecheck` — tüm workspace'lerde tip kontrolü
- `npm run smoke` — build edilmiş uygulamada uçtan uca smoke testi
  (`apps/web/scripts/smoke.mjs`, yerel Chrome ile)
- `npm install` HER ZAMAN kökten — tek lockfile köktedir

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

- `main` = production; her push Vercel'i otomatik deploy eder
  (Vercel projesinde Root Directory = `apps/web`).
- SemVer; kaynak gerçeklik `apps/web/package.json`. Sürüm UI'a `__APP_VERSION__`
  define'ı ile gömülür (`vite.config.ts`). Kök `CHANGELOG.md` web'indir.
- Her anlamlı değişiklik commit'ine `CHANGELOG.md` → `[Yayınlanmadı]`
  bölümüne madde eklenir (✨ Yeni / 🔧 İyileştirme / 🐛 Düzeltme).
- Release `/release` komutuyla yapılır (`.claude/skills/release/SKILL.md`):
  bump + changelog derleme + `apps/web/src/data/changelog.ts` senkronu + tag +
  GitHub Release. `changelog.ts`'e release dışında dokunulmaz.
- Uygulama içi "Yenilikler ✨" sheet'i güncelleme sonrası bir kez gösterilir
  (localStorage `fh:lastSeenVersion`), Profil sayfasından tekrar açılır.

## Doğrulama

Web'e dokunan her değişiklikten sonra: `npm run build && npm run smoke`.
Playwright (`playwright-core` devDependency) kuruludur; uzak ortamlarda
Chromium'u `executablePath: '/opt/pw-browsers/chromium'` ile başlat
(smoke betiği bu Mac'te yerel Chrome kullanır).
