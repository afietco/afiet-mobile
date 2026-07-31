# RevenueCat entegrasyonu dilim planı

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
