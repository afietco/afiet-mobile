---
name: release
description: family-health için yeni sürüm yayınlar — changelog'u derler, sürümü bump'lar, tag atar, push'lar ve GitHub Release oluşturur. Kullanıcı "release yap", "sürüm çıkar", "yayınla" dediğinde veya /release yazdığında kullanılır. Argüman olarak "patch" | "minor" | "major" veya doğrudan sürüm numarası alabilir.
---

# Release akışı

Bu proje SemVer kullanır. Kaynak gerçeklik `apps/web/package.json` sürümüdür
(monorepo — web workspace'i `@afiet/web`). Push sonrası Vercel production
otomatik deploy olur (main = production branch).

## Ön koşullar (sırayla doğrula)

1. Çalışma ağacı temiz olmalı (`git status`). Kirliyse kullanıcıya sor.
2. `main` dalında olunmalı ve origin ile senkron olunmalı.
3. `CHANGELOG.md` içindeki `[Yayınlanmadı]` bölümünde en az bir madde
   olmalı. Boşsa: son release'ten beri gelen commit'lere bak
   (`git log v<son-sürüm>..HEAD --oneline`), maddeleri sen derle ve
   kullanıcıya göstererek onaylat.

## Sürüm numarası

- Argüman verildiyse onu kullan ("patch"/"minor"/"major" ya da "0.3.0" gibi).
- Verilmediyse içerikten karar ver: yeni özellik varsa **minor**, yalnızca
  düzeltme/iyileştirme varsa **patch**. Kararı kullanıcıya tek satırla bildir.

## Adımlar

1. `npm version <yeni-sürüm> -w @afiet/web --no-git-tag-version` ile
   `apps/web/package.json`u bump'la; ardından kökten `npm install`
   (lockfile'daki workspace sürümü senkronlansın).
2. `CHANGELOG.md` (kökte): `[Yayınlanmadı]` altındaki maddeleri
   `## [X.Y.Z] — YYYY-MM-DD` başlığına taşı; üste boş `## [Yayınlanmadı]`
   bırak. Tarih yerel bugündür.
3. `apps/web/src/data/changelog.ts`: yeni sürüm için `ReleaseNote` girdisi ekle
   (en üste). Maddeleri KULLANICI DİLİYLE yaz — teknik değil, fayda odaklı,
   emojili, en fazla 5-6 madde. CHANGELOG.md'deki her maddeyi değil,
   aile üyelerinin fark edeceği değişiklikleri seç.
4. `npm run build` — tip kontrolü ve build geçmeli.
5. Tek commit: `release: vX.Y.Z` (apps/web/package.json + kök
   package-lock.json + CHANGELOG.md + changelog.ts birlikte).
6. Tag: `git tag vX.Y.Z`
7. Push: `git push origin main --tags` → Vercel production'ı otomatik alır.
8. GitHub Release: `gh release create vX.Y.Z --title "vX.Y.Z" --notes-file <notlar>`
   — notlar CHANGELOG.md'nin o sürüm bölümüdür (başlık hariç gövde).
9. Kullanıcıya özet ver: sürüm, öne çıkanlar, production'ın otomatik
   deploy olacağı bilgisi.

## Geliştirme disiplini (release dışında da geçerli)

Her anlamlı değişiklik commit'ine `CHANGELOG.md` → `[Yayınlanmadı]`
bölümüne madde eklenir (✨ Yeni / 🔧 İyileştirme / 🐛 Düzeltme).
`apps/web/src/data/changelog.ts`'e YALNIZCA release sırasında dokunulur.

## Not: tag/GitHub Release uzak ortamlarda

Bazı uzak geliştirme ortamlarının git proxy'si branch push'unu destekler
ama TAG push'unu desteklemez ("remote end hung up"). Bu durumda 6-8.
adımlar yerine `.github/workflows/release.yml` tetiklenir
(workflow_dispatch; inputs: `tag` = vX.Y.Z, `target` = release commit
SHA'sı). Workflow tag'i hedef commit'te oluşturur ve CHANGELOG.md'deki o
sürüm bölümünü notlar olarak kullanıp GitHub Release'i açar. Ardından
`git ls-remote --tags origin` ile tag doğrulanır ve `git fetch origin
--tags` ile yerel senkronlanır.

## Mobil sürüm (apps/mobile — kullanıcı "mobil release" derse)

Mobil, web'den BAĞIMSIZ sürümlenir. Kaynak gerçeklik
`apps/mobile/package.json` + `apps/mobile/app.json` (`version` ikisinde
birden güncellenir); build numarası EAS'ta uzaktan otomatik artar
(`appVersionSource: remote` + production profilinde `autoIncrement`) —
elle dokunma.

1. `apps/mobile/CHANGELOG.md`: `[Yayınlanmadı]` maddelerini
   `## [X.Y.Z] — YYYY-MM-DD` başlığına taşı (kullanıcı diliyle, emojili).
2. `apps/mobile/package.json` ve `app.json` içindeki `version`'ı bump'la;
   kökten `npm install` (lockfile senkronu).
3. Commit: `release(mobile): mobile-vX.Y.Z` · Tag: `mobile-vX.Y.Z` · push
   (`git push origin main --tags`).
4. Gerisi OTOMATİK: tag push'u `.github/workflows/mobile-release.yml`i
   tetikler → EAS iOS production build → TestFlight submit → iç test
   grubuna otomatik dağıtım. İzleme: `gh run watch` ya da
   https://expo.dev/accounts/rberkkaratas/projects/afiet/builds
5. Tag push'u çalışmayan uzak ortamda: workflow'u `gh workflow run
   mobile-release.yml` ile elle tetikle (ya da web release.yml desenindeki
   gibi önce tag'i workflow'la oluştur). Acil elle akış (CI olmadan):
   `apps/mobile` İÇİNDEN `npx eas-cli build --platform ios --profile
   production --non-interactive` + `npx eas-cli submit --platform ios
   --latest --non-interactive` (ascAppId eas.json'da; ASC API anahtarı
   EAS'ta kayıtlı).
6. Android aile dağıtımı: keystore EAS'a bir kez kaydolduktan sonra
   mobile-release.yml'deki android işindeki `if: false` kaldırılır;
   preview profili APK üretir, linki aileye paylaşılır.

Gereksinim: repo secret'ı `EXPO_TOKEN` (expo.dev Access Tokens).
