# afiet (afiet-mobile)

Ailece sağlıklı beslenme/aktivite takibi ve oyunlaştırma için mobil-öncelikli
uygulama. Hobi projesi. UI dili tamamen Türkçe. Yol haritası: `ROADMAP.md`.

**Monorepo** (npm workspaces): paylaşılan çekirdek `packages/core/`
(`@afiet/core`) ve Expo uygulaması `apps/mobile/` (`@afiet/mobile`) içerir.
Web uygulaması (afiet.co) ayrı `afiet-web` reposuna taşındı — bu repo artık
yalnızca mobil.

Marka rehberi: `BRAND.md` — isim yazımı (hep küçük harf "afiet"), ses tonu,
tagline ("Sayma, dengele.") ve logo kuralları orada. UI metni yazarken uy.
İkon PNG'leri `apps/mobile/assets/icon.svg`den
`node apps/mobile/scripts/generate-assets.mjs` ile üretilir.

## Komutlar (kökten çalışır)

- `npm run typecheck` — tüm workspace'lerde tip kontrolü
- `npm run mobile` — Expo Go başlatır (ayrıntı: aşağıdaki Mobil bölümü)
- `npm install` HER ZAMAN kökten — tek lockfile köktedir

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

- UI, veriye YALNIZCA `src/data/repositories` arayüzleri üzerinden erişir.
  İleride backend eklenirse yeni implementasyon yazılır, UI değişmez.
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
  typecheck + expo export çalıştırır.
- Mobil, web'den BAĞIMSIZ sürümlenir; kaynak gerçeklik
  `apps/mobile/package.json` + `app.json`, tag'ler `mobile-vX.Y.Z`
  (tag push'u sonrası EAS build + TestFlight otomatik). Kök `CHANGELOG.md`
  web'in bu repoda yaşadığı dönemin arşividir (bkz. dosyanın başındaki
  not); aktif changelog `apps/mobile/CHANGELOG.md`dir.
- Her anlamlı mobil değişiklik commit'ine `apps/mobile/CHANGELOG.md` →
  `[Yayınlanmadı]` bölümüne madde eklenir (✨ Yeni / 🔧 İyileştirme / 🐛 Düzeltme).
- Release `/release` komutuyla yapılır (`.claude/skills/release/SKILL.md`):
  changelog derleme + version bump + tag + push; gerisini GitHub Actions
  yürütür.

## Doğrulama

Her değişiklikten sonra: kökten `npm run typecheck`, ardından `apps/mobile`
içinden `npx expo export --platform ios --platform android`.
