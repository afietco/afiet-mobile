# Play Console uyum rehberi (üretime çıkış öncesi)

> Durum: TALİMAT (5 Ağu 2026). `play-store-submission.md` 0.2.0 dünyasını
> anlatıyor ve Data safety tablosu artık YANLIŞ; bu dosya onun yerine geçer.
> Kaynak: koddan denetim (5 Ağu 2026), aşağıdaki her satır dosya adıyla bağlı.

Play Console'da doldurulacak formlar **Monitor and improve > Policy and
programs > App content** altında toplanıyor. Aşağıdakiler afiet için geçerli
olanlar.

---

## 1. Data safety (en riskli form)

Yol: **App content > Data safety > Start**.
Daha önce doldurulduysa aynı yerden **Manage** ile açılır, değişiklik bir
sonraki sürüm incelemesiyle yayına girer.

Kaynak: [Data safety form](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)

### 1.1 Neden yeniden doldurulmalı

Eski beyan "fotoğraf toplanmıyor, çökme/tanılama SDK'sı yok" diyordu. Bugün
kodda durum bu değil:

| Gerçek | Kanıt |
|---|---|
| Çökme ve tanılama toplanıyor | `apps/mobile/package.json` içinde `@sentry/react-native` |
| Fotoğraf sunucuya ve oradan Azure'a gidiyor | `POST /v1/afi/photo-chat`, gövdede `imageBase64` (`internal/server/afi_handlers.go`) |
| **Sohbet metinleri sunucuda saklanıyor** | migration `000040_sohbet_kayitlari`: `chat_turns(question, answer)` |
| Destek sohbeti ruh sağlığına değebiliyor | migration `000039_sohbet_rizasi`, ayrı açık rıza kaydı |
| Davranış telemetrisi gönderiliyor | `POST /v1/events` (`apps/mobile/src/data/api/client.ts`) |
| Push adresi kaydediliyor | `apps/mobile/src/features/push/push-notifications.ts` |

Sohbet saklama en kritiği: "içerik saklanmıyor" varsayımıyla doldurulmuş bir
form bugün **yanlış beyan** durumunda. Play'de yanlış Data safety beyanı
uygulamanın yayından kaldırılma sebebi.

### 1.2 İşaretlenecek veri türleri

Hepsinde **Collected: Evet**, **Shared: Hayır** (Stack Auth, Azure, Sentry ve
RevenueCat bizim adımıza işleyen hizmet sağlayıcılar; Play kurallarında bu
"paylaşım" sayılmaz), **Purpose: App functionality** (ek olarak hesap için
*Account management*, telemetri için *Analytics*).

| Kategori | Veri türü | Zorunlu mu | Not |
|---|---|---|---|
| Personal info | Name | Zorunlu | görünen ad |
| Personal info | Email address | Zorunlu | Stack Auth |
| Personal info | Other info | Zorunlu | cinsiyet, doğum tarihi |
| Health and fitness | Health info | Zorunlu | öğün, su, vücut ölçüleri, BMI/BMR/TDEE, destek sohbeti içeriği |
| Health and fitness | Fitness info | Opsiyonel | aktivite düzeyi |
| **Messages** | **Other in-app messages** | Opsiyonel | Afi sohbetleri sunucuda saklanıyor. YENİ, eski formda yok. |
| **Photos and videos** | **Photos** | Opsiyonel | Afi foto tanıma. YENİ. |
| App activity | App interactions | Opsiyonel | telemetri, ritim, seri |
| App activity | Other user-generated content | Opsiyonel | öğün notları, özel besinler, grup adları |
| **App info and performance** | **Crash logs** ve **Diagnostics** | Opsiyonel | Sentry. YENİ. |
| Device or other IDs | Device or other IDs | Opsiyonel | push adresi |
| **Financial info** | **Purchase history** | Opsiyonel | **paywall çıkınca eklenecek** (RevenueCat abonelik durumunu tutuyor) |

Fotoğrafta "processed ephemerally" kutusu: fotoğrafı biz saklamıyoruz, yalnız
`afi_photo_turn` olayında "fotoğraf var mıydı" bilgisi kalıyor. Ama Azure
kötüye kullanım denetimi için istekleri bir süre tutabiliyor. Bu ayarı
kapattığımızı yazılı olarak doğrulamadan **ephemeral kutusunu işaretleme**;
işaretlenmemiş olması yalnız formu daha muhafazakâr yapar, ceza getirmez.

### 1.3 Ekran ekran nasıl doldurulur

