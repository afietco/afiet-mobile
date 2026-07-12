# Dallanma ve ortamlar

Solo geliştirme için üç katmanlı akış: iş feature dalında başlar, PR ile
katman katman yükselir, release haftalık ritimde `main`e iner.

## Dallar

| Dal | Rol | Web ortamı | Mobil ortamı |
| --- | --- | --- | --- |
| `main` | Production. Yalnızca `staging`den release merge'ü alır. | afiet.co (Vercel production) | TestFlight/App Store (`mobile-vX.Y.Z` tag'i) |
| `staging` | Release adayı; testerlara açılan katman. | Vercel preview (ileride staging.afiet.co) | TestFlight iç test (ileride ayrı EAS channel) |
| `development` | Günlük geliştirme entegrasyonu. | Vercel preview | Expo Go / dev build |
| `feature/*` | Tekil işler; `development`a PR açılır. | lokal | lokal (simülatör/Expo Go) |

## Akış

1. `feature/<konu>` dalında geliştir; lokalde `npm run build && npm run smoke`
   (web) ve simülatör/typecheck (mobil) ile doğrula.
2. PR: `feature/*` → `development`. CI yeşilse merge, development ortamında test.
3. `development`da birikenler hazırsa → `staging`e merge; testerlar ve gerçek
   cihazlarla çevre testi.
4. Sorun yoksa haftalık release: `staging` → `main` merge; web için `/release`,
   mobil için `mobile-vX.Y.Z` tag'i (EAS build + TestFlight otomatik).

Acil üretim düzeltmesi (hotfix) gerekirse `main`den dal alınır, düzeltme
`main`e merge edilir ve `staging`/`development`a geri taşınır (back-merge).

## CI

`.github/workflows/ci.yml` üç ana dala giden PR ve push'larda çalışır:

- **web**: `npm run typecheck` + `npm run build` + `npm run smoke`
  (headless Chrome, `CHROME_PATH=/usr/bin/google-chrome`)
- **mobil**: `npx expo export --platform ios --platform android`
  (bundle'ın derlenebildiğini kanıtlar)

`mobile-release.yml` değişmedi: `mobile-vX.Y.Z` tag'i EAS production build +
TestFlight gönderimini tetikler.

## Sonraya notlar (konuşulacak)

- **Branch koruması**: private repo GitHub Free planında klasik branch
  protection desteklemiyor; org Team planına geçilirse `main` ve `staging`e
  "zorunlu PR + yeşil CI" kuralı eklenecek. O zamana dek disiplin manuel.
- **Web ortam URL'leri**: Vercel'de `staging` ve `development` dallarına kalıcı
  domain bağlama (staging.afiet.co, dev.afiet.co).
- **Mobil katmanlar**: EAS channel'ları (development/preview/production),
  EAS Update ile katman başına OTA güncelleme, TestFlight iç/dış test grubu
  eşlemesi ve Play Store internal/closed track karşılıkları.
- **Backend (yakında)**: ortam başına ayrı Firebase projesi
  (afiet-dev / afiet-staging / afiet-prod); `afiet-backend` reposu üç ortama
  aynı katman eşlemesiyle deploy olur. DB şema/seed süreci orada tanımlanacak.
