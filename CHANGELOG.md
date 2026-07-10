# Changelog

Bu dosya projedeki dikkate değer değişiklikleri kaydeder.
Format [Keep a Changelog](https://keepachangelog.com/tr/) esinlidir,
sürümleme [SemVer](https://semver.org/lang/tr/) izler.

Geliştirme sırasında maddeler `[Yayınlanmadı]` altına eklenir; release'te
tarihli sürüm başlığına taşınır ve `src/data/changelog.ts` ile senkronlanır
(uygulama içi "Yenilikler" ekranı oradan beslenir).

## [Yayınlanmadı]

### 🔧 İyileştirme

- Altyapı: mobil uygulama (Expo) hazırlığı — profil erişimi veri katmanına
  taşındı, Türkçe arama küçük/büyük harf dönüşümü tek yardımcıda toplandı ve
  uçtan uca smoke testi eklendi. Görünür davranış değişmedi.
- Altyapı: proje monorepo düzenine geçti — web uygulaması `apps/web` altında
  (`@afiet/web`), npm workspaces + tek kök lockfile. Görünür davranış değişmedi.
- Altyapı: platformdan bağımsız çekirdek `packages/core`a (`@afiet/core`)
  ayrıldı — tipler, besin listesi, hesaplar, repository arayüzleri artık web
  ve gelecekteki mobil uygulama arasında paylaşılıyor. Görünür davranış değişmedi.
- Altyapı: mobil uygulama iskeleti `apps/mobile` (Expo SDK 57 + expo-router +
  NativeWind) — sekme kabuğu, tema token aynası, Nunito ve çekirdek doğrulama
  ekranı. Web'i etkilemez; React her iki uygulamada 19.2.3'e sabitlendi.
- Altyapı: mobil veri katmanı — expo-sqlite üzerinde 5 repository'nin
  implementasyonu (`afiet.db`), canlı sorgu reaktivitesi (`useLive`), native
  aktif profil + FTUE bayrakları ve geçici veri testi ekranı. Web'i etkilemez.
- Altyapı: mobil onboarding akışı — web'deki 9 adımlı karşılama (isim, avatar,
  cinsiyet, çarklı doğum tarihi, boy, aktivite, kilo) native'e taşındı; giriş
  bileşenleri (WheelPicker, TextField, EmojiPicker, NumberDial) portlandı ve
  profil oluşmadan sekmelere girilmiyor. Web'i etkilemez.

## [0.7.0] — 2026-07-10

### ✨ Yeni

- Uygulamanın artık bir adı var: **afiet** 🍲 Yeni logo (buharı tüten kase),
  yeni uygulama kimliği ve "Sayma, dengele." mottosu. Ana ekran ikonu ve
  uygulama adı güncellendi; verilerin olduğu gibi yerinde duruyor.
- Logomuz bir maskota dönüştü: **Afi** — buharı tüten mutlu kase. Kapalı
  mutlu gözleri ve minik gülümsemesiyle "afiyet olsun" diyen karakterimiz;
  onboarding karşılaması ve ilk kayıt kutlaması da markaya bağlandı.
- Marka rehberi eklendi (`BRAND.md`): isim yazımı, ses tonu, tagline ve
  logo kuralları tek yerde.

## [0.6.0] — 2026-07-09

### ✨ Yeni

- Besin listesi zenginleşti: yerleşik tüm besinler artık kategori, besine
  uygun miktar ölçüsü (adet, dilim, kase, kaşık, bardak, fincan, avuç,
  porsiyon), 1 ölçü için yaklaşık makro değerleri ve kısa bir tanıtım
  bilgisi taşıyor.
- Beslenme ekranında "Enerji & Makrolar" kartı: günün yaklaşık enerji,
  protein, karbonhidrat ve yağ ilerlemesi kişinin TDEE'sinden türeyen
  hedeflere göre progress bar'larla gösteriliyor (vücut bilgisi yoksa genel
  referans + Vücudum'a davet).
- Besin Rehberi: beslenme ekranından açılan, kategorilere ayrılmış ve
  aranabilir besin listesi. Bir besine dokununca besin grubu, 1 ölçü için
  yaklaşık makrolar ve "Nedir?" bilgisini gösteren popup açılıyor.
- Besin eklerken miktar, besinin kendi ölçüsüyle soruluyor ("Kaç dilim?" /
  "Kaç kase?"); bilinmeyen besinlerde ölçü seçilebiliyor ve öğreniliyor.
  Öğün listesinde 1'den farklı miktarlar "1,5 porsiyon" gibi görünüyor.

### 🔧 İyileştirme

- Bugün'deki Beslenme kartı 5 besin grubu halkası yerine 4 makro halkası
  (enerji, protein, karbonhidrat, yağ) gösteriyor; köşedeki denge skoru
  çipi günün yaklaşık kalorisine dönüştü. Besin Rehberi kısayolu Bugün
  sayfasına taşındı.
- Sayfa geçişlerinde ekran artık her zaman en üstten başlıyor (önceki
  sayfanın scroll konumu yeni sayfaya taşınmıyor).

## [0.5.0] — 2026-07-09

### ✨ Yeni

- Onboarding akışı: ilk açılışta uygulama seni adım adım tanıyor — her ekranda
  tek soru (isim, avatar, cinsiyet, doğum tarihi, boy, aktivite, kilo),
  ilerleme çubuğu ve yumuşak yön duyarlı geçişlerle. Vücudum kurulumu artık
  daha uygulamaya girmeden tamamlanıyor; kilo girildiyse ilk ölçüm olarak
  kaydediliyor (istersen "Şimdilik geç").
- Custom input seti: çarklı gün/ay/yıl tarih seçici (native tarih kutusu
  yerine, temaya tam uyumlu), ± adımlayıcılı büyük sayı girişi (boy/kilo) ve
  yeni metin alanı. Vücudum kurulumundaki ve Ölçüm Ekle'deki tarih alanları da
  çarklı seçiciye geçti.
- FTUE: Bugün'de "Başlangıç Görevleri" kartı (ilk öğün, ilk su, ilk ölçüm —
  hepsi tamamlanınca bir kez kutlanır ve kaybolur), hiç kayıt yokken Beslenme
  kartı "İlk öğününü ekle" davetine dönüşür, ilk besin kaydı konfetili bir
  anla kutlanır. Beslenme ve Geçmiş'e ilk girişte tek seferlik mini tanıtım
  kartları eklendi.

