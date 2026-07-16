# Changelog — afiet mobil

Mobil uygulamanın sürüm geçmişi. Web'den bağımsız sürümlenir
(kaynak gerçeklik `apps/mobile/package.json` + `app.json`, tag'ler
`mobile-vX.Y.Z`). Build numarası EAS tarafından uzaktan otomatik artar
(`appVersionSource: remote` + `autoIncrement`).

## [Yayınlanmadı]

- ✨ Afi ile fotoğraftan besin ekleme: Besin Ekle'de kamera düğmesi;
  tam ekran sohbet akışında Afi fotoğrafı tanır, emin olamazsa çipli net
  sorular sorar ya da ek fotoğraf ister; sonuç düzenlenebilir besin kartı
  olarak düşer, havuzda olmayan besin tek dokunuşla Menüm'e kaydedilip
  öğüne yazılır. Yazılmış ad ilk turda Afi'ye referans gider; karede
  görülen ek besinler "bunu da ekle" kartlarıyla sunulur. Fotoğraflar
  sunucuda saklanmaz; kota günde 20 tur (POST /v1/afi/photo-chat)

- ✨ Besin grupları genişledi: Bakliyat, Kuruyemiş, Hamur İşi ve İçecek
  eklendi (çekirdek 5'li ve denge skoru değişmedi); her birine özgün
  ikon ve renk
- 🔧 Menüne Kaydet'te grup çipleri sadeleşti: Afi doldurunca yalnız
  seçilenler görünür, elle girişte 3 varsayılan + "+N daha" ile açılır,
  "daha az göster" ile kapanır
- 🐛 Aynı formda ikinci kez "Doldur" denince besin bilgisi notu artık
  yeni öneriyle güncelleniyor (elle yazılmış not korunur)

- ✨ Afi asistanı, Menüm doldurma: "Yakında" rozeti gitti; yeni besin
  Afi'den geçer (Besin Ekle'den adla gelince öneri otomatik istenir),
  grup + ölçü + yaklaşık makrolar dolar, tüm alanlar düzenlenebilir
  kalır, onaysız kayda geçmez. Elle giriş "Değerleri kendim girmek
  istiyorum" ile; grup ve dört yaklaşık değer dolmadan kaydet pasif.
  Öneri sunucudan (POST /v1/afi/food-suggest, kota günde 30). Event'ler:
  afi_assist_used, afi_suggestion_accepted
