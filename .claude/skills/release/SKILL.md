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
4. Kardeş repo `../afiet-web` erişilebilir ve temiz olmalı: sürüm notu
   sayfası oradan yayınlanır (aşağıda 3. adım).

## Bir release'in üç anlatımı

Aynı sürüm üç yerde, üç ayrı uzunlukta anlatılır. Üçü de bu akışta güncellenir;
biri atlanırsa sessizce eskir (0.9.0 ve 0.10.0 tam bu yüzden Yenilikler
ekranını hiç açmadı).

| Nerede | Ne kadar | Kime |
|---|---|---|
| `apps/mobile/CHANGELOG.md` | tam liste | bakım yapana |
| `apps/mobile/src/features/changelog/releaseNotes.ts` | 4-5 madde | güncelleyen kullanıcıya (uygulama içi sayfa) |
| `afiet-web/content/yenilikler/<sürüm>.md` | tamamı, gruplanmış | pop-up'tan "Tüm değişiklikleri oku" diyene |

Web sayfası **tag'den ÖNCE** yayında olmalı: uygulamadaki bağlantı
`afiet.co/yenilikler/<sürüm>` adresine gider ve sayfa yoksa 404 karşılar.

## Sürüm numarası

- Argüman verildiyse onu kullan ("patch"/"minor"/"major" ya da "0.3.0" gibi).
- Verilmediyse içerikten karar ver: yeni özellik varsa **minor**, yalnızca
  düzeltme/iyileştirme varsa **patch**. Kararı kullanıcıya tek satırla bildir.

## Adımlar

1. `apps/mobile/CHANGELOG.md`: `[Yayınlanmadı]` maddelerini
   `## [X.Y.Z] — YYYY-MM-DD` başlığına taşı (kullanıcı diliyle, emojili);
   üste boş `## [Yayınlanmadı]` bırak. Tarih yerel bugündür.
2. `apps/mobile/src/features/changelog/releaseNotes.ts`: yeni sürümü listenin
   EN ÜSTÜNE ekle (4-5 madde, emoji + tek cümle, fayda önde). Bu, uygulama
   içindeki Yenilikler sayfasının metnidir; changelog'un kopyası DEĞİLDİR,
   ondan seçilmiş ve kullanıcı diline çevrilmiş hâlidir. `npm test` en yeni
   maddenin app.json'daki sürümle aynı olmasını şart koşar.
3. **Web sürüm notunu YAYINLA (tag'den önce).** `../afiet-web` içinde:
   1. `node scripts/surum-notu-taslagi.mjs X.Y.Z` — CHANGELOG'daki o sürümün
      maddelerini `content/yenilikler/X.Y.Z.md` dosyasına gruplayarak yazar.
   2. Dosyadaki üç `TODO` satırını doldur (başlık, özet, giriş paragrafı) ve
      maddelerde bakım diline kaçan yer varsa cilala. TODO kalırsa sayfa
      yayına HİÇ çıkmaz (releaseStore o dosyayı atlar), sessizce eksik kalır.
   3. `npm run build && npm run smoke`, ardından dal modelini yürüt:
      `feature/*` → `development` → `staging` → `main`.
   4. Canlıyı doğrula: `curl -s -o /dev/null -w "%{http_code}"
      https://afiet.co/yenilikler/X.Y.Z` → 200. Bunu görmeden tag atma.
4. `apps/mobile/package.json` ve `app.json` içindeki `version`'ı bump'la;
   kökten `npm install` (lockfile senkronu).
5. **Lockfile'ı denetle — bu adımı atlama.** `git diff package-lock.json`
   çıktısında **version satırlarından başka hiçbir şey olmamalı**. macOS'ta
   `npm install`, yalnız wasm/linux çözümlemesinin ihtiyaç duyduğu optional
   peer bağımlılıkları (`@emnapi/core`, `@emnapi/runtime`,
   `@emnapi/wasi-threads`) lockfile'dan sessizce SİLER; linux runner'da
   `npm ci` "Missing: ... from lock file" ile ölür ve iOS build hiç başlamaz
   (mobile-v0.7.1 tam bu yüzden düştü). Silme olduysa:
   `git checkout HEAD -- package-lock.json`, sonra lockfile içindeki
   `packages["apps/mobile"].version` satırını ELLE bump'la.
   Ardından `npm ci --dry-run` ile senkronu doğrula — tag atmadan önce.
6. Commit: `release(mobile): mobile-vX.Y.Z` · Tag: `mobile-vX.Y.Z` · push
   (`git push origin main --tags`).
7. Gerisi OTOMATİK: tag push'u `.github/workflows/mobile-release.yml`i
   tetikler → EAS iOS production build → TestFlight submit → iç test
   grubuna otomatik dağıtım. İzleme: `gh run watch` ya da
   https://expo.dev/accounts/rberkkaratas/projects/afiet/builds
8. Tag push'u çalışmayan uzak ortamda: workflow'u `gh workflow run
   mobile-release.yml` ile elle tetikle. Acil elle akış (CI olmadan):
   `apps/mobile` İÇİNDEN `npx eas-cli build --platform ios --profile
   production --non-interactive` + `npx eas-cli submit --platform ios
   --latest --non-interactive` (ascAppId eas.json'da; ASC API anahtarı
   EAS'ta kayıtlı).
9. Sonucu **iş bazında** oku, run sonucuna göre karar verme: `ios` ve
   `android` ayrı işlerdir. Android'in Play gönderimi `PLAY_SUBMIT_ENABLED`
   repo değişkeni ile kapalı (EAS'ta Google Service Account anahtarı yok);
   Android BUILD'i yine alınır ve artefakt EAS'ta durur. Açmak için bir kez
   `eas credentials` ile anahtarı kaydet, sonra `PLAY_SUBMIT_ENABLED=true`.
   Android aile dağıtımı için preview profili APK üretir, link aileye
   paylaşılır.

## Geliştirme disiplini (release dışında da geçerli)

Her anlamlı değişiklik commit'ine `apps/mobile/CHANGELOG.md` →
`[Yayınlanmadı]` bölümüne madde eklenir (✨ Yeni / 🔧 İyileştirme / 🐛 Düzeltme).
Bu maddeler release'te olduğu gibi web sürüm notuna taşınır, yani madde
yazarken okuyucu yalnız bakım yapan değil: teknik iç dökümü değil, kişinin ne
kazandığını yaz.

Gereksinim: repo secret'ı `EXPO_TOKEN` (expo.dev Access Tokens).
