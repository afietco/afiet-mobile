# Hedeflerim (Vücudum sekmesi)

> Durum: tasarlandı, kod yazılmadı · Karar tarihi: 27 Tem 2026
> Süzgeç: **"Sofrayı saydırmadan dengeler"** (BRAND.md, feature-list/README).

Vücudum sekmesindeki "Hedeflerim" kartının arkasına gelecek ekranın ve onu
besleyen hesap motorunun tasarımı. Bu dosya tek başına yeterli olacak şekilde
yazıldı; kod yazan oturum başka yere bakmak zorunda kalmamalı.

---

## 1. Sorun

Bugün makro hedefi şöyle üretiliyor (`packages/core/src/bodyMetrics.ts`):

```
BMR  = Mifflin-St Jeor(cinsiyet, kilo, boy, yaş)
TDEE = BMR × aktivite çarpanı
makro = TDEE'nin sabit yüzdeleri (protein %20-30, karb %45-55, yağ %25-35)
```

Bunun iki ayrı kusuru var:

**Doğruluk.** Mifflin bireysel bazalda ±%10-15 sapar, aktivite çarpanı ise en
gürültülü girdidir (1.2 ile 1.9 arası %58'lik yelpaze, ve kullanıcı kendini
sistematik olarak abartır). İkisi çarpıldığında gerçek hata payı ±%20'ye çıkar.
"2400 kcal" yazan yerde gerçek değer 1950 ile 2850 arasındadır.

**Yöntem.** Protein ihtiyacı kaloriyle değil yağsız kütleyle ölçeklenir. Yüzde
tabanlı hesap, az yiyen kullanıcıda proteini gerçek ihtiyacın altına, çok yiyende
gereksiz yükseğe iter. Ayrıca kullanıcının ne istediği hiç sorulmuyor; herkese
aynı dağılım veriliyor.

Elde olup kullanılmayan iki veri var: mezura ölçüleri yağsız kütleyi açıyor ama
hiçbir hesaba girmiyor, spor listesi ise tamamen dekoratif duruyor.

---

## 2. Karar günlüğü

| Karar | Sonuç |
| --- | --- |
| Ekranın rolü | Günlük takip **değil**. Beslenme sekmesi "bugün ne yedim"i, Hedeflerim "ölçülerim nereden geldi"yi anlatır. |
| Kalori ve gram | Görünür ama **önceliklendirilmez**. "Sayılarla" katlanır bölümün altında. Birincil dil el ölçüsü. |
| Veri ekranı | `veri.tsx` ölmez, Hedeflerim'in "Sayılarla" katmanı olur. Vücudum'daki ayrı kart kalkar. |
| Hedef kilo | Sorulmaz, gösterilmez. Motor içinde ara değer olarak hesaplanabilir. |
| Süre projeksiyonu | **Yok.** Gerekçe: bölüm 11. |
| Yön seti | Yumuşak, 5 seçenek. Kilo dili kullanılmaz. |
| Yön değişimi | İstenildiği an seçilir, **gelecek pazartesi** geçerli olur. Cron değil, tarihli satır (bölüm 7). |
| Hareket verisi | HealthKit ve Health Connect entegre edilir, izin varsa aktivite çarpanı devre dışı kalır. Beta sonrası. |
| Kalibrasyon | Formül başlangıç tahmini, 2-3 hafta sonra kullanıcının kendi trendiyle düzeltilir. Beta sonrası. |
| İlk kurulum | Yön kurulumda sorulmaz. FTUE olarak, ilk adımlar bitince öğretilir. |
| Mevcut kullanıcı | Yok (beta öncesi). Migration ve varsayılan atama derdi yok. |

---

## 3. Yön seti

Kullanıcının gördüğü metin kilo dili kurmaz. İç temsil `direction` anahtarıdır.

