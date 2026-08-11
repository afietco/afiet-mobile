# Abonelik ürünlerinin kurulumu (Dilim 0'ın kalanı)

> Durum: TALİMAT (5 Ağu 2026) · Politika kaynağı: `fiyatlandirma.md`
> Kod planı: `revenuecat-dilim-plani.md`
> Bu dosya panel işlerini anlatır. Kod dilimleri bunlar bitmeden test edilemez.

Sabitler (üç yerde de aynı yazılacak, bir harf sapma tüm zinciri kırar):

| Ne | Değer |
|---|---|
| iOS bundle / Android package | `co.afiet.app` |
| Apple Team ID | `93C5KZXLN4` |
| App Store Connect app id | `6789522761` |
| Aylık ürün | `afiet_premium_monthly` |
| Yıllık ürün | `afiet_premium_annual` |
| RevenueCat entitlement | `premium` |
| RevenueCat offering | `default` |
| TR fiyatları | aylık 129,99 TL · yıllık 799,99 TL |
| Yıllık giriş teklifi | ilk yıl 599,99 TL |
| Baz ülke (ABD) | 6,99 USD/ay · 49,99 USD/yıl |

---

## 0. Sözleşme: ÇÖZÜLDÜ (9 Ağu 2026)

ASC > Business ekranı doğrulandı: **Paid Apps Agreement Active**
(Jul 17 2026 - Jul 9 2027), banka hesabı (Türkiye Garanti Bankası) Active,
iki vergi formu (U.S. Certificate of Foreign Status + W-8BEN, 5 Ağu) Active,
Digital Services Act Active. Sandbox satın alması artık çalışır.

Aşağıdaki bölüm referans olarak kalıyor, yeniden takılırsan diye.

<details>
<summary>"Pending User Info" ne demekti</summary>

Paid Applications sözleşmesi imzalanmış ama yürürlüğe girmemiş demek: Apple
senden hâlâ bilgi bekliyor. Bu durumda sandbox satın alması bile çalışmaz,
RevenueCat ürünleri çekemez, App Review abonelikli sürümü reddeder.

Çözüm yolu (yalnız **Account Holder** yapabilir, Admin yetmez):

1. App Store Connect > **Business** (eski adı Agreements, Tax, and Banking).
2. Paid Apps satırında **Set Up Tax and Banking** bağlantısı.
3. Sırayla üçü de "Complete" olmalı:
   - **Contact info**: en az bir Financial, bir Technical, bir Legal, bir
     Senior Management kişisi atanmış olmalı. En sık takılan yer burasıdır,
     rolleri boş bırakılan bir tek kişi bile durumu "Pending User Info"da tutar.
   - **Bank account**: sende **processing** durumunda, 24 saat içinde oturur.
   - **Tax forms**: Türkiye'den satış yapsan da **US tax form (W-8BEN / W-8BEN-E)**
     zorunlu; ayrıca Türkiye vergi formu istenir.
4. Üçü de yeşil olunca sözleşme durumu genelde ~24 saatte **Active** olur.

Kontrol: ASC > Business > Paid Apps satırında durum **Active** yazmalı.