### 🔧 İyileştirme

- Profiller arası geçiş kaldırıldı — uygulama artık tek kişilik (sıradaki
  hedef: hesap tabanlı backend). Profil sekmesi kişisel ayarlar sayfasına
  dönüştü: isim/avatar düzenleme, vücut bilgilerine kısayol, görünüm ve sürüm.
  Eski çoklu profilli kurulumlarda seçili (yoksa ilk) profil kullanılmaya
  devam eder, veriler silinmez.
- Onboarding cevapları oturum boyunca korunur: sayfa yenilense ya da sekme
  arka planda ölse bile akış kaldığı adımdan devam eder.
- Onboarding'in Devam butonu artık yapışkan — küçük ekranlarda uzun
  adımlarda (aktivite seçimi) bile hep görünür; aktivite kartları hafifçe
  sıkılaştırıldı.
- Çark seçici klavyeyle de kullanılabilir (yukarı/aşağı ok) ve seçim
  değişimi ekran okuyucuya duyurulur.
- Vücudum'daki tarih çarkları bölümün mor aksanına uyarlandı.

## [0.4.0] — 2026-07-09

### ✨ Yeni

- Bugün ekranı yenilendi: Beslenme, Vücudum ve Su kartlarıyla tek bakışta
  gün özeti; + ile ana ekrandan besin eklenir (öğün sheet içinde seçilir,
  saate göre makul öğün önseçilir).
- Yeni "Vücudum" ekranı: kilo ve mezura ölçülerini kaydet; BMI, günlük
  enerji ihtiyacı (BMR/TDEE) ve vücut yağ oranı (US Navy yöntemi)
  kendiliğinden hesaplanır — düğmeye basmak yok.
- Kilo yolculuğu grafiği ve ölçüm geçmişi.

- BMI kartına dokununca detay sheet'i: kısa açıklama, aralık rehberi ve
  BMI gelişim grafiği.