| Ekranda | Anahtar | Enerji | Protein (g/kg FFM) |
| --- | --- | --- | --- |
| Daha hafif hissetmek istiyorum | `hafifle` | −%11 | 1.8 – 2.2 |
| Kilom değişmeden daha iyi hissetmek istiyorum | `donusum` | −%3 | 2.0 – 2.4 |
| Olduğum yerde iyiyim | `koru` | Denge | 1.4 – 1.8 |
| Daha güçlü hissetmek istiyorum | `guclen` | +%8 | 1.8 – 2.2 |
| Önce bir düzen kurayım | `duzen` | Denge | 1.4 – 1.6 |

`duzen` varsayılandır. Yön seçilmemiş kullanıcı bu değerlerle çalışır ve ekranda
sayısal hedef değil yalnızca denge dili görür.

`donusum` seçeneği dış modelden alındı (bkz. bölüm 11) ve afiet'e en çok yakışan
seçenektir: tartıyı merkeze almadan iyileşmeyi anlatır.

FFM bilinmiyorsa (mezura ölçüsü yok) protein toplam kilo üzerinden hesaplanır ve
katsayılar 1.2 – 1.6 g/kg aralığına iner.

---

## 4. Hesap motoru

### 4.1 Kompozisyon

```
BF   = US Navy(cinsiyet, boy, bel, boyun, kalça)      // mevcut kod, değişmiyor
FFM  = kilo × (1 − BF)
```

`BF` yoksa FFM de yoktur; motor bunu bilerek düşük güvenle çalışır.

### 4.2 Bazal

```
FFM varsa:  BMR = 370 + 21.6 × FFM              // Katch-McArdle
FFM yoksa:  BMR = Mifflin-St Jeor(...)          // mevcut kod
```

Katch-McArdle cinsiyet ve yaş değişkenlerine ihtiyaç duymaz, çünkü ikisi de
zaten yağsız kütleyi tahmin etmeye yarıyordu. Atletik ve obez uçlarda Mifflin
belirgin şekilde saparken Katch daha isabetlidir.

### 4.3 Enerji

Hareket verisi izni varsa:

```
TDEE = BMR + aktif_enerji(son 7-14 gün ortalaması) + BMR × 0.10
```

Son terim besinin termik etkisidir. **Aktivite çarpanı bu durumda tamamen devre
dışı kalır**, yoksa hareket iki kez sayılır ve hedef şişer.

İzin yoksa mevcut çarpan kullanılır, ama tek değer yerine aralık olarak:

| Seviye | PAL aralığı | Orta |
| --- | --- | --- |
| `hareketsiz` | 1.20 – 1.35 | 1.275 |
| `az` | 1.35 – 1.50 | 1.425 |
| `orta` | 1.50 – 1.65 | 1.575 |
| `aktif` | 1.65 – 1.80 | 1.725 |
| `cok_aktif` | 1.80 – 1.95 | 1.875 |

Orta noktalar mevcut çarpanlara yakın kalır, yani geçiş sarsıntısız olur.

### 4.4 Kalori hedefi

```
E            = enerji önceliği ∈ [0,1]   // 1 = enerjim önemli, 0 = daha belirgin sonuç
DeficitRate  = 0.15 − 0.08 × E           // %7 ile %15 arası
KaloriHedefi = TDEE × (1 − DeficitRate)  // yön `guclen` ise (1 + 0.08)
```

Beta'da `E` sorulmaz, sabit **0.5** (yani yaklaşık %11 açık). Sonraki sürümde
üç seçenekli yumuşak bir soruya bağlanabilir.

Haftalık değişim tavanı ayrıca uygulanır:

```
HaftalıkTavan = kilo × 0.0075          // varsayılan %0.75
```

Hesaplanan açık bu tavanı aşıyorsa açık küçültülür, tavan büyütülmez.

### 4.5 Makro sırası

Sıra önemlidir, karbonhidrat hedef değil dengeleyicidir:

```
1. Protein = g/kg × (FFM varsa FFM, yoksa kilo)     // bölüm 3 tablosu
2. Yağ     = max(0.6 g/kg × kilo, kalori × 0.25 / 9)
3. Karb    = (KaloriHedefi − protein×4 − yağ×9) / 4
```

Yağ tabanı hormon sağlığı içindir ve asla altına inilmez. Karb negatife düşerse
(çok düşük kalori + çok yüksek protein) açık küçültülür.

### 4.6 El ölçüsü çevrimi

Arayüzün konuştuğu dil budur. Katsayılar blog yazımızla (`porsiyon-olculeri-el-olcusu`)
tutarlıdır; terimler birebir aynı kalmalı: **avuç içi**, **yumruk**, **kapalı
avuç**, **başparmak**.

| El | Grup | Kadın | Erkek |
| --- | --- | --- | --- |
| Avuç içi | Protein | 22 g protein | 28 g protein |
| Kapalı avuç | Tahıl ve nişasta | 25 g karb | 30 g karb |
| Başparmak | Yağ | 10 g yağ | 12 g yağ |
| Yumruk | Sebze | lif hedefinden türetilir, en az 3 | aynı |

El kişinin kendi eli olduğu için ölçü zaten vücuda göre ölçekleniyor; cinsiyet
bazlı iki katsayı yeter, boya göre ince ayar aşırı mühendisliktir (hesabın hata
payı o farktan büyük).

**Yuvarlama aralıkla yapılır, ondalıkla değil.** 3.4 avuç çıktıysa ekranda
"3-4 avuç" yazar, "3.5 avuç" yazmaz. ±%15 hata payı olan bir hesabı ondalıkla
sunmak sahte hassasiyettir.

### 4.7 Kalibrasyon (beta sonrası)

Formül bir başlangıç tahminidir. Yeterli veri birikince gerçekle değiştirilir:

```
GözlenenTDEE = ortalama_günlük_alım − (ΔKiloTrend × 7700 / gün_sayısı)
```

Kurallar:

- `ΔKiloTrend` ham ölçümden değil **7 günlük EMA**'dan alınır. Günlük dalgalanma
  su, glikojen ve bağırsak içeriğidir.
- **Kapı:** son 14 günün en az 10'unda en az 3 öğün kaydı, ve en az 2 kilo
  ölçümü (biri son 3 gün içinde). Kapı açılmadan ölçüler "tahmin" etiketiyle durur.
- İlk kalibrasyonda karışım `0.5 × formül + 0.5 × gözlem`, sonraki haftalarda
  gözlem ağırlığı 0.8'e çıkar.
- Gözlem formül tahmininden ±%25'ten fazla sapamaz (aykırı veri koruması).
- İlk 2-3 hafta güven aralığı bilerek geniş tutulur.

Bunun yan faydası: kullanıcılar tükettiğini ortalama %20-30 eksik bildirir, ama
hem alım hem kilo aynı sistemden geldiği için bu sistematik hata sabite dönüşür
ve hesaptan kendiliğinden düşer.

### 4.8 Haftalık yeniden hesap

Kilo değiştikçe BMR de değişir. Hedefler her pazartesi yeniden hesaplanır, gün
içinde asla kaymaz. Hareket verisi gün boyu artar; hedefi ona bağlamak kullanıcıya
akşam farklı bir sayı gösterir ve güveni bozar.

---

## 5. Ekran