Kaynak: [View agreement status](https://developer.apple.com/help/app-store-connect/manage-agreements/view-agreements-status)

</details>

---

## 1. App Store Connect: abonelik grubu ve iki ürün

Kritik kural, planlamayı doğrudan etkiler:

> **İlk auto-renewable abonelik ve ilk abonelik grubu, yeni bir uygulama
> sürümüyle BİRLİKTE incelemeye gönderilmek zorundadır.**

Yani abonelikleri önden onaylatıp sonra uygulamayı göndermek mümkün değil.
0.12.0 build'i ile iki abonelik ürünü aynı incelemede gider. İlk abonelik
onaylandıktan sonra sonraki ürünler tek başına gönderilebilir.

Kaynak: [Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/)

### 1.1 Grup

1. ASC > uygulaman > sol menü **Monetization > Subscriptions**.
2. **(+)** > **Reference Name**: `afiet premium` (bu ad kullanıcıya görünmez).
3. **Create**.

Tek grup olacak. Aynı gruptaki iki ürün birbirine yükseltme/düşürme yapabilir
ve kişi grup başına **yalnız bir kez** giriş teklifinden yararlanabilir.

### 1.2 Yıllık ürün

1. Grubun içinde **Create**.
2. **Reference Name**: `afiet premium yıllık`
   **Product ID**: `afiet_premium_annual`
3. **Subscription Duration**: `1 Year`.
4. **Subscription Prices** > fiyat ekle:
   - Baz olarak **United States · 49,99 USD** seç, diğer vitrinler türesin.
   - Sonra **Turkey** satırını **elle 799,99 TL** yap. Otomatik kur eşitlemesi
     TR için kabaca iki kat pahalı fiyat üretiyor, bu yüzden elle giriyoruz.
5. **Availability**: tüm ülkeler açık kalabilir (UI Türkçe, yurt dışı satış
   marjinal ama kapatmanın da faydası yok).
6. **Localizations** > Türkçe ekle:
   - **Display Name**: `afiet premium (yıllık)`
   - **Description**: 45 karakter sınırı var, kısa tut. Öneri:
     `Afi sohbetleri ve derin içgörü, bir yıl boyunca.`
   Ayrıca İngilizce bir lokalizasyon eklemek reddi azaltır.
7. **Review Information**: paywall ekran görüntüsü + inceleme notu.
   Görüntüyü ben simülatörden üreteceğim (Dilim 2 bitince), not metnini de
   ben yazacağım.
8. **Save**.

### 1.3 Aylık ürün

Aynı grup içinde, aynı adımlar:
- **Product ID**: `afiet_premium_monthly`, **Duration**: `1 Month`
- ABD 6,99 USD, **Turkey elle 129,99 TL**
- Display Name: `afiet premium (aylık)`

### 1.4 Yıllığa giriş teklifi (ilk yıl 599,99 TL)

1. Yıllık ürün > **Subscription Prices** > **View all Subscription Pricing**.
2. **Set Up Introductory Offer**.
3. Tür: **Pay Up Front** (peşin, indirimli). Süre: **1 Year**. Fiyat: TR için
   **599,99 TL**, ABD için karşılığı (öneri 37,99 USD).
4. Başlangıç tarihi: bugünden ileri bir tarih verme, "hemen" seç; bitiş
   tarihini boş bırak (süresiz) ya da lansman kampanyası bitişini gir.

Dikkat: **giriş teklifi oluşturulduktan sonra düzenlenemez**, silip yeniden
oluşturman gerekir. Fiyatı iki kez kontrol et.

Kaynak: [Set up introductory offers](https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions/)

### 1.5 Sandbox test hesabı

ASC > **Users and Access** > **Sandbox** > **Test Accounts** > (+).
Gerçek Apple ID'nde kullanılmayan bir e-posta gir (örn.
`berk+sandbox@afiet.co`). Bu hesabı bana **verme**, cihazda sen gireceksin;
bana yalnız "sandbox hesabı hazır" demen yeterli. **Hazır (9 Ağu).**

### 1.6 Ürünler oluşturuldu, üç kusur var (9 Ağu 2026)

RevenueCat'teki ürün listesinden okunan durum ve düzeltmeleri:

**a) Yıllık ürünün kimliği yanlış görünüyor.**
RC'de yıllık ürün `afiet_premium_annual:monthly` kimliğiyle duruyor. Sondaki
`:monthly` App Store'da olmaması gereken bir şey; App Store ürün kimlikleri
düz metindir, iki nokta üst üste Play'in base plan sözdizimidir. Üstelik adı
"yıllık" ama kimliğinde "monthly" geçiyor.

Doğrulanacak: ASC > Monetization > Subscriptions > yıllık ürünün
**Product ID**'si tam olarak ne, ve **Subscription Duration**'ı **1 Year** mı.
Sonra RC'deki ürün kimliğinin ASC'dekiyle **harfi harfine** aynı olması
sağlanacak. Eşleşmezse `getOfferings()` paketi ürünsüz döner ve paywall'da
fiyat yerine boşluk çıkar. Bu, sessiz başarısızlıkların en can sıkıcısı.

**b) Aylık üründe "Missing Metadata".**
Bu bir App Store Connect durumu, RevenueCat sadece aynasını gösteriyor.
Ürün oluşturulmuş ama tamamlanmamış demek. Temizlemek için ASC'de o ürünün
sayfasında şunlar dolmalı:
- **Subscription Prices** (ABD bazı + Türkiye elle 129,99)
- **Localizations**: en az bir dil, Display Name + Description
- **Review Information**: ekran görüntüsü + inceleme notu

