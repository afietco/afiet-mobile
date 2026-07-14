# afiet — Google Play gönderim rehberi

Play Console'daki **her metin/form girdisi** burada hazır. Sırayla kopyala-yapıştır.
Kaynak: marka `BRAND.md`, `ROADMAP.md`; veri denetimi koddan (aşağı bak).

> ⚠️ Önce **"Çözülmesi gereken engeller"** bölümünü oku. Uygulama artık backend'e
> veri gönderdiği için Data Safety + gizlilik politikası + veri silme zorunlu.

---

## 0. Çözülmesi gereken engeller (yayından ÖNCE)

> ✅ **Güncelleme — dört engel de KODDA çözüldü** (bu oturumda). Aşağıdaki tablo
> referans olarak kalıyor. Şimdi gereken: commit + deploy + yeniden build —
> bkz. **§10 Deploy kontrol listesi**. ⚠️ İndirilen `build2` AAB bu
> düzeltmelerden ÖNCEsine ait; UYUMLU sürüm için mobil commit'lenip yeniden
> build (`build3`) alınmalı.

Kod denetimi (apps/mobile) şunu gösterdi: uygulama artık **hesap gerektiriyor**
(Stack Auth e-posta+şifre) ve **kişisel + sağlık verisini backend'e (Cloud Run)
HTTPS ile gönderiyor.** Bu yüzden:

| # | Engel | Neden zorunlu | Çözüm |
|---|-------|---------------|-------|
| 1 | **Gizlilik politikası URL'i yok** | Sağlık verisi topluyorsun → Play zorunlu tutar | Aşağıdaki taslağı `afiet.co/gizlilik`'e koy, URL'i forma gir |
| 2 | **Veri/hesap silme yolu yok** | Data Safety "silme yolu" beyanı ister; uygulamada hiç yok | Web silme sayfası (`afiet.co/hesap-sil`) veya uygulama içi "hesabı sil" ekle |
| 3 | **Eski "yalnızca bu cihazda" metinleri** | Onboarding hâlâ "verin cihazda, hesap gerekmez" diyor — artık YANLIŞ, beyanla çelişir | Metinleri düzelt (4 dosya, aşağıda) → yeni build |
| 4 | **Giriş gerektiren app** | İnceleme için Google test hesabı ister | Uygulamada bir test hesabı oluştur, kimliğini "App access"e gir |

Engel 3 dosyaları (düzeltilecek metinler):
- `apps/mobile/src/app/onboarding.tsx:438` — "Verilerin yalnızca bu cihazda saklanır — hesap gerekmez."
- `apps/mobile/src/app/onboarding.tsx:236` — "İsmin yalnızca bu cihazda saklanır."
- `apps/mobile/src/app/(tabs)/profil.tsx:112` — "Verilerin yalnızca bu cihazda"
- `apps/mobile/src/features/body/BodySetupSheet.tsx:86-87` — "Yalnızca bu cihazda saklanır."

> İç test (Internal testing) için 1-4 katı denetlenmez; ama **production'a
> geçmeden** hepsi gerekli. En azından 1 ve 2'yi baştan halletmek en temizi.

---

## 1. AAB (yüklenecek dosya)