```
┌──────────────────────────────────┐
│  🎯 Hedeflerim                   │
├──────────────────────────────────┤
│  YÖNÜM                           │
│  ◉ Daha hafif hissetmek istiyorum│
│  ○ Kilom değişmeden daha iyi...  │
│  ○ Olduğum yerde iyiyim          │
│  ○ Daha güçlü hissetmek istiyorum│
│  ○ Önce bir düzen kurayım        │
│  3 Ağustos Pazartesi'den geçerli │
├──────────────────────────────────┤
│  Afi seni %60 tanıyor            │
│  ▓▓▓▓▓▓░░░░                      │
│  ✓ Boy, yaş, hareket düzeyin     │
│  ✓ 2 haftalık kayıt              │
│  + Mezura ölçünü ekle            │
├──────────────────────────────────┤
│  GÜNÜN ÖLÇÜSÜ                    │
│  🫱  3-4 avuç protein kaynağı    │
│  ✊  3 yumruk sebze               │
│  🤲  3 kapalı avuç tahıl         │
│  👍  2 başparmak yağ             │
│                                  │
│  Bu ölçüler şimdilik tahmin.     │
│  Kayıt biriktikçe sana göre      │
│  düzelteceğim.                   │
│                                  │
│  Sayılarla ▾                     │
└──────────────────────────────────┘
```

"Bu ölçüler şimdilik tahmin" satırı ekranın dürüstlük çıpasıdır. Kalibrasyon
devreye girince "2 haftalık kaydınla düzeltildi, artık tahmin değil" olur.

---

## 6. Tanışma göstergesi

Hedefin ne kadar kişiselleştiğini yargısızca gösterir ve eksik veriyi ceza dili
kurmadan davet eder.

| Madde | Pay |
| --- | --- |
| Temel bilgiler (cinsiyet, yaş, boy, hareket) | %40 |
| İlk kilo ölçümü | %20 |
| Mezura ölçüsü | %25 |
| 2 hafta düzenli kayıt | %15 |

Hareket verisi izni beta'da **yok**, dolayısıyla listede de görünmez; tıklanamayan
davet kötü deneyimdir ve kimse %100'e ulaşamaz.

⚠️ HealthKit sonradan yüzdeye eklenirse %100'e ulaşmış kullanıcılar bir sabah
%80 görür. Bunu önlemek için o madde ayrı bir "daha da iyileştir" kartı olarak
eklenmeli, mevcut ağırlıklar yeniden dağıtılmamalı.

---

## 7. Yön değişimi: cron değil, tarihli satır

```
goal_directions
  profile_id | direction | effective_from | created_at
  12         | koru      | 2026-06-01     | ...
  12         | hafifle   | 2026-08-03     | ...   ← gelecek pazartesi
```

Okuma kuralı: `effective_from <= bugün` olan en son satır.

Cron'a tercih edilme gerekçeleri:

1. **Kaçan çalıştırma riski yok.** Cron bir pazartesi düşerse yön hiç geçmez ve
   kimse fark etmez.
2. **Zaman dilimi derdi yok.** Cron tek saatte koşar, kullanıcılar farklı
   dilimlerde olabilir.
3. **Geçmişe dönük doğruluk bedava gelir.** Kalibrasyon 14 gün geriye bakar ve
   o dönemde hangi yönün geçerli olduğunu bilmek zorundadır. Tarihli satır bunu
   taşır, cron yalnızca "şu anki" durumu bilir.
4. **Test edilebilir.** Tarih parametre verilip sonuç görülür, pazartesi
   beklenmez.

Hafta sınırı için yeni tanım gerekmez, mevcut afiyet haftası pazartesi başlıyor
(`widgetWeekStart`).

Cron'un tek meşru yeri: o pazartesi sabahı "yeni yönün bugün başladı" bildirimi.
O bildirim işidir, hesap işi değil.

---

## 8. FTUE

Yön kurulumda sorulmaz (`BodySetupSheet` zaten 5-6 adım).

- Kullanıcı yön seçene kadar sessiz varsayılan `duzen` çalışır, ekran ilk günden
  dolu görünür.
- İlk adımlar bitince (`afiGuideDone` + ilk öğün kaydı) Afi devreye girer:
  "Şu an dengede tutuyorum. İstersen bana bir yön söyle, ölçülerini ona göre
  kurayım."
- Yeni FTUE bayrağı: `goalDirectionTaught` (hesap bazlı, `ACCOUNT_KEYS`).
- Bir kez gösterilir; kaçırılırsa ekranda nazik bir satır olarak kalır. Kilitli
  ya da boş ekran yok.