Fiyat ve lokalizasyon şimdi doldurulabilir. **İnceleme ekran görüntüsü
paywall ekranı yazılmadan üretilemez**, o yüzden ürün Dilim 2 bitene kadar
"Missing Metadata" ya da eksik durumda kalabilir; bu beklenen bir şey,
telaş sebebi değil. Ekran görüntüsünü Dilim 2 sonunda simülatörden ben
üreteceğim.

**c) Entitlement bağlı değil.**
İki ürün de "Entitlements: Attach" diyor, yani hiçbiri `premium`
entitlement'ına bağlanmamış. RC > Product catalog > **Entitlements** >
`premium` (yoksa oluştur) > iki ürünü de bağla. Bu yapılmazsa satın alma
başarılı olur ama `customerInfo.entitlements.active` boş döner: kullanıcı
öder, uygulama premium'u açmaz.

---

## 2. Play Console: abonelik, base plan, offer

Play'de üç katman var ve **üçü ayrı ayrı aktive edilir**: subscription >
base plan > offer. Base plan aktive edilmezse ürün satılmaz.

Yol: **Monetize with Play > Products > Subscriptions**.

Kaynak: [Create and manage subscriptions](https://support.google.com/googleplay/android-developer/answer/140504?hl=en)

### 2.1 Yıllık abonelik

1. **Create subscription**.
   - **Product ID**: `afiet_premium_annual` (sonradan değiştirilemez)
   - **Name**: `afiet premium (yıllık)` (kullanıcı e-postalarında ve Play
     abonelik merkezinde bunu görür, 55 karakter)
   - **Benefits** (opsiyonel, 4 madde x 40 karakter). Öneri:
     `Afi ile sohbet hakkı`, `Derin içgörü ve sezon raporu`,
     `İkram kesesi her ay yenilenir`, `Sofra bezine kurucu deseni`
2. **Add base plan**:
   - **Base plan ID**: `annual`
   - Tür: **Auto-renewing**
   - **Billing period**: `Yearly`
   - **Grace period**: 7 gün (ödeme sorununda aboneyi hemen düşürme)
   - **Account hold**: varsayılan
   - **Resubscribe**: açık
   - **Pricing**: toplu güncellemede ABD 49,99 USD, sonra **Türkiye satırını
     elle 799,99 TL** yap. Play fiyatları **vergi hariç** ister, KDV üstüne
     eklenir; TR'de kullanıcının göreceği tutar 799,99 olacaksa vergi hariç
     tutarı buna göre gir (Play hesaplayıcıyı gösteriyor, oradan doğrula).
   - **Save** > **Activate**
3. **Add offer** (giriş teklifi):
   - **Offer ID**: `ilk-yil`
   - **Eligibility**: `New customer acquisition`
   - **Phases** > Add phase: tür **Single payment**, süre **1 year**,
     fiyat TR **599,99 TL**
   - **Save** > **Activate**

### 2.2 Aylık abonelik

Aynı akış: Product ID `afiet_premium_monthly`, base plan ID `monthly`,
billing period `Monthly`, ABD 6,99 USD, TR elle 129,99 TL. Offer yok.

### 2.3 Lisanslı testçiler

Play Console > **Setup > License testing** > test edecek Gmail adreslerini
ekle. Bu hesaplar kapalı test build'inde **gerçek para ödemeden** satın alma
yapabilir. Kapalı test listendeki 12 kişiyi buraya eklemek zorunda değilsin,
yalnız sen ve varsa bir kişi yeter.

---

## 3. RevenueCat bağlantısı

### 3.0 Panelin 9 Ağu 2026'daki gerçek durumu

Ekran görüntülerinden okunanlar:

- Proje **afiet** açık.
- **API keys** sayfasında *SDK API keys* altında **tek satır var: `Test Store`**
  (`test_…`, 3 Ağu). `appl_…` ve `goog_…` YOK. Sebebi basit: o anahtarlar
  mağaza uygulaması eklenince **otomatik** oluşur, henüz ikisi de eklenmemiş.
- *Secret API keys* boş. Dilim 5'te (kurucu premium'u) bir tane gerekecek,
  şimdilik gerekmiyor.
