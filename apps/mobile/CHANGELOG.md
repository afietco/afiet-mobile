# Changelog — afiet mobil

Mobil uygulamanın sürüm geçmişi. Web'den bağımsız sürümlenir
(kaynak gerçeklik `apps/mobile/package.json` + `app.json`, tag'ler
`mobile-vX.Y.Z`). Build numarası EAS tarafından uzaktan otomatik artar
(`appVersionSource: remote` + `autoIncrement`).

## [Yayınlanmadı]

- ✨ Sayfalar yüklenirken artık boş/atlamalı açılış yerine tüm ekranı kaplayan
  sakin bir yükleme iskeleti (skeleton) görünüyor; veri gelince gerçek içerik
  yerine oturur. Ana sekmeler ve menü sayfalarının hepsinde aynı iskelet
- ✨ Afi ile fotoğraftan ekleme, tabaktaki birden çok besni artık tek tek
  ilerletiyor: ana bulguyu ekleyince (ya da yanlışsa reddedince) sıradaki besin
  kendiliğinden öne, ana bulguya geçer; kalanların her birini "Ekle" ya da
  "Reddet" ile yönet, yanlış tanınanı Afi'ye yazarak düzelt. Önceden ana besni
  ekleyince kalan besinler ekrandan kayboluyordu
- ✨ Grup davet linki artık çalışıyor: paylaşılan afiet.co/katil/{kod}
  bağlantısına dokununca afiet açılır ve seni doğrudan o gruba katılma adımına
  götürür (zaten bir gruptaysan sakin bir dille bilgilendirilirsin); uygulaman
  yoksa açılan sayfa kodu büyük gösterir, indirip Grubum > ID ile katıl'da bu
  kodu girersin
- ✨ Profil ekranı yenilendi: enerji halkalı büyük avatar, isminin altında
  @kullanıcı adı, Arkadaşlarım ve Grubum kısayolları (sofra arkadaşı sayın ve
  grubunun adı; dokununca ilgili sayfaya götürür), afiyet ritmi özeti
  (tamamladığın afiyet haftası + toplam afiyet günü) ve tek bakışta vücut +
  bugünün besin grubu dengesi özeti bir arada
- ✨ Arkadaş ve grup üyesi profil kartı zenginleşti: grubu, afiyet haftası ve
  "bugün afiyette ✨" rozetleri daha belirgin; sofra arkadaşınsa ya da
  grubundansa küçük bir "birlikte afiyet" vurgusu, sana açık sınırlı vücut
  bağlamı (cinsiyet · boy · aktivite) ve bugünün enerjisi sakin bir satırda
- ✨ Kullanıcı adı: profilden @handle'ını belirle ya da değiştir; yazarken adın
  uygun olup olmadığı anında ve sakin bir dille bildirilir
- ✨ Kayıt sırasında kullanıcı adı: yeni hesapta isminden hemen sonra bir @handle
  seçiyorsun; biçim yazarken denetlenir, ad başkasınca alınmışsa sakin bir dille
  başka bir ad seçmen istenir
- ✨ Kullanıcı adını artık Hesap ayarlarım'dan da yönetebilirsin: mevcut @handle'ını
  görüp tek dokunuşla değiştir (profildeki akışla aynı)
- ✨ Görünüm sayfası: tema seçimi (Açık / Koyu / Otomatik) artık hamburger
  menüdeki ayrı Görünüm sayfasında; Otomatik "Önerilen" olarak işaretli ve
  cihazının ayarını izler
- ✨ Arkadaşlarım sayfası: hamburger menüden aç, sofra arkadaşlarını enerji
  halkalarıyla gör, bekleyen istekleri (sana gelenler ve gönderdiklerin) tek
  yerden yönet; bir satıra dokununca arkadaşının profil kartı açılır
- ✨ Arkadaş ekleme: kullanıcı adıyla ara, çıkan sonucu tek dokunuşla ekle;
  isteğin karşı tarafın onayına düşer, o da seni eklediyse arkadaş olursunuz
- ✨ Arkadaşlık isteklerini artık bildirimlerden de yanıtlayabilirsin: gelen
  istek kaleminin altındaki Kabul et / Reddet ile hızlıca karar ver
- 🔧 Sosyal katman gerçek backend'e bağlandı: kullanıcı adı, arkadaşların ve
  istekler, kullanıcı araması, herkese açık grup keşfi ile katılma ve arkadaş
  profil kartı artık sunucuyla senkron ve cihazlar arası kalıcı; arkadaş ekleme,
  isteği kabul/geri alma ve gruba katılma dokununca anında görünür, arkada
  kaydedilir; listeler yüklenirken sakin bir bekleyiş, erişilemezse nazik bir
  "tekrar dene" gösterilir
