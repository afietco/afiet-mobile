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
3. **Lockfile'ı denetle — bu adımı atlama.** `git diff package-lock.json`
   çıktısında **version satırlarından başka hiçbir şey olmamalı**. macOS'ta
   `npm install`, yalnız wasm/linux çözümlemesinin ihtiyaç duyduğu optional
   peer bağımlılıkları (`@emnapi/core`, `@emnapi/runtime`,
   `@emnapi/wasi-threads`) lockfile'dan sessizce SİLER; linux runner'da
   `npm ci` "Missing: ... from lock file" ile ölür ve iOS build hiç başlamaz
   (mobile-v0.7.1 tam bu yüzden düştü). Silme olduysa:
   `git checkout HEAD -- package-lock.json`, sonra lockfile içindeki
   `packages["apps/mobile"].version` satırını ELLE bump'la.
   Ardından `npm ci --dry-run` ile senkronu doğrula — tag atmadan önce.
4. Commit: `release(mobile): mobile-vX.Y.Z` · Tag: `mobile-vX.Y.Z` · push
   (`git push origin main --tags`).
5. Gerisi OTOMATİK: tag push'u `.github/workflows/mobile-release.yml`i
   tetikler → EAS iOS production build → TestFlight submit → iç test
   grubuna otomatik dağıtım. İzleme: `gh run watch` ya da
   https://expo.dev/accounts/rberkkaratas/projects/afiet/builds
6. Tag push'u çalışmayan uzak ortamda: workflow'u `gh workflow run
   mobile-release.yml` ile elle tetikle. Acil elle akış (CI olmadan):
   `apps/mobile` İÇİNDEN `npx eas-cli build --platform ios --profile
   production --non-interactive` + `npx eas-cli submit --platform ios
   --latest --non-interactive` (ascAppId eas.json'da; ASC API anahtarı
   EAS'ta kayıtlı).
7. Sonucu **iş bazında** oku, run sonucuna göre karar verme: `ios` ve
   `android` ayrı işlerdir. Android'in Play gönderimi `PLAY_SUBMIT_ENABLED`
   repo değişkeni ile kapalı (EAS'ta Google Service Account anahtarı yok);
   Android BUILD'i yine alınır ve artefakt EAS'ta durur. Açmak için bir kez
   `eas credentials` ile anahtarı kaydet, sonra `PLAY_SUBMIT_ENABLED=true`.
   Android aile dağıtımı için preview profili APK üretir, link aileye
   paylaşılır.

## Geliştirme disiplini (release dışında da geçerli)

Her anlamlı değişiklik commit'ine `apps/mobile/CHANGELOG.md` →
`[Yayınlanmadı]` bölümüne madde eklenir (✨ Yeni / 🔧 İyileştirme / 🐛 Düzeltme).

Gereksinim: repo secret'ı `EXPO_TOKEN` (expo.dev Access Tokens).