- **Offerings > default** duruyor, iki paketi var (`$rc_monthly`,
  `$rc_annual`) ama içindeki ürünler **Test Store ürünleri** (`monthly`,
  `yearly`), gerçek mağaza ürünleri değil.
- Overview'da kurulum listesi **1/6**, Sandbox data açık, abone 0.

Yani: paketlerin iskeleti doğru kurulmuş, eksik olan mağaza bağlantısı.

**Paywalls sekmesine dokunma.** RevenueCat'in kendi paywall editörü var ama
biz paywall'ı kodda yazıyoruz; `default` offering'indeki "Add Paywall" boş
kalacak, bu bir eksiklik değil.

### 3.1 Sırayla yapılacaklar

Panelde: **Project Settings > Apps** (ya da sol menüde **Apps**).

### 3.1 Apple uygulaması

| Alan | Nereden gelir |
|---|---|
| App name | serbest, `afiet iOS` |
| **Bundle ID** | `co.afiet.app` |
| **In-App Purchase Key** | ASC > Users and Access > **Integrations > In-App Purchase** > (+) ile üret, `.p8` indir. Issuer ID + Key ID + .p8 üçlüsünü RC'ye yükle. StoreKit 2 yolu, yeni uygulamalar için doğrusu bu. |
| App-Specific Shared Secret | ASC > uygulaman > App Information > App-Specific Shared Secret > Manage. StoreKit 1 mirası, RC istiyorsa doldur. |
| App Store Connect API Key | Zaten var (EAS submit için ürettiğin anahtar). RC'ye vermek ürün senkronunu ve iade takibini açar, önerilir. |

### 3.2 Google uygulaması

| Alan | Değer |
|---|---|
| **Package Name** | `co.afiet.app` |
| **Service Credentials** | `apps/mobile/play-service-account.json` |

**9 Ağu 2026: RevenueCat bu JSON'u "geçersiz" dedi.** Dosya bozuk değil.
Elimizdeki servis hesabı `eas-play-publisher@afiet-co.iam.gserviceaccount.com`
(proje `afiet-co`) ve **EAS submit için** üretilmişti: yalnız test kanalına
sürüm yayınlama yetkisi var. RevenueCat ise abonelik durumlarını okumak,
siparişleri görmek ve olayları dinlemek istiyor. Eksik olan yetkiler.

Yeni servis hesabı açmaya gerek yok, mevcut olan genişletilir. Bu ayrıca
`iam.disableServiceAccountKeyCreation` org politikasına takılma riskini de
ortadan kaldırır: yeni anahtar üretmiyoruz, mevcut anahtarı kullanıyoruz.

> ✅ Adım 1 ve 2 **9 Ağu 2026'da koşuldu ve doğrulandı**: üç API açık,
> servis hesabı `roles/pubsub.editor` + `roles/monitoring.viewer` taşıyor.
> Kalan adımlar panelde (3, 4, 5).

**Adım 1, üç API'yi aç** (bu Mac'te gcloud yetkili):

```
gcloud config set project afiet-co
gcloud services enable \
  androidpublisher.googleapis.com \
  playdeveloperreporting.googleapis.com \
  pubsub.googleapis.com
```

**Adım 2, iki IAM rolü ver:**

```
gcloud projects add-iam-policy-binding afiet-co \
  --member=serviceAccount:eas-play-publisher@afiet-co.iam.gserviceaccount.com \
  --role=roles/pubsub.editor
gcloud projects add-iam-policy-binding afiet-co \
  --member=serviceAccount:eas-play-publisher@afiet-co.iam.gserviceaccount.com \
  --role=roles/monitoring.viewer
```

**Adım 3, Play Console yetkileri.** Play Console > **Users and permissions**.
`eas-play-publisher@afiet-co.iam.gserviceaccount.com` listede olmalı (yoksa
*Invite user* ile davet et). Aç ve **hesap seviyesinde** şu üç izni ekle:

- View app information and download bulk reports (read-only)
- View financial data, orders, and cancellation survey responses
- **Manage orders and subscriptions**