- 🐛 Açılışta zümrüt splash ile içerik arasında beliren boş beyaz kare
  kaldırıldı: splash artık ilk ekran gerçekten çizilene kadar kalıyor ve
  yumuşak bir geçişle soluklanarak doğrudan içeriğe bağlanıyor
- 🐛 Onboarding avatar seçiminde emoji ızgarasının kartları ekranın sağ ve sol
  kenarından taşıyordu; kartlar artık yatay boşluğun içinde düzgün oturuyor
- 🐛 Grubum ekranında üyelerin enerji halkaları, sen besin ekleyince aynı
  kalıyordu; artık besin eklendiğin an grubun günün oranıyla yeniden çekilir ve
  halkalar canlı güncellenir (uygulamayı yeniden açmaya gerek yok)
- 🐛 Bir gruba katıldığında (herkese açık grup keşfinden ya da ID ile) ana
  ekrandaki Grubum kartı hâlâ "Bir gruba katıl" gösteriyordu; grup listesi artık
  tüm ekranlarca paylaşıldığından kart anında grubunun adına döner
- 🔧 Ana ekrandaki su kartında + / - artık anında tepki veriyor: bardak değeri
  dokunur dokunmaz değişiyor, kayıt arkada tamamlanıyor, bir aksilik olursa
  değer sessizce eski haline dönüyor
- ✨ Menüne Kaydet'te de fotoğraftan tanıma: yeni besin eklerken adını yazmak
  yerine kamerayla çekebilir ya da galeriden seçebilirsin; Afi tanırsa grup,
  ölçü ve yaklaşık değerleri düzenlenebilir biçimde forma doldurur, onaylayana
  kadar hiçbir şey kaydedilmez
- ✨ Fotoğraf akışlarına galeri seçeneği: hem "Afi ile ekle"de hem Menüne
  Kaydet'te kameranın yanına galeriden görsel seçmek için ayrı bir ikon geldi
- 🐛 "Afi ile ekle" sheet'inde klavye açılınca yazı satırı ve Gönder düğmesi
  klavyenin altında kalıyordu; artık giriş çubuğu klavyenin tam üstüne çıkıyor

- ✨ E-posta adresini artık uygulamadan değiştirebilirsin: Hesap ayarlarım ›
  E-posta › Değiştir'de yeni adresini yaz, sana gelen maildeki doğrulama
  bağlantısına dokun ve uygulamaya dönüp "Doğruladım, devam et" de. Böylece
  hesap ayarlarındaki son taslak ekran da gerçek oldu
- ✨ Apple ile giriş: giriş ve kayıt ekranındaki Apple butonuyla tek dokunuşla
  hesabına girebilirsin (yalnız iOS). Apple ile gelen hesaba dilersen Hesap
  ayarlarım › Şifre › Belirle'den bir de şifre belirleyip e-postanla da giriş
  yapabilirsin
- ✨ Google ile giriş: giriş ve kayıt ekranındaki "Google ile devam et"
  butonuyla hesabına girebilirsin (iOS ve Android). Onayı güvenli biçimde
  sistem tarayıcısında verirsin, bitince uygulamaya kendiliğinden dönersin
- ✨ Şifremi unuttum: giriş ekranındaki bağlantıyla kayıtlı e-postana bir
  sıfırlama bağlantısı gönderebilirsin; yeni şifreni afiet.co'da açılan
  sayfada belirleyip uygulamadan giriş yaparsın
- ✨ E-posta doğrulama: Hesap ayarlarım'da "Doğrulanmamış" rozetinin yanındaki
  Doğrula ile kendine doğrulama maili gönderebilirsin; yeni kayıtlara
  doğrulama maili otomatik gider ve maildeki bağlantıyla doğrulayıp
  uygulamaya döndüğünde rozet kendiliğinden güncellenir
- ✨ Şifreni artık uygulamadan değiştirebilirsin: Hesap ayarlarım › Şifre ›
  Değiştir'de mevcut ve yeni şifreni gir; kaydolunca sakin bir onay görürsün.
  Güvenlik için diğer cihazlardaki oturumların kapatılır, bu cihaz açık kalır
- ✨ Hesap ayarlarında e-posta satırı artık gerçek bilgini gösteriyor: giriş
  yaptığın adres ve yanında sakin bir doğrulama durumu rozeti (Doğrulanmış /
  Doğrulanmamış)
