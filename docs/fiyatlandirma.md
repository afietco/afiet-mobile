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
| 4 | Premium AI tavanı | **"Sınırsız" pazarlanır + görünmez fair-use** (başlangıç önerisi: günde 30 foto / 100 Afi mesajı; aşımda nazik yavaşlatma, asla sert kesme). |
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

## Açık işler

- [ ] Premium katmanın adı (BRAND çalışması; "afiet+" / "İkram" vb.)
- [ ] Kişisel Afi'lerin nihai adları (karar 12'nin uygulaması)
- [ ] RevenueCat entegrasyonu: dilim planı hazır → [revenuecat-dilim-plani.md](revenuecat-dilim-plani.md)
- [ ] Paywall UI tasarımı (onboarding sonu + doğal upsell anları)
- [ ] SBP + Google indirimli katman başvuruları
- [ ] Beta → kurucu geçiş mekaniği (promo/entitlement ile 1 yıl hediye)
- [ ] Fair-use eşiklerinin backend'de ölçülüp uygulanması