Form altı adımdan geçiyor, her adımın altında **Next**, en sonda **Submit**
var. Kaydetmeden çıkarsan taslak kalır, yayına girmez.

**Adım 1, Overview.** Sadece bilgilendirme. Next.

**Adım 2, Data collection and security.** Üç soru:
- *Does your app collect or share any of the required user data types?*
  **Yes.**
- *Is all of the user data collected by your app encrypted in transit?*
  **Yes** (her istek HTTPS).
- *Do you provide a way for users to request that their data is deleted?*
  **Yes.** Alt sorularda hem "hesabı silme" hem "veri silme talebi" yolunun
  olduğunu işaretle: uygulama içinde menü > Hesap ayarlarım > Hesabı ve tüm
  verileri sil, ayrıca `afiet.co/hesap-sil` ve destek@afiet.co.

**Adım 3, Data types.** Kutuları işaretlediğin uzun liste. 1.2'deki tabloyu
birebir uygula. İşaretlenecekler, kategori kategori:
- *Personal info*: Name, Email address, Other info
- *Financial info*: Purchase history **(yalnız paywall yayına girdiğinde)**
- *Health and fitness*: Health info, Fitness info
- *Messages*: Other in-app messages
- *Photos and videos*: Photos
- *App activity*: App interactions, Other user-generated content
- *App info and performance*: Crash logs, Diagnostics
- *Device or other IDs*: Device or other IDs

**Adım 4, Data usage and handling.** Adım 3'te işaretlediğin HER tür için ayrı
bir kart açılıyor ve aynı dört soruyu soruyor:
1. *Is this data collected, shared, or both?* → **Collected** işaretle,
   **Shared** işaretleme. Sebep: Stack Auth, Azure, Sentry ve RevenueCat
   bizim adımıza işleyen hizmet sağlayıcılar; Play'in tanımında bu "sharing"
   değil.
2. *Is this data processed ephemerally?* → hepsinde **No** bırak. Fotoğrafta
   "evet" demek teknik olarak savunulabilir ama Azure kötüye kullanım
   denetimi kayıt tutabildiği için riske girmeye değmez. "No" demek yalnız
   beyanı daha muhafazakâr yapar, ceza getirmez.
3. *Is this data required or can users choose whether it's collected?*
   → Name, Email, Other info (cinsiyet/doğum tarihi) ve Health info için
   **Required**; kalan hepsi için **Optional**.
4. *Why is this user data collected?* (çoklu seçim)
   → Hepsinde **App functionality**. Ek olarak: Name ve Email'de **Account
   management**, App interactions ve Diagnostics'te **Analytics**,
   Purchase history'de **App functionality** yeterli.
   **Advertising or marketing, Fraud prevention, Personalization kutularına
   dokunma.** Bunlardan biri işaretlenirse mağaza sayfanda "reklam için veri
   topluyor" yazar.

**Adım 5, Store listing preview.** Kullanıcının göreceği özet. Burada
"Data shared with third parties: No data shared" ve "Data collected: ..."
listesi çıkmalı. Beklemediğin bir satır görürsen adım 4'e dön.

**Adım 6, Submit.** Kaydet. Değişiklik anında yayına girmez, bir sonraki
sürüm incelemesiyle birlikte işlenir ve Google bunu 7 güne kadar
uzatabiliyor. Yani paywall sürümünü göndermeden **önce** güncelle.

### 1.4 Güvenlik uygulamaları özeti

- Data is encrypted in transit: **Evet** (HTTPS)
- Users can request that data be deleted: **Evet** (uygulama içi hesap silme +
  `afiet.co/hesap-sil` + destek@afiet.co)
- Independent security review: **Hayır**

---

## 2. Health apps declaration (atlanırsa kesin red)

Yol: **App content > Health apps > Start**. Test kanallarındaki uygulamalar
dahil, Play'de yayında olan herkes doldurmak zorunda.

Kaynak: [Health apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291?hl=en)

afiet için işaretlenecekler:

- **Nutrition**: kesin. Öğün kaydı, besin kataloğu, denge tabağı.
- **Activity / Fitness**: aktivite düzeyi ve vücut ölçüleri var; işaretle.
- **Mental Health**: burada dikkatli ol. Uygulamada "destek" adında bir
  asistan var ve ayrı bir açık rıza ekranıyla açılıyor
  (`migration 000039_sohbet_rizasi`). Bu özellik dururken Mental Health'i
  işaretlememek "Inaccurate Health Apps Declaration" reddine giden bilinen
  yol. İşaretle ve açıklama alanında **tıbbi tedavi ya da tanı iddiası
  olmadığını**, genel destek sohbeti olduğunu yaz.