- 🔧 Oturum güvenliği sertleşti: giriş anahtarların cihazın güvenli deposuna
  (Keychain / Keystore) taşındı; güncelleme yapan kullanıcılar oturumdan
  düşmeden sorunsuz devam eder (sessiz taşıma)
- 🔧 Çıkış yaptığında oturum sunucu tarafında da sonlandırılıyor; cihazdaki
  temizlik ve çıkış her koşulda anında çalışır

- ✨ Kapsamlı arayüz revizyonu. Alt menü yeni sıra: Bugün · Beslenme ·
  Vücudum · Grubum. Geçmiş ve Profil sekmeden çıktı; sağ üstteki hamburger
  menüden açılıyor (Profilim, Bilgilerim, Alışkanlıklarım, Geçmiş günler,
  Hesap ayarlarım)
- ✨ Üst başlıkta yardımcı üçlü: sofra kesesi (harcama ekonomisi göstergesi;
  şimdilik mock + bilgi kartı, kazanç ekonomisiyle köprüsü yok), okunmamış
  sayısını gösteren bildirim rozeti (eski tek nokta yerine) ve sağdan açılan
  hamburger menü
- 🔧 Bugün panosu sadeleşti: Vücudum ve Su kartları yarı genişlik minimal
  ikiliye indi; altına Menüm ve Grubum kartları eklendi (Grubum: grubun varsa
  adını, yoksa "gruba katıl" teşvikini gösterir, dokununca Grubum'a gider)
- 🔧 Beslenme sayfası: Afiyet ritmi kartı Geçmiş'ten buraya taşındı; öğünler
  tek satırda, tek dokunuşla ekleme yapılan yeni tasarıma (MealBoard) geçti;
  enerji & makrolar ile Besin Rehberi + Menüm kısayolları korundu
- ✨ Yeni sayfalar (hamburger menü): Bilgilerim (besin grubu dağılımı odaklı
  istatistik), Alışkanlıklarım (kayıt düzeni, öğün tercihi, su alışkanlığı),
  Hesap ayarlarım (e-posta/şifre taslak; çıkış ve hesap silme gerçek).
  Profilim'de kimlik + tema kaldı; Geçmiş günler'de ritim kartı artık yok
- 🐛 Google ile giriş çalışmıyordu ("şu anda kullanılamıyor" hatası veriyordu);
  giriş isteğindeki bir güvenlik parametresi eksikti, düzeltildi
- 🐛 Çıkış yaptığında artık doğrudan giriş ekranına dönüyorsun (eskiden Hesap
  ayarlarım ekranında kalıp geri tuşuyla çıkman gerekiyordu)
- 🐛 Tema "Otomatik" iken uygulama artık gerçekten cihazının açık/koyu
  temasını izliyor: yayın yapısında (TestFlight) uygulama, cihaz teması hazır
  olmadan açıldığında temayı açık varsayıp öyle kalabiliyordu; açılışta cihazın
  anlık teması okunup uygulanıyor
- 🐛 Ana sekmeler (Bugün · Beslenme · Vücudum · Grubum) arasında geçerken
  klavyenin belirip kaybolması giderildi: alt sayfaların içeriği yalnızca sayfa
  ilk kez açıldığında yükleniyor; kapalı bir alt sayfadaki otomatik-odaklı
  giriş (Grup kur) artık ekran açılışında klavyeyi tetiklemiyor

- ✨ Grubun yoksa Grubum'da herkese açık grupları keşfet: kur/katıl
  seçeneklerinin altında hazır sofralar (logo, ad, üye sayısı) listelenir,
  birine "Katıl" diyerek aralarına katılabilirsin
- ✨ Grup üyesinin adına ya da avatarına dokununca profil kartı açılıyor;
  oradan arkadaşlık isteği gönderebilirsin (kendi satırın dokunulamaz)

## [0.4.0] — 2026-07-16

- ✨ Ana ekran widget'ı (Faz 1, iOS + Android): haftalık ritim noktaları,
  saat bağlamlı "öğünü ekle" kapısı ve köşeden bakan Afi; marka
  degradesi, emoji yok. Dokunuş uygulamayı o öğün önseçili Besin Ekle
  ile açar (afiet://ekle). Veri uygulamadan beslenir, widget internete
  çıkmaz. Not: widget yalnız native build'de görünür (TestFlight/dev
  build); Expo Go'da yoktur

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