- Gelişim grafiklerinde zaman aralığı seçimi (1H / 1A / 1Y / Tümü) —
  seçenekler kayıt geçmişi biriktikçe görünür olur, varsayılan tüm zamanlar.
- Yolculuk kartı: kilo ve yağ oranı grafikleri alt alta, tek tarih
  filtresi ikisine birden uygulanır; grafiklere değer ve tarih eksenleri
  eklendi.
- Grafiklerde aylık görünüm: Ay seçiliyken önceki aylar arasında
  gezinilebilir (haftalık/yıllık seçenekler sadeleştirildi).
- Grafik çizgisi soldan sağa çizilerek girer; Bugün kartları art arda
  süzülerek açılır (hareket azaltma tercihine saygılı).
- Günlük Enerji kartına dokununca detay sheet'i: belirgin BMR/TDEE
  blokları, çarpan denklemi ve enerjiye göre makro pusulası
  (protein/karbonhidrat/yağ gram aralıkları).
- Enerji detayında su ve lif pusulası: TDEE'den günlük su ihtiyacı
  (litre + bardak) ve lif hedefi hesaplanır.
- Su kartının günlük hedefi artık kişisel: vücut bilgileri ve ölçüm
  varsa TDEE'den türetilen bardak sayısı kullanılır (yoksa 8 bardak).
- Geçmiş gün detayında o gün ölçüm alındıysa violet bir kartla
  gösterilir (kilo + mezura değerleri).
- Su kartı bardak ikonları yerine akışkan bir ilerleme çubuğuna geçti —
  hedef büyüyünce de derli toplu ("Hedefe 6 bardak kaldı" ipucuyla).
- Grafik çizgileri köşesiz, akışkan eğrilere dönüştü; alan dolgusu kalktı.
- Enerji sheet'inde makro pusulası da Su & Lif gibi renkli kutucuklara
  geçti (besin grubu renkleriyle uyumlu), bölümler ilişki sırasına dizildi.
- Geçmiş gün satırları yenilendi: tarih rozeti, gün adı, ölçüm rozeti,
  denge skoru pill'i; ilk kayıttan önceki günler artık listelenmez.
- Ölçüm Ekle'de mezura ölçüleri artık hep açık (katlanır bölüm kalktı).
- Bugün'deki Vücudum kartı sadeleşti: mini grafik kalktı, üç istatistik
  yeterli.
- Grafiklerde dokun-gör: bir noktaya dokununca tarih ve değer görünür,
  parmağını sürükleyerek noktalar arasında gezinebilirsin (dikey sayfa
  kaydırması bozulmaz, aynı noktaya ikinci dokunuş kapatır). Ölçüm
  noktaları çizgi üstünde silik boncuklarla belli olur — nereye
  dokunacağın baştan görünür (noktalar çok sıklaşınca gizlenirler).
- BMI Gelişimi grafiğinde denge aralığı bağlamı: 18,5–25 bandı soluk
  yeşil şerit ve kesikli sınır çizgisiyle gösterilir — çizginin denge
  aralığına yaklaşıp yaklaşmadığı tek bakışta okunur.
- İki ayı aşan grafiklerde ay başlarına ince ara işaretler ve kısa ay
  adları eklendi ("Tümü" görünümünde zaman artık daha okunaklı).

### 🔧 İyileştirme

- Beslenme detayı (öğün kartları ve besin ekleme) kendi sayfasına taşındı
  (`/beslenme`) — Bugün ekranı sadeleşiyor.
- Bugün kartları ortak başlık diliyle hizalandı: renkli ikon rozeti +
  başlık + sağda durum (denge skoru, son ölçüm günü, bardak sayısı).
- Ölçüm geçmişi sayfayı uzatmak yerine "Geçmiş" butonuyla açılan
  sheet'e taşındı; kayıtlar tarih rozetli, kilo değişimli ve mezura
  çipli yeni bir görünüme kavuştu.
- Bugün'deki Vücudum kartı zenginleşti: kilo (değişim okuyla), BMI ve
  yağ oranı (yoksa enerji) mini istatistikleri + tam genişlik trend.
- Bugün'deki Beslenme kartı sadeleşti (günlük mesaj yalnızca /beslenme'de).
- Grafiklerde son değer etiketi artık çizginin içinden geçmez: zemin
  renginde hale + çizgi yönüne göre akıllı konum; eksendeki aynı değerli
  etiket mükerrer yazılmaz.