---

## 9. Güvenlik sınırları

Motor bunları asla aşmaz. Hepsi kod seviyesinde sert kapı olmalı, öneri değil.

- Kadında 1200, erkekte 1500 kcal altında hedef üretilmez.
- Haftalık değişim vücut ağırlığının %1'ini geçmez, varsayılan %0.75.
- Hamilelik ve emzirme beyanında açık kalori açığı hedefi verilmez.
- 18 yaş altında hedef verilmez, yalnızca denge dili (mevcut `MINOR_NOTE`).
- Böbrek rahatsızlığı beyanında yüksek protein önerilmez.
- Hızlı kayıp + çok düşük hedef + sık tartılma örüntüsünde hedef geri çekilir ve
  dil yumuşatılır.
- Riskli durumda otomatik plan üretilmez, profesyonel destek önerilir. Motor
  tıbbi değerlendirme yapmaz.

---

## 10. Faz ayrımı

### Beta'ya yetişir

Hepsi eldeki veriyle çalışır, yeni izin ve yeni servis gerektirmez.

- Yön seçimi ve tarihli satır
- Katch-McArdle (mezura varsa), PAL aralıkları
- Makro sırası: protein ve yağ g/kg tabanından, karb kalandan
- El ölçüsü çevrimi ve aralıklı yuvarlama
- Hedeflerim ekranı ve tanışma göstergesi
- "Sayılarla" altına veri ekranının taşınması
- FTUE yön öğretimi

Kapsam daralması gerekirse ilk kesilecek şey **tanışma göstergesidir**; hedefin
doğruluğunu değil sunumunu etkiler.

### Beta sonrası

**HealthKit ve Health Connect.** Apple portalında capability elle eklenmeli
(bkz. Associated Domains'in 0.5.0 build'ini iki kez düşürmesi), App Store ek
incelemeye alıyor, Android'de Play Console beyanı gerekiyor. En az bir tam
release döngüsü.

**Kalibrasyonun görünen kısmı.** 2-3 haftalık veri istiyor, yani hiçbir beta
kullanıcısı göremeyecek. Kodu yazmak ölü kod üretir.

⚠️ Bu erteleme yalnızca **verisi bugünden birikiyorsa** güvenlidir. İyi haber:
öğün kayıtları ve ölçümler zaten kaydediliyor, katalogda makrolar var, yani
geçmiş günlerin alınan enerjisi sonradan geriye dönük hesaplanabilir. Ek kayıt
altyapısı gerekmiyor. Beta kullanıcıları 3 hafta kayıt tutarken motor yazılır,
sürüm çıktığında veri onları bekliyor olur.

---

## 11. Dış modelden alınanlar ve alınmayanlar

27 Tem 2026'da ayrı bir LLM oturumunda "Vücut Görünümü, Hedef Kilo ve Süre
Projeksiyonu Modeli" başlıklı kapsamlı bir teknik doküman üretildi. Bilimsel
olarak büyük ölçüde sağlam, ama bir **kilo verme koçu** tarif ediyor. afiet'in
konumu bu değil. Alınan ve alınmayanlar:

### Alındı

- Görünüm hedefini yağ oranı ve yağsız kütle aralığına çevirme fikri (bölüm 3)
- "Kilom değişmeden daha iyi görünmek" seçeneği (en değerli ürün katkısı)
- Hedefin tek sayı değil aralık olması
- PAL'in tek değer değil aralık olması
- Gözlemsel TDEE kalibrasyonu ve 7 günlük trend kilo
- 7700 kcal yaklaşımının sınırları: kilo düştükçe RMR düşer, kaybın tamamı yağ
  değildir, ilk haftalar su ve glikojendir
- Haftalık yeniden hesap (statik hesap kilo değiştikçe yanlışlaşır)
- Enerji önceliği parametresi `E` (katsayıları yumuşatılarak)
- Haftalık kayıp tavanı %0.5 - %1.0
- Güvenlik kuralları

