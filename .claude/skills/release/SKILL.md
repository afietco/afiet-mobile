---
name: release
description: afiet mobil için yeni sürüm yayınlar — changelog'u derler, sürümü bump'lar, tag atar, push'lar; tag push'u GitHub Actions üzerinden EAS build + TestFlight gönderimini otomatik tetikler. Kullanıcı "release yap", "sürüm çıkar", "yayınla", "mobil release" dediğinde veya /release yazdığında kullanılır. Argüman olarak "patch" | "minor" | "major" veya doğrudan sürüm numarası alabilir.
---

# Release akışı

Bu repo yalnızca mobili barındırır (web `afiet-web` reposunda, kendi release
akışıyla). Mobil SemVer kullanır; kaynak gerçeklik `apps/mobile/package.json`
+ `apps/mobile/app.json` (`version` ikisinde birden güncellenir). Build
numarası EAS'ta uzaktan otomatik artar (`appVersionSource: remote` +
production profilinde `autoIncrement`) — elle dokunma.

## Ön koşullar (sırayla doğrula)

1. Çalışma ağacı temiz olmalı (`git status`). Kirliyse kullanıcıya sor.
2. `main` dalında olunmalı ve origin ile senkron olunmalı.
3. `apps/mobile/CHANGELOG.md` içindeki `[Yayınlanmadı]` bölümünde en az bir
   madde olmalı. Boşsa: son release'ten beri gelen commit'lere bak
   (`git log mobile-v<son-sürüm>..HEAD --oneline`), maddeleri sen derle ve
   kullanıcıya göstererek onaylat.

## Sürüm numarası

- Argüman verildiyse onu kullan ("patch"/"minor"/"major" ya da "0.3.0" gibi).
- Verilmediyse içerikten karar ver: yeni özellik varsa **minor**, yalnızca
  düzeltme/iyileştirme varsa **patch**. Kararı kullanıcıya tek satırla bildir.

## Adımlar

1. `apps/mobile/CHANGELOG.md`: `[Yayınlanmadı]` maddelerini
   `## [X.Y.Z] — YYYY-MM-DD` başlığına taşı (kullanıcı diliyle, emojili);
   üste boş `## [Yayınlanmadı]` bırak. Tarih yerel bugündür.
2. `apps/mobile/package.json` ve `app.json` içindeki `version`'ı bump'la;
   kökten `npm install` (lockfile senkronu).
3. Commit: `release(mobile): mobile-vX.Y.Z` · Tag: `mobile-vX.Y.Z` · push
   (`git push origin main --tags`).
4. Gerisi OTOMATİK: tag push'u `.github/workflows/mobile-release.yml`i
   tetikler → EAS iOS production build → TestFlight submit → iç test
   grubuna otomatik dağıtım. İzleme: `gh run watch` ya da
   https://expo.dev/accounts/rberkkaratas/projects/afiet/builds
5. Tag push'u çalışmayan uzak ortamda: workflow'u `gh workflow run
   mobile-release.yml` ile elle tetikle (ya da `release.yml` desenindeki
   gibi önce tag'i workflow'la oluştur). Acil elle akış (CI olmadan):
   `apps/mobile` İÇİNDEN `npx eas-cli build --platform ios --profile
   production --non-interactive` + `npx eas-cli submit --platform ios
   --latest --non-interactive` (ascAppId eas.json'da; ASC API anahtarı
   EAS'ta kayıtlı).
6. Android aile dağıtımı: keystore EAS'a bir kez kaydolduktan sonra
   mobile-release.yml'deki android işindeki `if: false` kaldırılır;
   preview profili APK üretir, linki aileye paylaşılır.

## Geliştirme disiplini (release dışında da geçerli)

Her anlamlı değişiklik commit'ine `apps/mobile/CHANGELOG.md` →
`[Yayınlanmadı]` bölümüne madde eklenir (✨ Yeni / 🔧 İyileştirme / 🐛 Düzeltme).

Gereksinim: repo secret'ı `EXPO_TOKEN` (expo.dev Access Tokens).