- 🔧 Menüne Kaydet tam ekran modala taşındı (iOS'ta native kart): başlık
  ve kaydet çubuğu sabit, form ortada kayar; üst güvenli alan taşması
  kalmadı. Tüm sheet'ler artık çentik bölgesine giremiyor (topInset)

- ✨ Afiyet olsun jesti: Grubum'da o gün afiyette olan üyenin satırında
  "Afiyet olsun 🧡" butonu (üye başına günde 1 kez, gönderilince
  "dedin ✓" — durum sunucuda tutulur, cihazlar arası tutarlı); alınan
  selamlar bildirim merkezine düşer
- ✨ Bildirim merkezi: dört ana ekranın sağ üstünde sabit zil, okunmamış
  bildirimde turuncu nokta; dokununca bildirim listesi açılır (afiyet
  olsun selamları; ileride push bildirimleri de buraya düşecek). Liste
  ve okundu durumu sunucudan (GET /v1/notifications + ack)

- ✨ Geçmiş: "kesintisiz seri" pankartı emekli oldu; yerine afiyet ritmi
  kartı geldi (bu haftanın şeridi, "Toplam N hafta 🧡" rozeti, geçmiş
  haftaların dökümü ve "hedef 5 gün · 2 gün sofra payın var" notu).
  Günlük liste aynen duruyor
- 🔧 Bugün başlığındaki alevli seri rozeti ritim rozetine dönüştü: kase
  ikonu + bu haftanın afiyet günü sayısı; hedef dolunca 🧡. Kayıp dili
  ("seriyi bozma") tüm uygulamadan kalktı

## [0.3.1] — 2026-07-15

- ✨ Profil › Afiyet ritmin: haftalık özet artık profilinde — bu haftanın
  canlı şeridi ve afiyet günü sayısı, kalıcı "Toplam N hafta 🧡" rozeti ve
  geçmiş haftaların dökümü (tarih aralığı, mini noktalar, gün sayısı,
  kazanılan haftalarda 🧡; boş haftalar listelenmez, kayıp dili yok)
- ✨ Hafta kapanışı: hedefe ulaşan hafta bittiğinde (pazar günü tuttuysa o
  akşam) Afi'li konfetili kutlama — "Bu hafta afiyetteydin 🎉", haftanın
  noktaları ve kalıcı "Toplam N afiyet haftan" sayacı (asla azalmaz,
  hesabında saklanır). Ulaşılamayan haftada hiçbir mesaj yok — pencere
  pazartesi sessizce tazelenir
- 🔧 Ritim sayıları sadeleşti: "1/5", "5/7" gibi kesirler kalktı — şerit
  artık düz afiyet günü sayısı gösterir; 5'e ulaşan hafta afiyet haftası olur

- ✨ Soframız: Grubum'a grubun ortak haftalık hedefi geldi — afiyet günü
  halkası (hedef: üye × 5), gün-gün grup çubukları (kişi kırılımı yok) ve
  üyelerde "bugün afiyetteydi" işareti; Bugün'deki beslenme kartına 7 noktalı
  kişisel afiyet ritmi şeridi (bugünün noktası nabızlı, Pzt–Paz penceresi).
  Veriler canlı: afiyet günü = o gün en az bir öğün kaydı, backend hesaplar
- ✨ Sofra görünürlüğüm: grup ayarlarında tek anahtar — kapatınca grup enerji
  halkanı ve afiyet günlerini GERÇEKTEN göremez olur (sunucu tarafında);
  öğün detayı ve kilo hiçbir zaman görünmez. ID ile katılırken bilgilendirme
- ✨ Görünmez temel: davranış telemetrisi açıldı (kendi events tablomuz,
  toplu ve sessiz gönderim) — oyunlaştırma guardrail'leri buradan okunacak
- 🔧 Bugün: renk el değiştirdi — karşılama başlığı tek satırlık kompakt
  şeride indi (selam · tarih, isim, seri rozeti, avatar), zümrüt degrade
  sayfanın odağı olan Beslenme kartına taşındı; makro halkaları degrade
  üzerinde tek ton beyaz (renkli set yeşilde iyi okunmuyordu)
- 🔧 Alt menü sırası: Bugün · Grubum · Geçmiş · Profil
- 🔧 Yazılar uygulama genelinde bir tık büyüdü (okunabilirlik geri bildirimi)
- 🐛 Grubum: üye çıkarma/düzenleme sonrası enerji halkaları sıfırlanıyordu —
  eldeki oranlar korunur; Beslenme kartının degradesi kart büyüyünce yarım
  kalabiliyordu — kart boyutu ölçülerek çizilir
- ✨ Grubum sekmesi: gruplar Profil'den alt menüde kendi sekmesine taşındı ve
  tek grup modeline geçildi — herkes bir grupta bulunur; grubun yoksa sıcak
  karşılama + kur/katıl, grubun varsa grubun kendisi sayfada yaşar. Süreli davet
  kodu yerine kalıcı 8 haneli grup ID'si (adın yanında, dokununca paylaşılır) ve
  "Gruba davet et" linki; katılma bu ID ile. Düzenleme (logo + ad) ve grubu
  sil / gruptan ayrıl pop-up'ta: kurucu üyeleri çıkarabilir ve grupta tek başına
  kaldıysa grubu silebilir. Üye avatarlarının çevresinde günün enerji halkası:
  0'dan büyüyerek dolar, maviden yeşile olgunlaşır, aşımda turuncudan kırmızıya
  döner. Grup ID/logo/üye enerji oranları canlı backend'den gelir (grup v2
  API'si); üye avatarları profil emojisini gösterir; davet paylaşımı kalemin
  yanındaki paylaş ikonunda
- ✨ Tanıtım turu: uygulamayı ilk kez açanlar girişten önce 3 sayfalık
  kaydırmalı tanıtımla karşılanıyor (Sayma dengele · Sofranın diliyle ·
  Ailece birlikte) — bir kez gösterilir, Atla ile geçilebilir
- 🐛 Oturum: her açılışta yeniden giriş isteniyordu — token yenileme isteği
  gövdesiz gittiği için Stack Auth her seferinde 400 dönüyordu; istek boş JSON
  gövdesiyle düzeltildi, oturum artık cihazda kalıcı (aynı hata hesap silmede
  Stack kimliğinin sessizce silinememesine de yol açıyordu, o da düzeldi)
- 🐛 Oturum: token yenileme geçici bir ağ hatasında bile oturumu kapatıyordu —
  artık yalnızca refresh token gerçekten geçersizse çıkış yapılır; aynı anda
  gelen istekler tek yenileme çağrısını paylaşır (beklenmedik "çıkış yapılmış"
  durumlarının olası sebebi)
- 🐛 Kayıt: "bu e-posta zaten kayıtlı" durumunda e-posta adresini içeren uzun
  İngilizce ham hata görünüyordu — kısa Türkçe mesajla değiştirildi; bilinmeyen
  auth hatalarında da ham sunucu mesajı artık gösterilmiyor
- 🐛 Bugün: başlangıç görevleri kartının su sorgusu geçersiz bir tarih
  aralığı yüzünden sunucudan hata alıyordu; artık geçerli aralık kullanılıyor
  ve kart sorgu hatalarında sessizce toparlanıyor (giriş ekranında boş hata
  bildirimi çıkabiliyordu)
- ✨ Gruplarım: Profil'den grup kur ("Ailem", "Arkadaşlarım"…) ya da 6 haneli
  davet koduyla bir gruba katıl — birden çok grupta yer alabilirsin; grup
  detayında üyeleri gör, davet kodunu Paylaş ile gönder, kurucuysan adı
  düzenle ve üye çıkar, dilediğinde gruptan ayrıl
- 🔧 Vücudum: BMI ve Günlük Enerji tek "Veri Ekranı" kartında birleşti —
  kartta enerji ihtiyacın, BMR ve BMI aralığı barı; dokununca sheet yerine
  yeni Veri Ekranı açılıyor (BMR/TDEE, su & lif'in makroların altına indiği
  sade makro pusulası, BMI kartı + gelişim grafiği)
- ✨ Vücudum: Hedeflerim kartı yerini aldı (yakında 🎯)


- ✨ Besin havuzu 109'dan **509'a** çıktı: 400 yeni Türk/dünya mutfağı besini
  (kebaplar, çorbalar, zeytinyağlılar, meyve/kuruyemiş, tatlılar, içecekler…)
  eklendi. Havuzdaki HER besin artık gramaj (`gramPerMeasure`), lif (`fiberG`),
  yakıştığı öğünler (`suitableMeals`), diyet etiketleri
  (vejetaryen/vegan/glutensiz/laktozsuz), emoji, önerilen varsayılan miktar,
  arama eşanlamlıları (`aliases`), sıvı katkısı (`liquidMl`, içecek/çorba) ve
  daha hafif alternatif (`lighterAlternative`, "denge hamlesi") taşıyor.
  Autocomplete artık ada ek olarak eşanlamlıları da eşleştiriyor. Backend
  katalog eşitlemesi migration `000007_foods_v2_enrichment` ile geldi
  (UI'da yeni alanları yüzeye çıkarma ayrı adım)

## [0.2.0] — 2026-07-10

- ✨ Menüm: kendi besinlerini grup, ölçü, makro ve kısa bilgiyle kaydet;
  Beslenme'deki karttan ulaş, düzenle, sil
- ✨ Besin eklerken listede olmayan bir besin yazınca yandaki düğmeyle
  menüne kaydedebilirsin — grup/ölçü soruları bilinen besinlere sadeleşti
- ✨ Menüne makro girdiğin besinler günlük enerji ve makro pusulana sayılır
- ✨ Afi sahnede: besin kaydederken makro ve bilgileri senin yerine
  doldurmaya hazırlanıyor (yakında)
- 🔧 Beslenme ekranı derli toplu: öğünler 2×2 kart oldu, Besin Rehberi
  Bugün'den Beslenme'ye taşındı (yanında Menüm kısayolu)
- 🔧 Besin ekleme sheet'i sabit yükseklikte açılıyor — yazarken zıplamıyor
- 🔧 Besin ekleme sheet'indeki öğün çiplerinden kayıt silinebilir

## [0.1.1] — 2026-07-10

- 🔧 Görünmez ama önemli: sürümler artık otomatik hatta — bundan sonra
  güncellemeler TestFlight'a kendiliğinden düşecek.

## [0.1.0] — 2026-07-10

İlk TestFlight sürümü 🎉 — web uygulamasının tüm özellikleri native'de:

- ✨ Karşılama akışı: isim, avatar, doğum tarihi çarkı, boy/kilo, aktivite
- ✨ Bugün: günün özeti, makro halkaları, su sayacı, başlangıç görevleri
- ✨ Beslenme: Türkçe aramalı besin ekleme, öğün kartları, enerji/makro pusulası
- ✨ Geçmiş: 7 günlük denge çubukları, seri, gün detayı
- ✨ Besin Rehberi: kategorili liste ve yaklaşık değerler
- ✨ Vücudum: BMI/enerji, ölçümler, dokunmatik kilo ve yağ oranı grafikleri
- ✨ Profil: isim/avatar düzenleme, açık/koyu tema
- ✨ Kutlamalar, tanıtım kartları ve haptik dokunuşlar