- **Medical device / EU MDR**: **Hayır**. afiet tıbbi cihaz değil, tanı ya da
  tedavi iddiası yok.

Beyan metninde şu cümlenin bir karşılığı bulunsun: "afiet bir tıbbi cihaz
değildir, tanı koymaz, tedavi önermez; içerik genel bilgilendirme amaçlıdır."
Aynı cümle uygulama içinde de var (`apps/mobile/src/app/yapay-zeka.tsx`).

---

## 3. Diğer App content formları

Sıra önemli: **Ads** ve **App access** doldurulmadan *Target audience and
content* açılmıyor, o da doldurulmadan içerik derecelendirmesi tamamlanmıyor.

| Sıra | Form | afiet cevabı | Doküman |
|---|---|---|---|
| 1 | **Privacy policy** | `https://afiet.co/gizlilik` | [Prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en) |
| 2 | **Ads** | Uygulamada reklam **yok**. | |
| 3 | **App access** | Giriş gerekiyor, "All or some functionality is restricted" seç ve demo hesabı gir: `berk+appreview@afiet.co`. Talimat alanına giriş adımlarını yaz. **Abonelik çıkınca bu hesap kalıcı premium olacak** (`abonelik-kurulumu.md` bölüm 5). | |
| 4 | **Content rating** | *Start new questionnaire*. Kategori Utility/Productivity/Health. Şiddet, cinsellik, kumar, uyuşturucu: hepsi hayır. **"Kullanıcılar birbiriyle etkileşebilir mi" sorusuna EVET** demen şart: gruplar var, grup adı ve üye adları paylaşılıyor. Bunu gizlemek klasik red sebebi. Anket bitince IARC derecelendirmeyi e-postayla gönderiyor. | [Content ratings](https://support.google.com/googleplay/android-developer/answer/9859655?hl=en) |
| 5 | **Target audience and content** | Hedef yaş **18 ve üzeri**. Sağlık verisi topluyoruz; çocuk kitlesi seçilirse Families politikası açılır ve iş büyür. | [Target audience and content](https://support.google.com/googleplay/android-developer/answer/9867159) |
| 6 | **Data safety** | Bölüm 1. | [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en) |
| 7 | **Health apps** | Bölüm 2. | [Health apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291?hl=en) |
| 8 | **Advertising ID** | **Hayır**, reklam kimliği kullanmıyoruz. | [Advertising ID](https://support.google.com/googleplay/android-developer/answer/6048248?hl=en) |
| 9 | **News apps** | Hayır. | |
| 10 | **Financial features** | Hayır. Abonelik satmak bu formu tetiklemez, o form kredi/yatırım/kripto içindir. | |
| 11 | **Government apps** | Hayır. | |

### 3.1 RevenueCat eklendikten sonra yapılacak tek kontrol

8 numaralı beyanı "hayır" verip de uygulamanın manifestine
`com.google.android.gms.permission.AD_ID` izni sızarsa Play uyarı gönderir ve
sürümü bekletebilir. Bazı SDK'lar bu izni kendi manifestinde taşıyor ve merge
sırasında uygulamaya geçiyor. `react-native-purchases` eklendikten sonraki ilk
Android build'inde birleştirilmiş manifest kontrol edilecek; izin geldiyse
`app.json` içindeki `blockedPermissions` listesine eklenerek çıkarılacak
(orada zaten `SYSTEM_ALERT_WINDOW` için aynı yöntem kullanılıyor).

---

## 4. Store listing kontrolü

- Uygulama adı Console'da **`afiet`** olmalı (küçük harf). Daha önce "Afiet"
  yazıyordu.
- Store listing **tamamlanmış ve kaydedilmiş** olmalı. Play, kapalı test dahil
  her kanalda release kaydetmek için bunu şart koşuyor; taslak halde bırakılan
  listing release'i de bloke ediyor.
- Görseller `afiet-brand/play/` altında hazır: 512 ikon, 1024x500 feature
  graphic, 6 telefon + 6 tablet 7" + 6 tablet 10" ekran görüntüsü.
- Metinler: `afiet-brand/play/MAGAZA-METNI.md`.
- **Abonelik çıkınca store listing metnine eklenmesi zorunlu olan bilgi**:
  uygulamanın abonelik içerdiği, fiyatı ve süresi. Play bunu açıklama
  metninde arıyor. Önerilen kapanış paragrafı:

  > afiet'in temel özellikleri ücretsizdir. afiet premium isteğe bağlı bir
  > aboneliktir: aylık 129,99 TL ya da yıllık 799,99 TL. Abonelik, iptal
  > edilmediği sürece dönem sonunda otomatik yenilenir; Google Play hesabından
  > istediğin zaman iptal edebilirsin. Koşullar: afiet.co/kosullar

---

## 5. Kapalı test sayacını nereden izlersin

Testerlar 3 Ağu Pazartesi başladı, yani 14 günlük pencere **17 Ağu Pazartesi**
dolar (14 gün kesintisiz; bir kişi opt-out ederse o kişinin sayacı sıfırlanır
ve 12'nin altına düşersen pencere baştan başlar).

İzleme yerleri:

1. **Tester listesi ve opt-in bağlantısı**
   `Test and release > Testing > Closed testing > (track) > Manage track >
   Testers` sekmesi. Buradaki "Copy link" ile çıkan opt-in bağlantısı,
   testçinin tıklayıp kabul etmesi gereken adres. Listede olmak yetmez,
   **opt-in etmiş olmak** gerekiyor.
2. **Sayacın resmi durumu**
   Play Console **Dashboard**'da, üretim erişimi kartında ("Apply for
   production" / testing requirements). Kaç testçinin kaç gündür opt-in
   olduğunu Google'ın kendi saydığı yer burası. Benim hesabımdan değil, bu
   karttan doğrula.
3. **Geri bildirim**
   `Ratings and reviews > Testing feedback`. Üretim başvurusunda "testçiler ne
   dedi" sorusuna buradan cevap yazacaksın, o yüzden ara ara oku.

Kaynaklar:
[App testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en) ·
[Set up a closed test](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)

### 5.1 Takvim uyarısı

Üretim erişimi başvurusu 14 gün dolunca **otomatik açılmıyor**, Dashboard'dan
elle başvuruluyor ve Google'ın incelemesi **genelde 7 güne kadar** sürüyor.

- 17 Ağu: pencere dolar
- 17 Ağu: başvuru
- 24 Ağu: en kötü ihtimalle onay

20 Ağustos lansmanı bu hesapla Android tarafında **risk altında**. İki gerçek
seçenek var: lansmanı iki dalgaya bölmek (20 Ağu iOS, Android onay gelince) ya
da lansman tarihini 25 Ağu'ya çekmek. Karar senin, ama 17 Ağu'da başvuru
yapılmazsa ikisi de kayar.

Not: kapalı test sürerken uygulamayı güncellemek sayacı **sıfırlamaz**.
Paywall'lı 0.12.0'ı test devam ederken kapalı teste yayınlayabiliriz, hatta
yayınlamamız gerekiyor: satın alma akışı ancak orada gerçek testçiyle
denenebilir.

### 5.2 Tester freelancer'ına iletilecekler

Dört madde, hepsi sayacı koruma amaçlı:

1. **17 Ağu'ya kadar kimse opt-out etmeyecek.** Uygulamayı silmek sorun değil,
   ama Play'deki test programından çıkmak o kişinin sayacını sıfırlar ve 12'nin
   altına düşersek pencere baştan başlar. Bu tarihe kadar listeden kimse
   çıkarılmayacak, e-posta adresleri değiştirilmeyecek.
2. **Yeni sürüm gelecek, güncellemeleri kurmaları gerekiyor.** Paywall'lı sürüm
   test sürerken yayınlanacak; güncelleme sayacı sıfırlamaz ama testçilerin
   yeni sürümü kurup açması bizim için değerli.
3. **Geri bildirim yazsınlar.** Üretim erişimi başvurusunda Google "testçiler ne
   dedi, ne değiştirdin" diye soruyor ve bunu `Ratings and reviews > Testing
   feedback` sayfasından okuyacağız. Boş bir geri bildirim geçmişi başvuruyu
   zayıflatıyor. Kısa da olsa yazılı yorum istensin.
4. **Satın alma testi gerekmiyor.** Abonelik testini lisanslı testçiyle biz
   yapacağız; onlardan ödeme yapmaları istenmeyecek, öyle bir talep gelirse
   yanlıştır.

Bir de sormamız gereken bir şey var: **12 kişinin hepsi opt-in mi ve hangi
tarihte opt-in oldular.** Play Console Dashboard sayacı gösteriyor ama kişi
bazında kim ne zaman girdi bilgisi freelancer'da. 3 Ağu'dan sonra katılan biri
varsa pencere onun tarihine göre kayıyor.