- Konum (indirilince): `~/Downloads/afiet-0.2.0-build2.aab`
- Version 0.2.0, versionCode 2, SDK 57, commit `120adac` (temiz HEAD).
- ⚠️ **Bu build DEV backend'e bağlanıyor.** `production` profilinde
  `EXPO_PUBLIC_API_URL` tanımlı olmadığından koddaki varsayılan
  (`app-api-dev-...run.app`) kullanılıyor. İç teste bu uygun (prod backend
  auth'u henüz aktif değil). **Gerçek production'da**, prod API canlı olunca
  `eas.json` → `build.production.env.EXPO_PUBLIC_API_URL`'i prod URL yap.

---

## 2. Store listing (Main store listing)

**App name** (30)
```
afiet
```

**Short description** (80)
```
Kalori saymadan, Türk sofrasının diliyle ailece dengeli beslenme ve sağlık.
```

**Full description** (4000)
```
Sayma, dengele.

afiet, kalori saydırmadan, Türk sofrasının kendi ölçüleriyle konuşarak ailenin
dengeli beslenme alışkanlığını destekleyen bir sağlık uygulamasıdır. Burada
rakam bir limit değil; sofrada seni seven birinin nazik bir hatırlatması.

🍲 Kendi dilinle kayıt
"Kaç dilim?", "kaç kase?", "bir avuç" — ounce/cup değil. Öğününü Türk
yemekleri önerileriyle saniyeler içinde ekle; afiet senin sık yediklerini
öğrenir.

🥗 Kalori değil, denge
Her öğünde besin gruplarını işaretle, günün 5 temel grup dengesini gör.
Baskı yok, suçluluk yok — "bugün sebzeye yer açılır mı?" diyen bir yaklaşım.

💧 Su takibi
Basit bir bardak sayacıyla günlük suyunu takip et.

📏 Vücut ölçüleri ve hesaplayıcılar
Kilo, boy, bel/kalça ölçülerini kaydet, zaman içindeki değişimi gör.
BMI, vücut yağ oranı, BMR ve TDEE hesaplayıcıları bilgi verir — yargılamaz.

👨‍👩‍👧 Birey değil, aile
Aile üyeleri için profiller; hedef bireysel optimizasyon değil, birlikte
sürdürülebilir alışkanlık. Kayıt serinle (streak) küçük kazanımları kutla.

afiet'in özü şefkat: sofrada seni seven biri gibi konuşur. Yargı yok,
davet ve kutlama var. Afiyet olsun 🎉

Not: afiet bir tıbbi cihaz değildir ve tıbbi tavsiye vermez. Sağlık
kararların için bir uzmana danış.
```

**App icon** — 512×512 PNG (marka ikonu; `scripts/generate-assets.mjs` üretir)
**Feature graphic** — 1024×500 PNG **(zorunlu, henüz yok → üretmen gerek;** marka
kitinden emerald degrade + wordmark ile yapılabilir)
**Phone screenshots** — en az 2 (Bugün, Beslenme, Vücudum ekranları önerilir)

---

## 3. Store settings

- **App category:** Health & Fitness
- **Tags:** Nutrition, Health, Diet, Food & Drink (uygun olanları seç)
- **Contact details:**
  - Email: `rberkkaratas@gmail.com`
  - Website: `https://afiet.co`
  - Phone: (opsiyonel)
- **External marketing:** kapalı bırakılabilir

---

## 4. Release (Internal testing)

**Release name**
```
0.2.0 (2)
```

**Release notes** (`tr-TR`)
```
<tr-TR>
afiet ile tanış 🍲
- Öğün günlüğü ve besin grubu dengesi (kalori sayma yok)
- Su takibi
- Vücut ölçüleri + BMI/BMR/TDEE hesaplayıcıları
- Aile üyeleri için profiller ve kayıt serisi
</tr-TR>
```

---

## 5. App content (Uygulama içeriği) beyanları

- **Privacy policy:** `https://afiet.co/gizlilik` (bkz. §7 taslak — önce yayınla)
- **Ads:** *No, my app does not contain ads.*
- **App access:** *All or some functionality is restricted* →
  Instructions: "Uygulama e-posta/şifre ile giriş gerektirir. İnceleme için:
  e-posta `<test hesabı>`, şifre `<...>`." (uygulamada bir test hesabı aç)
- **Content ratings:** aşağıdaki §6 anketi
- **Target audience:** **18 ve üzeri** (öneri) — sağlık verisi + hesap içerdiği
  için; 13 altını seçersen Google "Families" politikasına girer (çok daha katı).
- **News app:** No
- **COVID-19 contact tracing:** No
- **Data safety:** aşağıdaki §8
- **Government app:** No · **Financial features:** No · **Health apps:**
  "Sağlık içeriği var ama tıbbi teşhis/tedavi sunmuyor" — health content
  onayını işaretle, tıbbi cihaz DEĞİL.

---

## 6. Content rating anketi (IARC) — cevaplar

- Category: **Utility / Productivity / Communication / Other → Health & Fitness**
- Şiddet: **Hayır** · Cinsellik: **Hayır** · Küfür/dil: **Hayır**
- Kontrollü maddeler (uyuşturucu/alkol/tütün): **Hayır**
- Kumar: **Hayır**
- Kullanıcılar etkileşime girer / içerik paylaşır mı: **Hayır** (sosyal katman
  Aşama 4'te; şu an yok)
- Konum paylaşımı: **Hayır**
- Kişisel bilgi paylaşımı (üçüncü taraflarla): **Hayır**
- Dijital satın alma: **Hayır**

→ Beklenen sonuç: **Everyone / 3+ (PEGI 3)**

---

## 7. Gizlilik politikası — taslak (afiet.co/gizlilik'e koy)

```
afiet — Gizlilik Politikası
Son güncelleme: 2026-07-13

afiet ("uygulama", "biz") aile bireylerinin beslenme ve sağlık alışkanlıklarını
takip etmesine yardımcı olur. Gizliliğine önem veriyoruz. Bu politika hangi
verileri neden topladığımızı ve haklarını açıklar.

Topladığımız veriler
- Hesap: e-posta adresi (kimlik doğrulama için, sağlayıcı: Stack Auth).
- Profil: görünen ad, cinsiyet, doğum tarihi, boy, aktivite düzeyi.
- Sağlık ve beslenme: öğün/besin kayıtları, besin grupları, su tüketimi,
  vücut ölçüleri (kilo, bel, boyun, kalça) ve bunlardan hesaplanan
  BMI/BMR/TDEE/vücut yağ oranı gibi değerler.
- Kullanım: kayıt tarihleri, seri (streak) gibi uygulama içi etkinlik.

Verileri neden işliyoruz
Yalnızca uygulamanın çalışması için: kayıtlarını saklamak, aile profillerini
yönetmek ve sana denge özetleri göstermek. Reklam yok, üçüncü taraflara
satış/paylaşım yok, izleme (tracking) yok.

Nerede saklanır
Verilerin, bizim yönettiğimiz sunucularda (Google Cloud) saklanır ve aktarım
sırasında HTTPS ile şifrelenir. Kimlik doğrulama Stack Auth tarafından sağlanır.

Verilerini silme
Hesabını ve tüm verilerini silmek için `rberkkaratas@gmail.com` adresine yaz;
talebini 30 gün içinde işleriz. (Uygulama içi "hesabı sil" seçeneği eklenecek.)

Çocuklar
Uygulama 18 yaş ve üzeri kullanıcılar içindir.

İletişim
Sorular için: rberkkaratas@gmail.com
```

> ⚠️ Silme yolu gerçek olmalı — en azından bu e-posta sürecini işlettiğinden
> emin ol; ideali backend'e bir silme akışı + uygulama içi buton eklemek.

---

## 8. Data safety formu — cevaplar (koddan doğrulandı)

**Genel**
- Uygulaman kullanıcı verisi topluyor/paylaşıyor mu? → **Evet, topluyor**
- Aktarımda tüm veri şifreli mi? → **Evet (HTTPS)**
- Kullanıcı silme talep edebiliyor mu? → **Evet** (§7 e-posta yolu; ideali
  uygulama içi) — bu beyanı yapabilmen için silme yolunu gerçekten sağla
- Bağımsız güvenlik denetimi? → İsteğe bağlı, boş bırakılabilir

**Toplanan veri türleri** (hepsi "Collected", "Shared: Hayır — kendi
backend'in + Stack Auth işleyicidir, üçüncü tarafa satış/paylaşım yok)

| Kategori | Veri türü | Toplanıyor | Amaç | Zorunlu mu |
|---|---|---|---|---|
| Personal info | Email address | ✔ | App functionality, Account management | Zorunlu |
| Personal info | Name | ✔ | App functionality, Personalization | Zorunlu |
| Health & fitness | Health info (öğün, su, vücut ölçüleri, BMI/BMR/TDEE, cinsiyet/yaş/boy) | ✔ | App functionality | Zorunlu |
| Health & fitness | Fitness info (aktivite düzeyi) | ✔ | App functionality | Opsiyonel |
| App activity | Other user-generated content (öğün notları) | ✔ | App functionality | Opsiyonel |
| App activity | App interactions (kayıt tarihleri, streak) | ✔ | App functionality | Opsiyonel |

**Toplanmıyor (formda "Hayır" işaretle):** Konum, Fotoğraf/medya, Kişiler,
Takvim, Mesajlar, Finansal bilgi, Ses, Cihaz/uygulama tanımlayıcıları,
Çökme/tanılama (analytics, crash, ads, tracking SDK'sı **yok** — doğrulandı).

**Güvenlik uygulamaları**
- Aktarımda şifreleme: **Evet (HTTPS)**
- Kullanıcı veri silme talebi: **Evet** (yukarıdaki yolla)
- Not (form sormaz ama iyileştirme): auth token'ları şu an düz AsyncStorage'da;
  ileride `expo-secure-store`'a taşınmalı.

---

## 9. Yükleme akışı (özet)

1. `~/Downloads/afiet-0.2.0-build2.aab` hazır olunca → Play Console →
   **Internal testing → Create new release** → AAB'yi yükle (Play App Signing'i
   kabul et — EAS upload key'i zaten üretti).
2. Release name + notes (§4) gir → tester listesi ekle (kendi e-postan/aile).
3. **App content** (§5-8) ve **Store listing** (§2-3) bölümlerini doldur.
4. Gizlilik politikası (§7) yayınla, URL'i gir.
5. Review'a gönder → Internal testing hızlı (genelde saatler).
6. Sonraki release'ler: `eas submit` (servis hesabı ayarlanınca) veya yine manuel.

---

## 10. Deploy kontrol listesi (uyumlu sürüm için)

Tüm kod değişiklikleri şu an **commit edilmemiş** ve **hiçbiri deploy edilmedi**.
Sıra önemli — in-app silme, backend ucu canlı olmadan 404 verir:

1. **Backend** (`afiet-backend`, `feature/backend-calculations`): `DELETE /v1/account`
   eklendi (derleme+vet+test geçti, migration gerekmez). → commit + dal modeliyle
   deploy (dev→staging→main, CI Cloud Run'a çıkar).
2. **Web** (`afiet-web`, `main`): `/gizlilik` + `/hesap-sil` sayfaları + footer
   linkleri (typecheck + prod build + prerender doğrulandı). → commit + push
   (`main` = Vercel production; "ok" sonrası).
3. **Mobil** (`afiet-mobile`, `feature/backend-calculations`): eski "cihazda"
   metin düzeltmeleri + Profil'de "Hesabı sil" + client `deleteAccount` +
   best-effort Stack Auth kimlik silme (typecheck geçti). → commit + **EAS
   yeniden build** (`eas build -p android --profile production`) = uyumlu `build3`.
   ⚠️ EAS commit'li HEAD'den derler; commit'lemeden build3 değişiklikleri almaz.
4. **Stack Auth**: kimliğin gerçekten silinmesi için 3 projede (dev/staging/prod)
   "client user deletion" ayarını **aç**. Kapalıysa app verisi yine silinir ama
   Stack Auth e-posta kimliği kalır (best-effort no-op).

Özet: **backend deploy → web push → mobil commit + build3 → Stack Auth ayarı.**
build3 hazır olunca §1'deki AAB onunla değişir; formları (§2–§9) o sürümle doldur.
