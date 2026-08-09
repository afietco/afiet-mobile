# RevenueCat entegrasyonu dilim planı

> ⚠️ 5 Ağu 2026 revizyonu dosyanın sonunda: Dilim 0'ın gerçek durumu, "sınırsız"
> vaadinin iptali ve her dilimin başlamak için beklediği girdiler orada.
> Panel adımları ayrı dosyada: `abonelik-kurulumu.md`.

> Durum: PLAN (31 Tem 2026) · Politika kaynağı: `fiyatlandirma.md`
> İlkeler: önce UI (mock) sonra backend; her dilim cihazda görünür bir şey
> bitirir; dal modeli feature/* → development → staging → main.
> Ürün kimlikleri bu planda sabitlenir: entitlement `premium`,
> SKU'lar `afiet_premium_monthly` (129,99 TL) ve `afiet_premium_annual`
> (799,99 TL, intro ilk yıl 599,99 TL).

## Dilim 0 · Panel önkoşulları (kod yok, çoğu elle)

Kullanıcının dashboard'larda yapacağı işler; kod dilimleri bunlara takılmasın
diye en önce:

- [ ] App Store Connect: Paid Applications sözleşmesi + banka + vergi formları
      (IAP bunlarsız sandbox'ta bile çalışmaz).
- [ ] Play Console: satıcı (merchant) hesabı.
- [ ] Apple Small Business Program + Google indirimli hizmet bedeli başvuruları
      (fiyatlandirma.md kararı; onay beklerken geliştirme sürer).
- [ ] Mağazalarda abonelik ürünleri: iki mağazada da aynı SKU adları, tek
      abonelik grubu; yıllığa intro offer (ilk yıl 599,99).
      TR fiyatları ELLE (129,99 / 799,99), baz ülke ABD (6,99 / 49,99 USD).
- [ ] RevenueCat projesi: iOS (co.afiet.app) + Android uygulamaları, platform
      SDK anahtarları, entitlement `premium`, offering `default`
      (annual önde + monthly).
- [ ] RevenueCat webhook sırrı üret (Dilim 3'te kullanılacak).

Kabul: RevenueCat panelinde offering iki mağaza ürününü de gösteriyor.

## Dilim 1 · Paywall UI (mock, backend yok)

Expo Go'da çalışır; native modül henüz girmez (workflow: UI onaylanmadan
ileri gidilmez).

- `features/premium/` : `usePremium()` context'i, şimdilik mock
  (`isPremium`, `packages`, `purchase()`, `restore()`).
- Paywall ekranı: yıllık ön seçili kart (intro rozetiyle), aylık kart,
  "sınırsız Afi" dili, ekonomi-modeli'nin "eksik hissettirme" kuralına uygun
  davet tonu. Fiyatlar mock'ta sabit metin; Dilim 2'de StoreKit'ten gelecek.
- Giriş noktaları: onboarding sonu (kapatılabilir), foto tadımlık limiti
  dolunca çıkan davet, Kişisel Afi vitrini kartı.
- Restore / "aboneliğimi yönet" satırı (ayarlar menüsüne).
- Kurucu deseni önizlemesi (beta jesti görseli, sofra bezinde).

Kabul: cihazda tüm paywall akışı mock ile gezilebiliyor; kullanıcı onayı.

## Dilim 2 · SDK + sandbox satın alma (istemci gerçek)

- `react-native-purchases` (+ gerekirse config plugin) eklenir.
  DİKKAT: lockfile @emnapi tuzağı (yeni bağımlılıkta Linux CI `npm ci`
  kırılabilir); DİKKAT: Expo Go bu dilimden sonra premium akışını
  gösteremez, `expo run:ios` dev client gerekir.
- `Purchases.configure({ apiKey, appUserID: <Stack Auth user id> })` :
  kimlik login sonrası `logIn()` ile bağlanır (anonim → giriş alias'ı
  RevenueCat tarafında otomatik birleşir).
- Mock provider gerçek implementasyonla değişir: offerings → paywall
  fiyatları artık StoreKit/Play'den (lokalize), `CustomerInfo` →
  `isPremium`. Web önizleme yamaları (mobil-ui-web-onizleme) için RC
  import'u lazy/guard'lı olmalı, yoksa expo web kırılır.
- iOS sandbox tester + Play internal track lisanslı testçiyle: satın alma,
  restore, iptal, intro offer'ın doğru fiyat göstermesi.

Kabul: sandbox'ta satın alınca paywall kapanıyor, `isPremium` cihazda
anında değişiyor; typecheck + expo export + testler yeşil.

## Dilim 3 · Backend entitlement + webhook

- Migration 000035: `entitlements` tablosu (user_id, product_id, store,
  status, period_type, expires_at, environment, raw_event jsonb).
- `POST /v1/revenuecat/webhook`: Authorization header sırrıyla; işlenen
  eventler INITIAL_PURCHASE, RENEWAL, CANCELLATION, UNCANCELLATION,
  EXPIRATION, BILLING_ISSUE, PRODUCT_CHANGE. `app_user_id` = Stack Auth
  user id olduğu için eşleme doğrudan.
- Ortam kurgusu: tek RevenueCat projesi; her ortama ayrı webhook hedefi,
  dev/staging yalnız SANDBOX event'lerini, prod yalnız PRODUCTION
  event'lerini işler.
- `GET /v1/me/entitlements`: sunucu gerçeği; mobil açılışta çeker
  (istemci RC SDK anlık UI için, backend sunucu kapıları için tek gerçek).
- Webhook event'leri `events` tablosuna da düşer (admin Büyüme paneli
  Dilim 5'te bundan okur).

Kabul: sandbox satın alması webhook'la dev DB'ye düşüyor,
/v1/me/entitlements doğru dönüyor.

## Dilim 4 · Sunucu taraflı kapılar + fair-use

Politikadaki sayılar (`fiyatlandirma.md` karar 3-4): free günde 3 foto +
haftada 3 Kişisel Afi mesajı; premium görünmez tavan günde 30 foto / 100
mesaj.

- Afi uçlarına (vision, ask, gelecek Kişisel Afi uçları) entitlement +
  günlük sayaç kontrolü; sayaçlar DB'de (user_id, gün, tip, adet).
  Limitler koddan değil config/DB'den okunur (bildirim panelindeki
  desenle uyumlu; ölçümle kalibre edilecekler).
- Limit cevabı sözleşmesi: 429 + kalan hak + yenilenme zamanı; premium
  tavanında sert kesme YOK, nazik yavaşlatma (kuyruklama/bekletme).
- Mobil: 429'u yakalayıp paywall davetine köprü (free) ya da "Afi biraz
  soluklanıyor" tonu (premium fair-use); hata yolu yazılmamış bırakılmaz
  (18 Tem denetim bulgusu).
- DİKKAT: yeni enum/whitelist eklenirse handlers.go set(...) listeleri
  birlikte güncellenir (enum-whitelist tuzağı).

Kabul: free hesap 4. fotoğrafta daveti görüyor, premium hesap akıcı;
üç ortamda limitler config'den değişebiliyor.

## Dilim 5 · Kurucu geçişi + metrikler + lansman provası

- Beta → kurucu: RevenueCat granted entitlement API ile beta kohortuna
  1 yıl `premium`; sofra bezine kurucu deseni bayrağı (backend + mobil
  görseli Dilim 1'de hazırlandı). Kohort listesi beta başvuru tablosundan.
- Admin Büyüme paneli: abonelik sekmesi (aktif abone, MRR, paywall
  görüntüleme → satın alma dönüşümü, yıllık pay, ilk yenileme churn'ü).
  Hedefler fiyatlandirma.md "Ölçüm hedefleri" bölümünde.
- Paywall görüntüleme/kapama event'leri `events` tablosuna (track()).
- Lansman provası: TestFlight + Play internal'da tam akış (satın al,
  iptal et, iade senaryosu, restore, hesap silmede entitlement durumu),
  store metadata'da abonelik şartları metinleri.

Kabul: prova listesi yeşil; politika + uygulama birebir örtüşüyor.

## Kesişen tuzaklar (özet)

- Expo Go, Dilim 2 sonrası premium akışı için ölür; dev client şart.
- `npm install` sonrası lockfile @emnapi budaması → CI kırığı.
- Expo web önizlemesi RC import'unu kaldıramaz; lazy import + mock guard.
- Paid Apps sözleşmesi imzasız sandbox IAP bile çalışmaz (Dilim 0 önce).
- app_user_id daima Stack Auth id; anonim kullanım varsa logIn alias akışı
  test edilir (signOut temizliği 18 Tem denetim bulgusuyla birlikte ele al).
- Fiyat metni asla koda gömülmez; hep StoreKit/Play'den okunur
  (TR storefront elle fiyat, kur güncellemesi geliştiricide).

---

# 5 Ağu 2026 revizyonu

## R1. Dilim 0'ın gerçek durumu

| Madde | Durum |
|---|---|
| Apple Paid Applications sözleşmesi | **ACTIVE** (9 Ağu 2026 doğrulandı, Jul 17 2026 - Jul 9 2027). Banka hesabı Active, iki vergi formu (W-8BEN + Certificate of Foreign Status) Active, DSA Active. Sandbox IAP artık çalışır. |
| Play satıcı hesabı | Tamam |
| Google indirimli hizmet bedeli | Tamam |
| Apple Small Business Program | Başvuruldu, onay bekleniyor |
| Apple sandbox test hesabı | Hazır |
| RevenueCat projesi | Kuruldu ama **mağazalar bağlı DEĞİL**: API keys sayfasında yalnız `Test Store` satırı var, `appl_`/`goog_` anahtarları yok. Offering `default` iki paketle duruyor ama içindeki ürünler Test Store ürünleri. |
| **İki mağazada abonelik ürünleri** | **Kurulacak.** Adım adım talimat: `abonelik-kurulumu.md` |

Apple kuralı planı doğrudan bağlıyor: **ilk abonelik ve ilk abonelik grubu,
yeni bir uygulama sürümüyle birlikte incelemeye gönderilmek zorunda.** Yani
abonelikleri önden onaylatma seçeneği yok; 0.12.0 build'i ile ürünler aynı
incelemeye girer.

## R2. Politika revizyonu: "sınırsız" iptal

Karar 4'ün (`fiyatlandirma.md`) "sınırsız pazarlanır + görünmez fair-use"
kısmı **iptal edildi**. Yeni çerçeve:

- Premium'un hakkı **görünür ve sonlu** olur. Free'ye göre cömert, ama
  "sınırsız" kelimesi ne paywall'da, ne mağaza metninde, ne koşullar
  sayfasında geçmez.
- Sebep: görünmez tavan, tavana çarpan kullanıcıda "aldattılar" hissi
  yaratıyor; ayrıca mağaza metninde "sınırsız" deyip yavaşlatma uygulamak
  yanıltıcı pazarlama başlığına giriyor.
- Uygulaması: kese tek para birimi olarak kalır, premium kesesi büyür.
  **Sayı 9 Ağu 2026'da karara bağlandı: `KESE_PREMIUM_BONUS = 60` KALIYOR.**
  Kodda değişiklik yok; değişecek olan yalnız metin, "sınırsız" yerine
  haftalık 60 mesajın açıkça yazılması.

## R2b. Free/premium sınırı yeniden çizildi (9 Ağu 2026)

Kullanıcı kararı:
- **Besin tespiti tarafındaki her şey ücretsiz.** Foto tanıma ve genel Afi
  para birimi harcamaz.
- **Beslenme ve destek asistanları 3 mesaj ücretsiz**, sonrası premium.

Bu, kodun bugünkü kurgusunun tersi. `packages/core/src/kese.ts`:
`KESE_MESSAGE_COST = 1` ve yorumu birebir "One message to any assistant,
general Afi included. **There is no free agent.**" Yani bugün genel Afi de
keseden yiyor. Dilim 4'te bu ters çevrilecek.

**Çözülmemiş yapısal sonuç:** genel Afi bedava olunca free kullanıcının
kesesi harcanacak yer bulamıyor. Free haftalık kese lig kademesine göre
10-22 (`KESE_TIER_BASE`) artı 25 kayıt hediyesi. Beslenme/destek 3 mesajdan
sonra premium duvarına çarpıyorsa, **free kullanıcı için lig kademesinin
ödülü (daha büyük kese) anlamsızlaşıyor.** Üç seçenek kullanıcıya soruldu,
karar beklemede:
(A) kese premium para birimi olur, free'de lig ödülü unvan/rozet olur;
(B) free kullanıcı kesesini beslenme/destek'te harcar, "3 mesaj" kuralı
    yalnız ilk tadımlık olur;
(C) free'de haftada 3 mesaj sabittir, kese yalnız premium'da görünür.

Ayrıca netleşmesi gereken: 3 mesaj ömür boyu mu haftalık mı, ve iki asistanın
toplamı mı yoksa her biri için ayrı mı.

## R3. Her dilimin beklediği girdiler

Dilimler sırayla ilerliyor; her birinin başlaması için gereken şey burada.
Kod tarafı hazır olduğunda tek eksik bunlar olsun diye yazıldı.

### Dilim 1 (mock paywall) · dal hazır, terfi bekliyor
- Kod `feature/paywall-ui` dalında, **yalnız yerelde**, tek commit
  (`68b6edf`): `src/app/premium.tsx`, `src/features/premium/usePremium.tsx`,
  iki ölü düğmenin bağlanması.
- Gereken: premium katmanın **yayınlanacak adı** (şimdilik "afiet premium"),
  Kişisel Afi'lerin **yayınlanacak adları**, ve paywall metninin "sınırsız"
  dilinden R2'ye göre çevrilmesi.
- Bunlar olmadan da development'a terfi edilebilir; metin sonradan düzeltilir.

### Dilim 2 (gerçek SDK) · **Test Store ile ŞİMDİ başlanabilir**

9 Ağu 2026 kararı: mağaza ürünleri beklenmeyecek. RevenueCat **Test Store**
tam olarak bunun için var, mağazada tek ürün olmadan satın alma akışı uçtan
uca denenebiliyor (başarı, iptal, hata; abonelik 5 kez yenilenip iptal olur).
React Native SDK'sında asgari sürüm **9.5.4**.

**Değişmez kural:** Test Store anahtarıyla mağazaya build GÖNDERİLMEZ. Bu
yüzden anahtar profile göre ayrılır:

| eas.json profili | Anahtar |
|---|---|
| development, preview | `test_…` (Test Store) |
| production | `appl_…` ve `goog_…` (mağazalar bağlanınca) |

Yani `EXPO_PUBLIC_RC_IOS_KEY` / `EXPO_PUBLIC_RC_ANDROID_KEY` üç profilde aynı
değil; production'a gerçek anahtarlar girilene kadar o profil paywall'ı
kapalı tutar (bayrak), yanlışlıkla test anahtarıyla release alınamasın diye.

Kalan girdiler (mağazaya çıkış için, kod için değil):
1. `appl_…` ve `goog_…` public anahtarları (RevenueCat'e iki mağaza uygulaması
   eklenince otomatik oluşur).
2. `default` offering'inde dört gerçek ürünün fiyatının göründüğü onayı.
3. Play License testing listesi.

Teknik hatırlatmalar: `react-native-purchases` eklenince Expo Go premium
akışını gösteremez, dev client şart (`npx expo run:ios`). `npm install`
sonrası lockfile @emnapi budaması kontrol edilecek. Expo web önizlemesi için
RC import'u lazy ve guard'lı olacak.

### Dilim 3 (backend entitlement) · üç girdi bekliyor
1. **Webhook sırrı**: rastgele uzun bir dize. Ben üretebilirim, sen
   RevenueCat > Integrations > Webhooks ekranına yapıştırırsın; ya da sen
   üretip bana yalnız "kuruldu" dersin, değeri GitHub ortam sırrına yazarsın.
2. **GitHub environment secret'ları** (dev/staging/prod üçünde de):
   `REVENUECAT_WEBHOOK_SECRET`.
3. Webhook hedef adresleri RevenueCat'e girilecek (üç ortam ayrı):
   `https://app-api-dev-…/v1/revenuecat/webhook`, staging ve prod eşleri.
   Dev/staging yalnız SANDBOX, prod yalnız PRODUCTION olaylarını işler.

Yeni migration numarası **000047** olacak (son uygulanan 000046).

### Dilim 4 (sunucu kapıları) · üç karar bekliyor
1. Free tadımlık: günde kaç foto, haftada kaç Afi mesajı.
2. Premium hakkı: R2 gereği görünür bir sayı (haftalık kese büyüklüğü).
3. Limitlerin nerede tutulacağı: ortam değişkeni mi, DB'deki ayar tablosu mu.
   Öneri DB, çünkü ölçümle kalibre edilecekler ve panelden değişmeli.

Ayrıca `keseHasPremium()` bugün sabit `false` döndürüyor
(`afiet-backend/internal/store/kese.go`); entitlement gelince oraya bağlanır.

### Dilim 5 (kurucu + metrikler) · iki girdi bekliyor
1. **RevenueCat gizli anahtarı** (`sk_`): kurucu kohortuna entitlement
   tanımlamak için. Sohbete yapıştırılmaz, doğrudan backend ortam
   değişkenine yazılır.
2. Beta kohort listesinin kaynağı: beta başvuru tablosu mu, elle liste mi.

## R4. App Review demo hesabı kalıcı premium olacak

`berk+appreview@afiet.co` incelemecinin paywall arkasını görebilmesi için
kalıcı premium olacak; sandbox satın alması incelemecinin elinde her zaman
çalışmıyor ve "özellik çalışmıyor" reddi buradan geliyor.

**Yöntem kararı (9 Ağu 2026): RevenueCat promotional entitlement.**
Panelden "Grant a promotional entitlement" ile verilecek, aynı webhook'tan
bize düşecek, panelden geri alınabilecek. Kendi `source='manual'` DB
satırımız REDDEDİLDİ: iki ayrı premium kaynağı birbiriyle çelişebilirdi.
Sonuç: backend'in premium bilme yolu **tek**, o da RevenueCat webhook'u.
Beta kurucu kohortu da (Dilim 5) aynı mekanizmayı kullanacak.

Getirdiği kısıt: RevenueCat erişilemezse yeni entitlement bilgisi gelmez.
Son bilinen durum kendi DB'mizde durduğu için mevcut aboneler etkilenmez,
yalnız o sırada değişen bir şey gecikir. Kabul edildi.

## R5. Maskotlar

Afi tek maskot değil: her asistan için ayrı maskot planlanıyor (Şef Afi'nin
yanına diğerleri). Paywall'da premium'un ne olduğunu anlatan görsel dil buna
dayanacağı için, paywall görselleri maskot çalışması netleşmeden
kesinleştirilmeyecek. Korumalı unvan kısıtı burada da geçerli: maskot adları
"diyetisyen", "psikolog", "beslenme uzmanı" gibi unvanlar içeremez.
