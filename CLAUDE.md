# afiet (afiet-mobile)

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
rebrand ve repo adı değişikliklerine rağmen DEĞİŞMEZ — mevcut kullanıcı
verisini korur.

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

## Mobil (apps/mobile) konvansiyonları

- Expo SDK 57, expo-router (`src/app`, typedRoutes), NativeWind v4. React iki
  uygulamada da **exact aynı sürüm** kalmalı (çift kopya Metro'yu kırar).
- Token sınıfları (`bg-canvas`, `text-ink`…) mobilde de çalışır ve otomatik
  koyulaşır — kaynak `src/global.css` + `tailwind.config.js`, web
  `index.css`in aynasıdır, BİRLİKTE güncellenir. Style-objesi gereken yerde
  `tokens` (`src/theme/useTheme.ts`).
- Metin için `AppText` (weight→Nunito ailesi); ikonlar `src/ui/icons.tsx`
  (web ikonlarının react-native-svg portu — ikon eklerken iki dosya birlikte).
  Grup/öğün ikon-renkleri `src/ui/appIcons.tsx` ([açık, koyu] hex çiftleri).
  TextInput'ta büyük punto text-* sınıfıyla DEĞİL style ile verilir
  (NativeWind lineHeight'ı iOS'ta yazıyı kırpar).
- Veri: `src/data/repositories` (arayüzler @afiet/core, impl expo-sqlite
  `afiet.db`); şema değişikliği `src/data/db.ts` MIGRATIONS dizisine YENİ
  eleman. Reaktivite `useLive(tablolar, sorgu, deps)` — web'in
  `useLiveQuery`sinin karşılığı; repo mutasyonları `notify()` çağırır.
- Tercihler AsyncStorage'da, web ile aynı `fh:*` anahtarları; açılışta splash
  arkasında hidre edilir (`_layout.tsx`). FTUE bayrakları
  `features/ftue/ftueFlags.ts` (web API'siyle birebir).
- Sheet'ler `src/ui/Sheet.tsx` (@gorhom/bottom-sheet sarmalayıcı, web ile
  aynı props): içinde TextInput yerine `BottomSheetTextInput`; içinde kendi
  kaydıranı (tarih çarkı vb.) olan sheet'e `contentPanning={false}`. Çark
  tarzı seçicilerde FlatList KULLANMA — sanallaştırma boş sütun/jank yapar,
  DIY ScrollView kullan (`src/ui/inputs/WheelPicker.tsx` örnek).
- Haptik dili: adımlayıcı/çark geçişinde `Haptics.selectionAsync()`,
  kayıt başarısında `notificationAsync(Success)`.
- "afiet + Sayma, dengele." başlığı (`src/ui/BrandHeader.tsx`) Bugün'ün
  KALICI parçasıdır (BRAND.md wordmark referansı) — kaldırma.
- Marka görselleri `scripts/generate-assets.mjs` ile üretilir (ikon,
  adaptive, splash). app.json'da İKİ splash var: plugin görseli (native
  build) + klasik `splash` anahtarı (Expo Go yükleme ekranı bunu okur).
- Çalıştırma: kökten `npm run mobile` → Expo Go (telefonda ya da `--ios`
  ile simülatörde). Elle `npx expo ...` çağıracaksan HEP apps/mobile
  İÇİNDEN (kökten çalıştırmak yanlış entry çözer). Doğrulama:
  `npm run typecheck` + `npx expo export --platform ios --platform android`
  (apps/mobile içinden).

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

- Dal modeli: `feature/*` → `development` → `staging` → `main`
  (haftalık release). Ayrıntı ve ortam eşlemesi: `docs/BRANCHING.md`.
  CI (`.github/workflows/ci.yml`) bu üç dala giden PR/push'larda
  typecheck + web build + smoke + expo export çalıştırır.
- `main` = production; her push Vercel'i otomatik deploy eder
  (Vercel projesinde Root Directory = `apps/web`, "Include source files
  outside of the Root Directory" açık; `vercel.json` bu yüzden
  `apps/web/` içindedir — köke KOYMA).
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
(smoke betiği bu Mac'te yerel Chrome'u, CI'da `CHROME_PATH` env'ini kullanır).