Üçüncüsü en sık atlanan. Onsuz RevenueCat aboneliği okur ama iade ve iptal
olaylarını işleyemez.

**Adım 4, aynı JSON'u RevenueCat'e tekrar yükle.**

**Adım 5, sabırlı ol.** Google'ın yetki yayılması **36 saati** bulabiliyor;
RC hâlâ geçersiz diyorsa hata sende değil, kuyrukta. Hızlandırma hilesi:
Play Console > Monetize with Play > Products altında bir ürünün açıklamasını
değiştirip kaydet, bu senkronu tetikliyor.

Kaynak: [Play service credentials](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials)

### 3.3 Anahtarlar

| Platform | Public SDK anahtarı | Durum |
|---|---|---|
| iOS | `appl_oOPgUZCBzdOFVQCRkYWkpwBNjch` | alındı, 9 Ağu |
| Android | `goog_…` | mağaza bağlanınca oluşacak |
| Test Store | `test_mmhKpIvBtDGCnmkzcLTLgERhwlq` | development/preview profilinde |

Bunlar **public** anahtarlar, uygulamanın içinde zaten gömülü gidiyorlar;
repoda durmaları sorun değil. `sk_` ile başlayan secret anahtar buraya
YAZILMAZ.

### 3.3 Entitlement ve offering

1. **Product Catalog > Products**: iki mağazadan da dört ürün girdisi import
   et (iOS x2, Android x2).
2. **Entitlements** > Create: identifier **`premium`**. Dört ürünü de bu
   entitlement'a bağla.
3. **Offerings** > Create: identifier **`default`**, "Make current" işaretle.
   İçine iki paket:
   - `$rc_annual` > yıllık ürünler (paywall'da önde durur)
   - `$rc_monthly` > aylık ürünler

Kabul ölçütü: RevenueCat panelinde `default` offering'i açtığında **iki
mağazanın da fiyatı görünüyor**. Fiyatlar boşsa ürünler henüz mağazada aktif
değildir ya da kimlik bilgileri eksiktir; bu haldeyken kod tarafına geçmek
zaman kaybı.

---

## 4. Kod ne zaman başlayabilir

**Cevap: şimdi.** Test Store sayesinde Dilim 2 mağaza ürünlerini beklemiyor
(bkz. `revenuecat-dilim-plani.md` R3, Dilim 2 bölümü). Kod ilerlerken sen
yukarıdaki panel işlerini yaparsın.

Mağazaya çıkış için hâlâ gereken, sırayla:

1. Mağazalarda ürünler (bölüm 1 ve 2).
2. RevenueCat'e iki mağaza uygulaması (bölüm 3), ardından oluşan
   **public** anahtarlar: `appl_…` ve `goog_…`.
   Bunları sohbete yapıştırabilirsin, public anahtar zaten istemcide gömülü
   gider. **`sk_` ile başlayan secret anahtarı ASLA yapıştırma**, o yalnız
   backend ortam değişkenine yazılır (Dilim 3/5).
3. `default` offering'inde dört gerçek ürünün fiyatının göründüğü onayı.
4. Play License testing listesi.

Sözleşme ve Apple sandbox hesabı tamam (9 Ağu).

---

## 5. App Review demo hesabı: kalıcı premium notu

`berk+appreview@afiet.co` (prod) hesabı hem Apple hem Google incelemesinde
kullanılıyor. Abonelik geldiğinde bu hesap **kalıcı premium** olmalı, çünkü:

- İncelemeci paywall'ın arkasındaki özellikleri göremezse "özellik çalışmıyor"
  diye reddediyor (App Review 2.1).
- Sandbox satın alması incelemecinin elinde her zaman çalışmıyor, özellikle
  Android tarafında.

Uygulama yolu (Dilim 3'te yazılacak): `entitlements` tablosuna bu kullanıcı
için `source='manual'`, `expires_at=NULL` bir satır. Yani sunucu gerçeği
mağazadan bağımsız olarak premium diyecek. Bu satır **prod DB'de** duracak ve
silinmeyecek. Admin panelinde de görünür olmalı ki yanlışlıkla temizlenmesin.

Aynı yol Dilim 5'teki "beta kohortuna 1 yıl kurucu premium'u" işiyle aynı
mekanizmadır; ikisi tek kodla çözülür.