- Grafik eğrisinin min/maks kılavuz çizgilerini taşması giderildi —
  yumuşatma artık gerçekte olmayan bir değer ima etmez.
- Aylık görünümde geçmiş ay gezilirken başlıktaki kilo/yağ değeri ve
  trend mesajı da o ayı anlatır ("Bu aralıkta 0,2 kg artış var." gibi).
- Grafik uç noktası ve değeri, çizgi kendilerine ulaşırken belirir
  (çizgiden önce havada asılı durmaz).
- BMI renk şeridi koyu temada daha canlı — segmentler zeminde kaybolmuyor.

### 🐛 Düzeltme

- Grafik çizgisi bazı ekran genişliklerinde son noktalara ulaşmadan kesik
  kalıyordu (çizim animasyonunun dash tekniği tarayıcıda piksel olarak
  yorumlanıyordu). Animasyon maske tekniğine geçirildi — çizgi artık her
  ekranda kesintisiz tek parça.

## [0.3.0] — 2026-07-09

### ✨ Yeni

- Dark mode: sistem tercihine otomatik uyum + Profil'den elle seçim
  (Açık / Koyu / Otomatik). Semantik renk token'larıyla tek yerden tema;
  durum çubuğu rengi ve form kontrolleri de temaya uyar, açılışta tema
  flash'ı yaşanmaz.

### 🔧 İyileştirme

- Emoji ikonlar yerine uygulamaya özel, tatlı çizgi stilinde SVG ikon seti
  (`src/ui/icons.tsx`): duotone, currentColor tabanlı — light/dark tema ve
  her vurgu rengiyle uyumlu. Besin grupları ve öğünler artık renkli özel
  ikonlarla gösteriliyor (`src/ui/appIcons.tsx`); gelecek özellikler için
  kupa, grafik, zil, dişli, nabız gibi ikonlar hazır.

## [0.2.0] — 2026-07-09

### ✨ Yeni

- "Bir Besin Daha 🍽️" butonu: besini kaydedip akışı sıfırlar, aynı öğüne
  zincirleme ekleme yapılır; öğüne eklenmiş besinler sheet üstünde
  rozetlerle görünür
- Geçmişte gün detayı: güne dokununca denge kartı, su ve öğün bazında
  besin listesini gösteren pop-up
- Bugün sayfasına saat bazlı karşılamalı, seri rozetli gradient hero header
- Uygulama içi "Yenilikler ✨" ekranı: güncellemeden sonra bir kez gösterilir,
  Profil sayfasından tekrar açılabilir

### 🔧 İyileştirme

- Porsiyon/adet seçimi kaldırıldı — kayıt akışı "yaz → kaydet"e indi
- Besin grupları besin netleşmeden gösterilmez; tanınan besinde yalnızca
  ilişkili gruplar görünür ("Düzenle" ile tam liste)
- Sheet'lere yumuşak açılış/kapanış animasyonu; pill ve liste girişlerine
  mikro animasyonlar (hareket azaltma ayarına saygılı)
- Uygulama fontu Nunito Variable oldu (self-hosted, offline destekli)
- Gün geçiş okları header'dan kaldırıldı — Bugün sayfası yalnızca bugünü
  gösterir, geçmiş günler Geçmiş sekmesinde

### 🐛 Düzeltme

- Besin yazılırken (henüz seçilmeden) tüm grup çiplerinin görünmesi

## [0.1.0] — 2026-07-08

### ✨ Yeni

- İlk sürüm: mobil öncelikli PWA (offline çalışır, ana ekrana eklenir)
- Öğün günlüğü: kahvaltı / öğle / akşam / ara öğün için besin kaydı,
  Türk yemekleri otomatik tamamlama ve kullanıcı girdilerinden öğrenme
- Günlük Denge: 5 temel besin grubu kapsama skoru ve yargılamayan
  günlük mesajlar (kalori sayımı yok)
- Su takibi (bardak sayacı) ve 🔥 kesintisiz kayıt serisi
- Geçmiş ekranı: son 7 günün denge çubukları
- Çoklu profil: aile üyeleri tek cihazda ayrı kayıt tutar
