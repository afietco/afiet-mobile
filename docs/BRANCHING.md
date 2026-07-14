# Dallanma ve ortamlar

Solo geliştirme için üç katmanlı akış: iş feature dalında başlar, PR ile
katman katman yükselir, release haftalık ritimde `main`e iner.

## Dallar

| Dal | Rol | Ortam |
| --- | --- | --- |
| `main` | Production. Yalnızca `staging`den release merge'ü alır. | TestFlight/App Store (`mobile-vX.Y.Z` tag'i) |
| `staging` | Release adayı; testerlara açılan katman. | TestFlight iç test (ileride ayrı EAS channel) |
| `development` | Günlük geliştirme entegrasyonu. | Expo Go / dev build |
| `feature/*` | Tekil işler; `development`a PR açılır. | lokal (simülatör/Expo Go) |

Web (afiet.co) ayrı `afiet-web` reposundadır; dal/ortam eşlemesi orada tanımlıdır.

## Akış

1. `feature/<konu>` dalında geliştir; lokalde `npm run typecheck` ve
   simülatör/Expo Go ile doğrula.
2. PR: `feature/*` → `development`. CI yeşilse merge, development ortamında test.
3. `development`da birikenler hazırsa → `staging`e merge; testerlar ve gerçek
   cihazlarla çevre testi.
4. Sorun yoksa haftalık release: `staging` → `main` merge; `/release` ile
   `mobile-vX.Y.Z` tag'i atılır (EAS build + TestFlight otomatik).

Acil üretim düzeltmesi (hotfix) gerekirse `main`den dal alınır, düzeltme
`main`e merge edilir ve `staging`/`development`a geri taşınır (back-merge).

## CI

`.github/workflows/ci.yml` üç ana dala giden PR ve push'larda çalışır:

- **mobil**: `npm run typecheck` (tüm workspace'ler) +
  `npx expo export --platform ios --platform android`
  (bundle'ın derlenebildiğini kanıtlar)

`mobile-release.yml`: `mobile-vX.Y.Z` tag'i EAS production build +
TestFlight gönderimini tetikler.

## Sonraya notlar (konuşulacak)

- **Branch koruması**: private repo GitHub Free planında klasik branch
  protection desteklemiyor; org Team planına geçilirse `main` ve `staging`e
  "zorunlu PR + yeşil CI" kuralı eklenecek. O zamana dek disiplin manuel.
- **Mobil katmanlar**: EAS channel'ları (development/preview/production),
  EAS Update ile katman başına OTA güncelleme, TestFlight iç/dış test grubu
  eşlemesi ve Play Store internal/closed track karşılıkları.
- **Backend (yakında)**: ortam başına ayrı Firebase projesi
  (afiet-dev / afiet-staging / afiet-prod); `afiet-backend` reposu üç ortama
  aynı katman eşlemesiyle deploy olur. DB şema/seed süreci orada tanımlanacak.
