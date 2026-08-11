# Fiyat politikası

> Durum: KARAR kaydı (31 Tem 2026) · mağaza çıkışı öncesi bağlayıcı çerçeve
> İlke tabanı: `feature-list/ekonomi-modeli.md` (free deneyim TAM, sağlık
> döngüsünün sürtünmesi asla satılmaz; o dokümandaki kırmızı çizgiler
> burada da aynen geçerli).
> Emsal araştırması: MFP/Yazio/Lifesum/Noom/Cal AI/Lose It!/Simple/
> MacroFactor + RevenueCat/Adapty benchmark'ları + Türkiye platform
> ekonomisi (31 Tem 2026 taraması).

## Karar günlüğü (31 Tem 2026)

| # | Karar | Sonuç |
|---|---|---|
| 1 | Monetizasyon modeli | **Hibrit freemium.** Çekirdek (kayıt, ritim, denge tabağı, sofra bezi, unvanlar) süresiz ücretsiz; premium = Kişisel Afi'ler + ikram kesesi + derin içgörü. Onboarding sonunda kapatılabilir paywall. |
| 2 | Katman yapısı | **Tek premium katman**, 3 Kişisel Afi dahil. İki katman / à la carte reddedildi. |
| 3 | Free Afi tadımlığı | **Cömert tadımlık:** günde 3 foto tanıma + Kişisel Afi'lerden haftada birkaç mesaj (başlangıç önerisi: toplam 3 mesaj/hafta, ölçümle kalibre edilir). |
| 4 | Premium AI tavanı | ~~"Sınırsız" pazarlanır + görünmez fair-use~~ **REVİZE EDİLDİ 5 Ağu 2026, aşağıdaki revizyon bölümüne bak.** |
| 5 | Aylık fiyat (TR) | **129,99 TL** (net ~92 TL). |
| 6 | Yıllık fiyat (TR) | **799,99 TL** (aylık karşılığı 66,66 TL, %49 indirim; net ~567 TL/yıl). |
| 7 | Trial | **YOK.** Cömert free tadımlık kalıcı deneme işlevi görür (Fastic benzeri yaklaşım). |
| 8 | Ek planlar | **Yok.** Yalnız aylık + yıllık; haftalık/3 aylık/lifetime reddedildi. |
| 9 | Beta jesti | **1 yıl ücretsiz premium + sofra bezine özel "kurucu" deseni** (tüm beta katılımcılarına). |
| 10 | Lansman teklifi | **Yıllık plana intro offer: ilk yıl 599,99 TL**, yenilemede 799,99 TL. |
| 11 | Altyapı | **RevenueCat** (2.500 USD MTR'ye kadar ücretsiz; Go backend'e webhook ile bağlanır). |
| 12 | Afi adları | **Korumalı unvanlar yumuşatılır:** Şef Afi kalır; "Diyetisyen Afi" ve "Psikolog Afi" YAYINLANMAZ (Türkiye'de korumalı meslek unvanları + App Review sağlık iddiası riski). Aday adlar: Denge Afi'si, Moral Afi'si; nihai isim BRAND çalışmasında. |

## Free / Premium ayrımı

| | Free (süresiz) | Premium |
|---|---|---|
| Öğün kaydı, denge tabağı, ritim, sofra bezi, unvanlar, grup/aile | TAM | TAM |
| Afi foto tanıma | günde 3 | sınırsız (fair-use) |
| Kişisel Afi'ler (3 kişilik) | haftada 3 mesaj tadımlık | sınırsız (fair-use) |
| İkram kesesi (desenler, Afi sahneleri, aile ikramı) | yok | her ay yenilenir |
| Derin içgörü (sezon raporu, örüntü okuması) | yok | var |

Kilit dili "eksik" hissettirmez (ekonomi-modeli kuralı): free kullanıcı
tadımlık bittiğinde davet görür, ceza değil.

## Birim ekonomi (CFO özeti)

- Komisyon: Apple Small Business Program + Google abonelik oranı ile iki
  mağazada da **%15**; KDV %20 fiyatın içinden kesilir → **etiketin
  ~%70,8'i ele geçer**.
- Yıllık 799,99 TL → net ~47 TL/ay. Tahmini Afi COGS (fair-use tavanlı
  ortalama premium kullanıcı): 5-25 TL/ay. Tavansız ağır kullanıcı kuyruğu
  60-190 TL/ay'a çıkabilirdi; fair-use bu yüzden pazarlık dışı.
- Free tadımlık COGS tavanı (günde 3 foto + 3 mesaj/hafta): ~10-20 TL/ay
  ve yalnız aktif kullanıcıda; edinim maliyeti gibi muhasebeleştirilir.
- Kur riski: mağaza abonelik fiyatları Apple kur güncellemelerinden muaf;
  TL fiyatı **6 ayda bir gözden geçir** (takvim geliştiricide).

## Mağaza kurulum notları

- Apple Small Business Program'a ve Google Play indirimli hizmet bedeli
  katmanına kayıt ol (ikisi de başvuru ister).
- Türkiye storefront fiyatı ELLE girilir (otomatik kur eşitleme TR için
  ~2 kat pahalı fiyat üretiyor). Baz ülke ABD yapılır; öneri: 6,99 USD/ay,
  49,99 USD/yıl (diğer vitrinler otomatik türer). UI Türkçe olduğundan
  yurt dışı satış marjinaldir, arbitraj derdi yok.
- Paywall'da yıllık plan ön seçili (kategori: satışların ~%68'i yıllık;
  yıllık abonede 12 ay tutunma %44'e karşı aylıkta %17,5).

## Ölçüm hedefleri (ilk 6 ay)

- Paywall görüntüleme → satın alma: hard paywall'sız kategori tabanı ~%2;
  hedef tadımlık etkisiyle %3-4.
- Yıllık plan payı: hedef ≥%60.
- İlk yenileme churn'ü ana takip metriği (kategoride yıllık iptallerinin
  %35'i ilk ayda: iade/pişmanlık penceresi).
- Fair-use eşikleri ilk 3 ayın gerçek kullanım dağılımıyla yeniden
  kalibre edilir (p95 kullanıcı tavana değmemeli).

## Revizyonlar

### 5 Ağu 2026 · karar 4 iptal: "sınırsız" denmeyecek

Premium'un hakkı **görünür ve sonlu** olacak. "Sınırsız" kelimesi paywall'da,
mağaza metinlerinde ve koşullar sayfasında kullanılmayacak.

**Neden:** görünmez tavan, tavana çarpan kullanıcıda aldatılmışlık hissi
üretiyor; "sınırsız" deyip arkada yavaşlatmak yanıltıcı pazarlama başlığına
giriyor; ayrıca kese tek para birimi olarak kalacaksa premium'un da kesesi
olmak zorunda, yoksa lig kademesinin ödülü ödeyen kullanıcıda anlamsızlaşıyor.

**Uygulaması:** premium haftalık kesesi büyür ama görünür kalır. Kodda
`packages/core/src/kese.ts` içindeki `KESE_PREMIUM_BONUS = 60` bu kararla
yeniden belirlenecek; **yeni sayı henüz seçilmedi**.

**Yukarıdaki tabloda etkilenen satırlar:** karar 4 tümüyle, karar 1'in
"premium = sınırsız Afi" okuması, ve Free/Premium tablosundaki "sınırsız
(fair-use)" hücreleri.

### 5 Ağu 2026 · karar 3 uygulaması ertelendi

Free tadımlık sayıları (günde 3 foto, haftada 3 mesaj) şu an bilinçli olarak
uygulanmıyor: test dönemi boyunca herkese günde 20 foto ve 30 Afi çağrısı
açık (`afiet-backend/internal/server/afi_handlers.go`). Politikadaki sayılara
çekme işi RevenueCat Dilim 4'e bağlandı.

### 9 Ağu 2026 · karar 3 yeniden yazıldı: sınır asistan bazında

Yeni çerçeve (kullanıcı):

| Yüzey | Free | Premium |
|---|---|---|
| Foto tanıma, besin tespiti | **tam ücretsiz**, para birimi harcamaz | aynı |
| Genel Afi sohbeti | **tam ücretsiz** | aynı |
| Beslenme asistanı | **3 mesaj**, sonrası premium | haftalık kese |
| Destek asistanı | **3 mesaj**, sonrası premium | haftalık kese |

Yani ödeme duvarı artık "kaç mesaj" değil, **hangi asistan** sorusunda.
Kayıt, ritim, denge, gruplar ve besin tanıma tarafı hiç dokunulmadan
ücretsiz kalıyor; ekonomi-modeli'nin "sağlık döngüsünün sürtünmesi satılmaz"
kuralı korunuyor.

**Kodun bugünkü hâli bunun tersi:** `packages/core/src/kese.ts` içinde
`KESE_MESSAGE_COST = 1` ve yorumu "There is no free agent", yani genel Afi de
keseden yiyor. Dilim 4'te ters çevrilecek.

**Açık kalan yapısal soru:** genel Afi bedava olunca free kullanıcının kesesi
(lig kademesine göre haftada 10-22, artı 25 kayıt hediyesi) harcanacak yer
bulamıyor; lig kademesinin ödülü free kullanıcıda anlamsızlaşıyor. Üç seçenek
`revenuecat-dilim-plani.md` R2b'de yazılı, karar bekliyor.

### 9 Ağu 2026 · premium kese sayısı karara bağlandı

`KESE_PREMIUM_BONUS = 60` **kalıyor**, yani premium haftada 60 asistan mesajı.
Kodda değişiklik yok; değişen tek şey metin: "sınırsız" denmeyecek, sayı
açıkça yazılacak.

### 5 Ağu 2026 · karar 12 genişledi: maskotlar

Korumalı unvan kısıtı duruyor. Buna ek olarak her asistan için **ayrı maskot**
planlanıyor (Afi gibi). Maskot adları da unvan içeremez.

### 9 Ağu 2026 · kese premium'un para birimi oldu (R2b'de A seçildi)

Free kullanıcı beslenme ve destek asistanlarıyla **3 mesaj** konuşur, sonrası
paywall. Kese ve lig kademesinin büyüyen ödülü açıkça **premium'un değeri**
olarak konumlanır.

**Bunun bedeli ve borcu:** lig kademesi atlamanın free kullanıcıdaki ödülü
artık kese olamaz, çünkü harcayacağı yer yok. Free tarafta yükselmenin ödülü
yeniden kurulmalı (aday: unvan ve sofra bezi deseni). Bu Dilim 4'ün parçası
ve **yapılmazsa oyunlaştırma para ödemeyen kullanıcıda boşa döner.**

### 9 Ağu 2026 · premium katmanın adı: **afiet+**

Uygulamadaki "afiet premium" metinleri afiet+ olacak. Mağaza tarafında da
ürün adlarının buna çekilmesi gerekiyor: App Store Connect'teki
localization'larda bugün "afiet premium yıllık / monthly" yazıyor.

## Açık işler

- [x] Premium haftalık kese büyüklüğü: **60** (9 Ağu 2026)
- [x] Free kullanıcının kesesi: A seçildi, kese premium'a geçti (9 Ağu 2026)
- [x] Premium katmanın adı: **afiet+** (9 Ağu 2026)
- [ ] "3 mesaj" ömür boyu mu haftalık mı, iki asistanın toplamı mı ayrı mı
- [ ] Free tarafta lig kademesinin yeni ödülü (A kararının borcu)
- [ ] İki Kişisel Afi'nin yayınlanacak adları (aday: Denge Afi, Moral Afi)
- [ ] Kişisel Afi'lerin nihai adları (karar 12'nin uygulaması)
- [ ] RevenueCat entegrasyonu: dilim planı hazır → [revenuecat-dilim-plani.md](revenuecat-dilim-plani.md)
- [ ] Paywall UI tasarımı (onboarding sonu + doğal upsell anları)
- [ ] SBP + Google indirimli katman başvuruları
- [ ] Beta → kurucu geçiş mekaniği (promo/entitlement ile 1 yıl hediye)
- [ ] Fair-use eşiklerinin backend'de ölçülüp uygulanması
