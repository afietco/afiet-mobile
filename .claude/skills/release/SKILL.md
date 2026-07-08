---
name: release
description: family-health için yeni sürüm yayınlar — changelog'u derler, sürümü bump'lar, tag atar, push'lar ve GitHub Release oluşturur. Kullanıcı "release yap", "sürüm çıkar", "yayınla" dediğinde veya /release yazdığında kullanılır. Argüman olarak "patch" | "minor" | "major" veya doğrudan sürüm numarası alabilir.
---

# Release akışı

Bu proje SemVer kullanır. Kaynak gerçeklik `package.json` sürümüdür.
Push sonrası Vercel production otomatik deploy olur (main = production branch).

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

1. `npm version <yeni-sürüm> --no-git-tag-version` ile `package.json` bump'la.
2. `CHANGELOG.md`: `[Yayınlanmadı]` altındaki maddeleri
   `## [X.Y.Z] — YYYY-MM-DD` başlığına taşı; üste boş `## [Yayınlanmadı]`
   bırak. Tarih yerel bugündür.
3. `src/data/changelog.ts`: yeni sürüm için `ReleaseNote` girdisi ekle
   (en üste). Maddeleri KULLANICI DİLİYLE yaz — teknik değil, fayda odaklı,
   emojili, en fazla 5-6 madde. CHANGELOG.md'deki her maddeyi değil,
   aile üyelerinin fark edeceği değişiklikleri seç.
4. `npm run build` — tip kontrolü ve build geçmeli.
5. Tek commit: `release: vX.Y.Z` (package.json + package-lock.json +
   CHANGELOG.md + changelog.ts birlikte).
6. Tag: `git tag vX.Y.Z`
7. Push: `git push origin main --tags` → Vercel production'ı otomatik alır.
8. GitHub Release: `gh release create vX.Y.Z --title "vX.Y.Z" --notes-file <notlar>`
   — notlar CHANGELOG.md'nin o sürüm bölümüdür (başlık hariç gövde).
9. Kullanıcıya özet ver: sürüm, öne çıkanlar, production'ın otomatik
   deploy olacağı bilgisi.

## Geliştirme disiplini (release dışında da geçerli)

Her anlamlı değişiklik commit'ine `CHANGELOG.md` → `[Yayınlanmadı]`
bölümüne madde eklenir (✨ Yeni / 🔧 İyileştirme / 🐛 Düzeltme).
`src/data/changelog.ts`'e YALNIZCA release sırasında dokunulur.