### Alınmadı

| Ne | Neden |
| --- | --- |
| Hedef kilo gösterimi | Sorulmayacağına zaten karar verildi. Tartıyı merkeze alır, feature-list/README'deki "kilo/kalori rozeti yoktur" kuralına aykırı. |
| Süre projeksiyonu ("24 haftada") | Üç ayrı gerekçe: marka konumu, yeme bozukluğu hassasiyeti, ve retention. Hedefi tutturamayan kullanıcı uygulamayı bırakır; bu kilo uygulamalarının bir numaralı churn sebebidir. |
| Monte Carlo (2000 simülasyon) | Girdi dağılımlarının kendisi tahmin olduğu için çıktı kalitesi anlamlı artmıyor. İletişimsel değeri 3 senaryoyla (iyimser / olası / temkinli) zaten elde edilir. Backend maliyeti gereksiz. |
| Kas kazanımı ve recomposition modeli | `TrainingQuality`, `Recovery`, `ExperienceDecay` girdilerinin hiçbiri afiet'te yok. Antrenman takibi, uyku ve toparlanma verisi toplanmıyor. |
| Ayrı adaptif termogenez modeli | Gözlemsel kalibrasyon adaptasyonu **zaten** yakalıyor. İkisini birlikte modellemek çift sayma ve sahte hassasiyet üretir. 0.14 katsayısının kişiler arası varyansı da çok yüksek. |
| Bel çevresi hedefi | Mezura ölçümü isteğe bağlı, kullanıcıların çoğu girmeyecek. Hedef olarak değil, tanışma göstergesinde davet olarak yaşar. |
| %25 kalori açığı | afiet için fazla agresif. Tavanımız %15. |

### İki teknik düzeltme

**1. Hedef kilo aralığı formülü ters yazılmış.** Dokümanın 4.5'inde:

```
W_min = FFM_min / (1 − BF_max)        ← yanlış
W_max = FFM_max / (1 − BF_min)        ← yanlış
```

`W = FFM / (1 − BF)` olduğuna göre yağ oranı yükseldikçe payda küçülür ve kilo
**artar**. Doğrusu:

```
W_min = FFM_min / (1 − BF_min)
W_max = FFM_max / (1 − BF_max)
```

Örnek (FFM 66-70 kg, BF %15-18): doğru aralık 77.6 - 85.4 kg, dokümanın formülü
80.5 - 82.4 verir. Yani aralığı ters yönde daraltıyor ve olduğundan emin
görünüyor. Bu değeri motor içinde ara hesap olarak kullanırsak doğrusunu
kullanmalıyız.

**2. Mifflin ile FFM tutarsızlığı.** Doküman yağsız kütleyi baştan sona merkeze
koyuyor ama RMR'yi FFM'siz formülle (Mifflin) hesaplıyor. FFM zaten biliniyorsa
Katch-McArdle daha isabetli, ve cinsiyet ile yaşı denklemden düşürüyor. Bölüm
4.2'de bu düzeltildi.

---

## 12. Yapma

- Hedef kilo sorma, hedef kilo gösterme.
- "Şu tarihte şu kiloda olacaksın" deme. Süre vaadi verme.
- Gram ve kcal'i birincil dil yapma. Kullanıcı isterse açar.
- Ondalıklı el ölçüsü gösterme ("3.5 avuç"). Aralık kullan.
- Gün içinde hedefi kaydırma. Haftada bir, pazartesi.
- Hareket verisi izni varken aktivite çarpanını da uygulama (çift sayma).
- Kalibrasyonu kayıt kapısı açılmadan devreye alma.
- Kalibrasyonu ham günlük kiloyla besleme. 7 günlük EMA.
- Tanışma göstergesinde henüz var olmayan bir maddeyi listeleme.
- Blog terminolojisinden sapma. "kapalı avuç" doğru, "çukur avuç" değil.
