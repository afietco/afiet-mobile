# FTUE: sofranın kurulması

> Durum: tasarım tamam · **dokuz bölüm + ilerleme çubuğu, açılma bandı, oda kartları, yerel cue, reviewer muafiyeti, uzaktan anahtar kodlandı ve simülatörde görüldü (17 Ağu), push edilmedi**
> Dal: `feature/ftue` (development tabanlı) · Tarih: 15-17 Ağu 2026
> Süzgeç: "Sofrayı saydırmadan dengeler" (BRAND.md)

Uygulamanın tamamına yayılan ilk kullanıcı deneyiminin tasarımı: ilk üç dakika,
ilk üç hafta ve her ekranın ilk açılışı. Anlatıcı Afi'dir. Bu dosya tek başına
yeterli olacak şekilde yazıldı; kod yazan oturum başka yere bakmak zorunda
kalmamalı.

Simülasyon (beş kullanıcının ekran ekran yolculuğu) ayrı bir sayfada yaşar,
bkz. bu dosyanın sonundaki "Simülasyon" bölümü.

---

## 1. Bugünkü hal

Var olan parçalar, oldukları yerde:

| Parça | Dosya | Ne yapıyor |
| --- | --- | --- |
| Tanıtım | `app/intro.tsx` | Giriş öncesi 3 sayfa, atlanabilir · bayrak `welcomeIntro` |
| İlk değer | `app/first-meal.tsx` | Hesapsız tek besin kaydı, cihazda bekler · `firstValueCaptured` |
| Kimlik | `app/onboarding.tsx` | İsim + emoji, 2 adım |
| Odaklı Bugün | `features/home/homeVisibility.ts` | Hesap < 48 saat ve kayıt yoksa pano gizli |
| Başlangıç rehberi | `features/ftue/today-afi-guide.tsx` | Spotlight: karşılama → öğün → su → ölçüm → bitiş |
| Mikro | `chatDestekConsent2026_08`, `rhythmExplained`, `goalDirectionTaught`, `StarterMenuCard` | Dağınık, tek tek |
| Ölü bayrak | `introBeslenme`, `introGecmis` | Tanımlı, hiçbir yerde kullanılmıyor |

### Yedi kusur

**K1 · 48 saatlik pencere.** `shouldStartAfiGuide` hesap 48 saatten eskiyse
`false` döner. Cuma indirip pazartesi dönen kişi rehberi hiç görmez ve bir daha
göremez. Başlamış rehber pencereden düşerse `expired` yazılıp kapanır.

**K2 · Sıra değeri değil mekaniği öğretiyor.** Öğün → su → ölçüm. İkincisi bir
sayaç, üçüncüsü uygulamanın en ağır formu (cinsiyet, doğum tarihi, boy, aktivite
+ ölçüm). İlk oturumun üç işinden ikisi afiet'in en az "afiet" olan yerleri.

**K3 · Pano tek hamlede açılıyor.** İlk kayıt `focusedHome`u kapatır ve Su, Afi,
Vücudum, Görevlerim, Ligim, Menüm, Grubum aynı anda belirir. Hepsi tanıtılıyor,
yani hiçbiri tanıtılmıyor.

**K4 · Boş odalar.** 1. günde Görevlerim boş, Lig 0 tecrübeyle anlamsız, Menüm
boş, Arkadaşlarım boş. Uygulamanın en oyunlaştırılmış yüzeyleri, merakın en
yüksek olduğu anda en zayıf hallerinde duruyor.

**K5 · Ortak dil yok.** Kutlama (`AfiScene`), spotlight (`GuidedSpotlight`),
kart (`StarterMenuCard`), sheet (`DestekIntro`), not (`AfiTodayNote`) ayrı
kurallarla yaşıyor. Bütçe yok, öncelik yok, kuyruk yok: çakışma elle çözülüyor
(`TodayAfiGuide` çalışırken `AfiTodayNote` susturuluyor).

**K6 · Anlatıcı 1. günde susuyor.** Afi tanıtımda, ilk kayıtta ve rehberde
konuşur, sonra anlatıcı olmaktan çıkıp bir sohbet satırına dönüşür. Hikâye
biter, uygulama kalır.

**K7 · Keşif tesadüfe bırakılmış.** Görevlerim, Lig, Menüm, Sohbet yalnız Bugün
panosundaki satırlardan; Arkadaşlarım ve Bilgilerim yalnız hamburger menüden
ulaşılır. Hiçbirinin "ilk kez geldin" hali yok.

---

## 2. Model

Üç katman ve bir harita.

```
A · İlk sofra        0-3 dk     hesap öncesi tanıtım + ilk kayıt + pusulanın canlanması
B · Bölümler         1-21 gün   dokuz bölüm, her biri bir kapı açar, Bugün'de yaşar
C · Mikro-FTUE       sürekli    her ekranın ilk açılışı, beş desenden biri
   Rehber            her zaman  Afi'nin sofra defteri: açılan, sıradaki, yolda olan
```

Ayrım net: **bölümler Bugün'de**, **mikro-FTUE kendi ekranında**. İkisi aynı
anda konuşmaz.

### Sekiz kanun

1. **Boş oda açılmaz.** Bir kapı, ancak arkasında sana ait bir şey varken
   açılır. 0 tecrübeyle Lig boş odadır.
2. **Kapalı kapıda isim yazar.** Vakti gelmeden kapıyı bulan kilit görmez;
   odanın adını, yüzünü ve vaadini görür, altında "yine de gir" durur.
   (`features/chat/AssistantGate.tsx` bunun uygulamadaki ilk örneği.)
3. **Günde bir kapı.** Günde en fazla bir proaktif FTUE anı
   (`feature-list/tetikleyiciler.md`). Diğerleri kuyrukta sabırla bekler.
4. **Bir kez öğret, bir kez hatırlat, sus.** İkinci reddediş o bölümü kalıcı
   kapatır; kayıt "geçildi" diye düşer, "başarısız" diye değil.
5. **Süre değil davranış.** Hiçbir yerde pencere yok. 30. günde dönen kişi
   kaldığı yerden devam eder. (K1'i öldürür.)
6. **Öğretmek yaptırmaktır.** Her bölüm, kullanıcının gerçek ekranda kendi
   verisiyle o işi yapmasıyla biter. "Anladım" bir bitiş değildir.
7. **Geriye dönük dolum.** Mevcut kullanıcıda bölümler veriden türetilir; tıpkı
   Görevlerim'in yaptığı gibi. Kimseye zaten yaptığı şey öğretilmez.
8. **Afi anlatır, uygulama öğretmez.** Bütün metin Afi'nin ağzından, "sen"
   diliyle, emir kipi yok, suçluluk yok, kayıp dili yok.

---

## 3. Katman A: ilk sofra (0-3 dakika)

Yapı korunur, sıra sıkılaştırılır.

| # | Ekran | Süre | Amaç |
| --- | --- | --- | --- |
| A1 | `intro` 3 sayfa | 20 sn | Vaat: sayma, dengele · atlanabilir |
| A2 | `first-meal` | 25 sn | Hesap istemeden ilk değer: tek besin |
| A3 | Kutlama | 5 sn | "Afiyet olsun" · kayıt cihazda güvende |
| A4 | `login` + `onboarding` | 40 sn | İsim + emoji, ardından iki tek dokunuşluk soru |
| A5 | Bugün · **Bölüm 1** | 30 sn | Pusula canlanır, denge halkaları açılır |

### A4'ün iki sorusu

Kimlikten (isim + emoji) sonra, aynı akışın içinde, ikisi de tek dokunuş:

**1. Sofranda kim var?** (karar: soruluyor)
"Yalnız benim sofram · Eşimle · Ailece". Cevap yalnız bir şeyi belirler:
sosyal bölümün (B6) kuyruktaki yeri. Ailece diyene 2. günde, eşiyle diyene
ilk hafta ortasında, yalnız diyene hafta kapanışında gelir. Davet bağlantısıyla
gelen kişiye bu soru **sorulmaz**, cevabı zaten bellidir.
Yanlış cevap diye bir şey yok, sonradan değişir, hiçbir özelliği kapatmaz.

**2. Sana seslenebilir miyim?** (karar: izin kayıtta isteniyor)
Sistem penceresi doğrudan açılmaz. Önce Afi kendi ekranımızda sorar:
"Sofran seni beklerken bir kez seslenebilirim. İstersen sessiz de kalırım."
"Olur" → sistem izin penceresi açılır. "Şimdilik sessiz" → pencere hiç
açılmaz ve izin B9'da bir kez daha sorulabilir.
Gerekçe: iOS'ta sistem penceresi tek atıştır; bağlamsız sorulup reddedilirse
izin kalıcı olarak yalnız Ayarlar'dan açılabilir hale gelir. Ön soru, "hayır"ı
geri alınabilir kılar.

A5'te biten şey şudur: kullanıcı bir kayıt yapmıştır, kart boş halinden çıkıp
kendi verisiyle dolmuştur ve **su ile ölçüm bu oturumda hiç sorulmamıştır.**

Odaklı Bugün (`shouldShowFocusedHome`) kalır ama kuralı değişir: 48 saat değil,
**bölüm 2 açılana kadar**. Pano zamanla değil, hak edilerek dolar.

---

## 4. Katman B: dokuz bölüm

Her bölümün bir tetiği, bir **anlamlılık önkoşulu** ve açtığı bir kapı var.
Önkoşul, o özelliğin kullanıcıya ait bir içeriği olduğunu garanti eder.

| # | Bölüm | Tetik | Önkoşul | Açtığı kapı |
| --- | --- | --- | --- | --- |
| B1 | Denge pusulan | hesapta ilk kayıt | - | Beslenme derinliği |
| B2 | Günü kapat | ilk kayıt günü 18:00 sonrası | o gün ≥1 kayıt | Su satırı |
| B3 | Ritmini bul | 2. afiyet günü | 2 afiyet günü | Ritim şeridi |
| B4 | Sofranı tanı | tekrar eden besin | aynı besin ≥2 kez | Menüm |
| B5 | Yönün | Vücudum'a ilk giriş ya da 5. gün | - | Vücudum + Yönüm |
| B6 | Sofrada yalnız değilsin | ilk ritim haftası kapanışı | hafta tamam | Grubum + Arkadaşlarım |
| B7 | Yolculuğun izi | alınabilir ilk görev | ≥1 görev hazır | Görevlerim + Ligim |
| B8 | Sofra takımı | tanınmayan besin ya da Sohbet'e ilk giriş | - | Afi + afiet+ |
| B9 | Sofranı hatırlat | 3 gün temassızlık | - | Widget + izin ikinci şansı |

Sıra sabit değil, **öncelik kuyruğudur**: önkoşulu dolan bölümler sıraya girer,
gün başına bir tanesi çıkar. Davetle gelen kişide B6 en başa geçer, çünkü grup
zaten vardır (bkz. Hatice senaryosu).

### B1 · Denge pusulan
Tetik: hesapta ilk kayıt sync'lendiğinde (`syncPendingFirstMeal` sonrası).
Desen: spotlight (ömür boyu üç spotlight'tan biri) + sahne.
Afi: "İlk kaydın sofrada 🌱 Şimdi asıl meseleye bakalım."
Kart canlanır: `MacroRings` + `RhythmStrip` belirir.
Afi: "Sayı var ama patron o değil. Bak: bugün hangi gruplara dokunmuşsun?"
→ Beslenme'ye geçer, denge halkaları (`BalanceRings`) açılır: 5 halkanın 1-2'si
dolu. "Eksik kalanlar bugünün daveti. Hepsini toplamak zorunda değilsin."
Kapanış: geri Bugün. Pano hâlâ odaklı: yalnız Beslenme kartı.

### B2 · Günü kapat
Tetik: aynı gün, saat 18:00 sonrası ilk açılış. Desen: Afi kartı (Bugün).
Afi: "Gün toparlanıyor. Bugün {n} kayıt, {m} grup. Bir de su var, hepimiz
unutuyoruz. Bir bardak koyalım mı?"
Aksiyon: su satırı belirir ve ilk dokunuş orada yapılır.
Kapanış: "Gün böyle kapanır işte. Yarın yeni bir sofra."
Not: su, ilk oturumdan buraya taşındı. Akşam saati suyun anlamlı olduğu tek an.

### B3 · Ritmini bul
Tetik: ikinci afiyet günü. Desen: sahne + ritim şeridi spotlight'ı.
Afi: "İki gün oldu. afiet'te hedef her gün değil: **haftada beş.** Kalan iki gün
senin sofra payın; kimse hesabını sormaz, ben de sormam."
Kapanış: ritim şeridi Bugün'de kalıcı olur.
Bu, uygulamanın en önemli tek cümlesi ve bugün kimsenin okumadığı bir kartta
duruyor (`RhythmHistoryCard` + `rhythmExplained`). Bölüm bu bayrağı devralır.

### B4 · Sofranı tanı
Tetik: aynı besin ikinci kez kaydedildiğinde. Desen: fısıltı → sheet.
Afi: "Aynı şeyleri yazıp duruyorsun, gördüm 🙂 Sık kurduğun sofrayı bir kez
kaydet, bir daha yazma."
Aksiyon: o iki kaydı seçili getirip Menüm'de ilk sofrayı kurdurur.
Kapı: Menüm.
Önkoşulun güzelliği burada: özellik, tam da ihtiyaç doğduğu anda belirir.

### B5 · Yönün
Tetik: Vücudum sekmesine ilk giriş ya da 5. gün (hangisi önce).
Desen: sheet (`BodySetupSheet` + `DirectionSheet` birleşik).
Afi: "Burada senden kilo hedefi istemeyeceğim. Yalnız yönünü soracağım:
korumak mı, hafiflemek mi, güçlenmek mi? Fikrin değişirse birlikte değiştiririz."
Ölçüm formu ilk oturumdan buraya taşındı. Neden: dört soruluk form,
uygulamanın en yüksek terk riski ve 2. dakikada sorulacak şey değil.

### B6 · Sofrada yalnız değilsin
Tetik: ilk ritim haftası kapanışı. Davetle gelen kullanıcıda **0. gün**.
Desen: sahne.
Afi: "Bu hafta afiyetteydin 🎉 Sofra kalabalık olunca daha kolay. Birini
çağıralım mı?"
Kapı: Grubum + Arkadaşlarım. Davet kodu tek dokunuşla paylaşılır.

### B7 · Yolculuğun izi
Tetik: alınabilir ilk görev oluştuğunda (sunucu zaten geriye dönük üretiyor).
Desen: sahne, görevin kendisiyle.
Afi: "Arkanda bir iz bırakmışsın: '{görev}' tamamlanmış bile. Al bakalım."
Kapı: Görevlerim, ardından Ligim.
K4'ü tam burada öldürüyor: oyunlaştırma, ilk ödül elde olduğu an tanıtılıyor.

### B8 · Sofra takımı
Tetik: tanınmayan besin kaydı ya da Sohbet'e ilk giriş. Desen: sheet.
Afi: "Bilmediğim bir şey yazdın, sorun değil. Ben buradayım, her gün, bedava.
Yanımda iki kişi daha var: Sini beslenmeyi konuşur, Demi yemekle ilişkini.
Onlar afiet+ ile geliyor."
Kapı: Afi satırı + afiet+ tanıtımı (paywall değil, tanışma).

### B9 · Sofranı hatırlat
Tetik: 3 gün temassızlık (T4). Desen: kart.
Afi: "Yarın yeni bir sofra. Hazır olduğunda buradayım 🥣"
İzin A4'te verilmişse bu bir bildirim, verilmemişse uygulama içi tek satırdır.
Kapı: widget önerisi + (izin reddedilmişse) tek ve son bir kibar tekrar.
Kayıp dili yasak: "serin bozuluyor" bu üründe yok.

---

## 5. Katman C: mikro-FTUE

Beş desenlik bir sözlük. Bir ekranda yalnız bir desen kullanılır.

| Desen | Nerede | Bütçe | Kural |
| --- | --- | --- | --- |
| **Fısıltı** | başlığın altında tek satır | ekran başı 1 | dokunmadan geçilir, ikinci ziyarette yok |
| **Boş oda kartı** | boş ekranın kendisi | ekran başı 1 | FTUE = boş hal. En ucuzu ve en dürüstü |
| **Spotlight** | yalnız üç an: ilk kayıt, denge halkaları, ritim | **ömür boyu 3** | ekranı kilitler, kaçış hep görünür |
| **Sahne** | kapı açılışı ve kutlama | bölüm başına 1 | tam ekran, tek düğme |
| **Sheet** | onay ya da seçim gerekiyorsa | toplam 3 (rıza, yön, bildirim) | seçim yapmadan kapatılabilir |

Ekran haritası:

| Ekran | Desen | Afi'nin tek cümlesi |
| --- | --- | --- |
| Beslenme | fısıltı | "Öğünler burada toplanır; alttaki halkalar günün dengesi." |
| Vücudum | boş oda kartı | "Burada sayılar seni yargılamaz, yalnız yönünü gösterir." |
| Grubum | boş oda kartı | "Sofra kurulu, misafir yok. Çağıralım mı?" |
| Menüm | boş oda kartı | "Sık kurduğun sofraları burada saklarız." |
| Besinler | fısıltı | "Aradığını bulamazsan yaz, ben öğrenirim." |
| Görevlerim | boş oda kartı | "Bunlar yapılacak iş değil, bıraktığın iz." |
| Lig | kapalı kapı / boş oda | "Lig, ilk haftandan sonra anlam kazanır." |
| Bilgilerim | fısıltı | "Üç günden sonra buradaki çizgiler seni anlatmaya başlar." |
| Sohbet | sheet (rıza) | mevcut `DestekIntro` korunur |
| Arkadaşlarım | boş oda kartı | "Karşılıklı selam: iki taraf da isterse." |
| afiet+ | mevcut `AssistantGate` | değişmez, referans örnektir |

Ölü bayraklar (`introBeslenme`, `introGecmis`) bu sistemde yeniden hayat bulur
ya da silinir; ikisinin ortası yok.

---

## 6. Rehber: Afi'nin sofra defteri

Aşamalı açılışın tek gerçek riski şudur: kullanıcı eksikliği fark eder ve
uygulamayı bozuk sanır. Panzehir, gizliliği görünür kılmaktır.

Yer: **Görevlerim ekranının en üstünde "Sofra kurulumu" bölümü** + ilk iki hafta
Bugün'de bir satır (bütün bölümler açılınca satır kaybolur).

İçerik: dokuz bölüm; açılanlar işaretli, sıradaki adıyla, yolda olanlar
önkoşuluyla ("ilk haftan dolunca"). Her açılmış bölüm tekrar oynatılabilir.
Her kapalı bölümde "yine de göster" vardır ve gerçekten gösterir.

Görsel: sofranın kurulması. Her bölüm masaya bir parça ekler (tabak, kaşık,
bardak, peçete, sürahi...). Dokuz parça tamamlanınca sofra kurulur ve Afi
oturur. Sofra takımı maskotlarıyla (Afi, Sini, Demi) aynı dünyada.

---

## 7. Kapı modeli: üç seçenek

| | A · Sert kilit | B · Yumuşak açılış (öneri) | C · Hibrit |
| --- | --- | --- | --- |
| Nasıl | Sekmeler asma kilitli, görev bitince açılır | Her şey erişilebilir; kapılar anlamlı olunca **tanıtılır** | Sekme çubuğu 2 sekmeyle başlar, 3. günde 4'e çıkar |
| Artı | Net ilerleme hissi, oyun dili güçlü | Marka sesiyle uyumlu, kimse tıkanmaz, geri dönük dolum kolay | Bugün gerçekten sade başlar |
| Eksi | "Suçluluk değil şefkat" ile çelişir, kilit ekranı bir cezadır; mağaza incelemesinde açıklanması zor | İlerleme hissi daha yumuşak, ölçmesi biraz daha zor | Sekme çubuğunun altından zemin kayar, en sinir bozucu his |
| Karar | Reddedildi | **Seçildi** | Reddedildi |

Seçilen model B'dir: kilit yok, **tanıtım sırası** var. Bir kapıya vaktinden
önce dokunan kişi asla engellenmez; adını, yüzünü ve "yine de gir"i görür.
İlerleme hissini kilit değil, **rehberdeki sofra** taşır.

---

## 8. Durum makinesi ve veri

```ts
type ChapterKey =
  | 'balance' | 'closeDay' | 'rhythm' | 'menu' | 'direction'
  | 'circle' | 'trail' | 'team' | 'remind'

type ChapterState = 'waiting' | 'ready' | 'shown' | 'done' | 'passed'
```

- Saklama: hesap kapsamlı, `features/ftue/ftueFlags.ts` deseniyle
  (`fh:ftue:account:<id>:chapter:<key>`). Ağ gerekmez, çevrimdışı çalışır.
- Seçim tek saf fonksiyondur ve testin tamamı buradadır:
  `pickChapter(states, signals, now) → ChapterKey | null`.
  Girdi sinyalleri: kayıt sayısı, afiyet günü sayısı, tekrar eden besin,
  hafta kapanışı, alınabilir görev, grup üyeliği, son temas, saat.
- Kanun 3 fonksiyonun içindedir: aynı gün bir bölüm gösterildiyse `null` döner.
- Kanun 4: `shown` iki kez tekrarlanırsa `passed`.
- Kanun 7 (geriye dönük dolum): ilk çalıştırmada mevcut veriden türetilir.
  Kaydı olan `balance`ı, grubu olan `circle`ı, ölçümü olan `direction`ı
  görmüş sayılır. Var olan `afiGuideDone` / `starterDone` bayrakları B1-B3'ü
  geçmiş kabul eder.

Dokunulacak dosyalar (tahmin): `features/ftue/` (yeni `chapters.ts`,
`chapter-host.tsx`, `micro.tsx`), `app/(tabs)/index.tsx` (rehber satırı ve
konak), `features/home/TodayBoard.tsx` (satırların kapı görünürlüğü),
`features/home/homeVisibility.ts` (kural değişir), `app/gorevlerim.tsx`
(Sofra kurulumu bölümü), `features/ftue/ftueFlags.ts` (anahtar alanı).

Backend: **gerekmiyor.** Bütün sinyaller mevcut repository'lerden okunur.
UI önce, kural gereği (bkz. çalışma akışı).

---

## 9. Ölçüm

Olaylar (`lib/track`), **karar 17 Ağu: mevcut sözlük korunur**, backend ve
admin işi çıkmaz. Bölümler eski rehberin adlarını devralır ve bölüm adını
`step` özelliğinde taşır: `afi_guide_step_shown {step}` (bölüm ekrana geldi),
`afi_guide_completed {step}` (kişi işi yaptı), `afi_guide_ended {step,
reason:'skipped'}` (geçti). Sheet'ler kendi `sheet_view` olaylarını atar
(`sofra`, `widget_hint`); paylaşım `ui_tap {target:'friend_code_share',
from:'ftue_circle'}`. Bölüm bazlı huni admin'de `step` üzerinden okunur;
`ftue_chapter_*` adları ve `day_index` yazılmadı.

Guardrail: bir bölümde eyleme dönüşmeden geçilme oranı %60'ı aşarsa sorun
kullanıcıda değil metindedir; bölüm yeniden yazılır. Bildirim kapatma oranı
haftada %5'i aşarsa B9 susar (`tetikleyiciler.md` kuralı).

---

## 10. Riskler

| Risk | Panzehir |
| --- | --- |
| Afi çok konuşur, bunaltır | Günde bir kapı + iki reddedişte kalıcı sus |
| Aşamalı açılış "bozuk" hissi verir | Rehber + her kapalı kapıda "yine de gir" |
| Dokuz bölüm karmaşıklığı | Tek saf seçim fonksiyonu + test; her bölüm bağımsız |
| Mevcut kullanıcı tekrar eğitilir | Geriye dönük dolum (kanun 7) |
| Erişilebilirlik | Spotlight'ta VoiceOver sırası, reduce-motion, büyük punto: mevcut `GuidedSpotlight` bunları zaten gözetiyor, yeni desenler aynı ölçüde |

---

## 11. Karar günlüğü

| Karar | Sonuç |
| --- | --- |
| Kapı modeli | Yumuşak açılış (B). Kilit yok, tanıtım sırası var |
| Su ve ölçüm | İlk oturumdan çıkarıldı; su B2'ye, ölçüm B5'e taşındı |
| Süre pencereleri | Tamamen kaldırıldı; her şey davranış tetikli |
| Anlatıcı | Afi, dokuz bölüm boyunca sürekli; başka ses yok |
| Spotlight bütçesi | Ömür boyu 3 an |
| Rehberin yeri | Görevlerim üstü + ilk iki hafta Bugün satırı |
| Backend | Gerekmiyor, bu faz tamamen istemci |
| Görevlerim'in rolü | Ömür boyu başarımlar kalır; FTUE ayrı bir bölüm olarak üstüne oturur, karışmaz |
| **"Sofranda kim var?"** (15 Ağu) | Soruluyor, A4'ün sonunda, tek dokunuş. Yalnız B6'nın sırasını belirler; davetliye sorulmaz |
| **Rehberin dili** (15 Ağu) | Sofra kurulur: dokuz parça, dokuzuncuda Afi oturur. Sade liste reddedildi |
| **İlk dilim** (15 Ağu) | Dört bölüm: B1, B2, B3, B7. Kalan beşi sistemin üstüne eklenir |
| **Bildirim izni** (15 Ağu) | Kayıtta isteniyor ama önce Afi sorar; sistem penceresi yalnız "olur" denince açılır |
| **Pano kapıları** (17 Ağu) | Afi, Vücudum, Menüm, Grubum satırları da bölümleriyle açılır (valfler 3/5/5/5. gün); eski hesaplarda hiçbir satır kaybolmaz |
| **B8 valfi** (17 Ağu) | Sofra takımı iki tetiğe ek olarak 4. afiyet gününde de gelir; tanışma paywall değil |
| **B6 aksiyonu** (17 Ağu) | Grubu olmayana arkadaş kodu paylaşımı; paylaşım gerçekleşince biter |
| **Ölçüm** (17 Ağu) | Eski `afi_guide_*` adları kalır, bölüm `step`te; yeni sözlük ve huni yazılmadı |
| **"İnce uygulama" hissi** (17 Ağu) | Bugün'de Beslenme kartının altında ilerleme çubuğu (`SofraSetupRow`: 9 segment, "sıradaki: …", x/9) |
| **Açılma hissi** (17 Ağu) | Bölüm bitince Bugün'de konfeti + "Sofraya yeni parça 🎉 {ad} · {kapı} açıldı" bandı (`PieceLandedBanner`) + haptik |
| **Sabırsız kâşif** (17 Ağu) | Bölüm kendi odasında da karşılar: Menüm/Vücudum/Grubum/Yapay Zeka/Görevlerim/Lig başında `ChapterDoorIntro`, "…panoya al" kapıyı açar |
| **Bildirim cue** (17 Ağu) | Yerel bildirim, tek bekleyen (`cues.ts`): B1 sonrası akşam 18:30 "günü kapatalım mı"; bugünün kapısı açıkken hazır bölüm için ertesi 09:30 "sofraya yeni parça geldi". Yalnız izin verene, dersler durunca hiç. Sunucu merdiveniyle çakışabilir, kabul edildi |
| **Reviewer** (17 Ağu) | App Review demo hesabı (Stack id sabit) hiç öğretilmez: kayıt hazır kurulu, her satır ilk kareden |
| **Uzaktan anahtar** (17 Ağu) | `afiet.co/api/app-version` cevabına `flags.ftueDoors` ("progressive" \| "open"); admin Sürüm kapısı sayfasında kart; "open" tüm satırları açar, bölümler anlatmaya devam eder |
| **Eski kullanıcı / ölçüm** (17 Ağu) | Beta'da sorun değil; ölçümle bekleme yok, hızlı aksiyon |

---

## 11b. İlk dilim: dört bölüm

Kodlanacak olan dört bölüm mutlu yolun omurgasıdır ve sistemin tamamını kurar:
kuyruk, desen sözlüğü, rehber ve geriye dönük dolum bir kez yazılır, kalan beş
bölüm yalnız veri olarak eklenir.

| Bölüm | Neden bu dörtte | Yerini aldığı şey |
| --- | --- | --- |
| B1 Denge pusulan | Ürünün tezi burada anlaşılır | Mevcut spotlight'ın "öğün" adımı |
| B2 Günü kapat | Su, anlamlı olduğu ana taşınır | Mevcut spotlight'ın "su" adımı |
| B3 Ritmini bul | Markanın en önemli cümlesi, bugün kimsenin okumadığı kartta | `rhythmExplained` bayrağı |
| B7 Yolculuğun izi | Oyunlaştırma ilk ödül elde olduğu an tanıtılır | Yok, tamamen yeni |

Bu dilimde ayrıca:
- A4'ün iki sorusu (sofra + izin).
- Rehber: Görevlerim üstünde "Sofra kurulumu" ve dokuz parçalı sofra görseli;
  kodlanmayan beş bölüm orada "yolda" görünür ve önkoşulunu söyler.
- Mevcut spotlight'ın "ölçüm" adımı **kaldırılır** (B5'e taşındı, o dilimde
  gelecek). `homeVisibility` kuralı süreden bölüme çevrilir.
- Ölü bayraklar (`introBeslenme`, `introGecmis`) silinir.

Bu dilim bittiğinde mevcut `today-afi-guide.tsx` emekliye ayrılır; onun
bayrakları (`afiGuideStarted/IntroSeen/Done`, `starterShown/Done`) geriye dönük
dolumun girdisi olarak yaşamaya devam eder.

### Kodlanan hali (15 Ağu)

Yeni dosyalar:

| Dosya | Ne |
| --- | --- |
| `features/ftue/chapters.ts` | Bütün kurallar saf fonksiyon: hazırlık, kuyruk, red, kapılar, geriye dönük dolum |
| `features/ftue/chapters.test.ts` | 24 test; kanunların her biri burada yazılı |
| `features/ftue/chapter-store.ts` | Hesap kapsamlı kayıt (AsyncStorage), ftueFlags'in deseni |
| `features/ftue/useChapterFlow.ts` | Ekranın gördüğü hal: hangi bölüm, hangi kapı |
| `features/ftue/chapter-views.tsx` | Dört bölümün ekran hali (spotlight, kart, iki sahne) |
| `features/ftue/sofra-setup.tsx` | Dokuz parçalı sofra: Bugün satırı + Görevlerim bölümü |
| `features/ftue/micro.tsx` | Fısıltı deseni (`AfiWhisper`) |
| `tests/mobile/ftue-guardrails.test.ts` | Eski rehberin tuzaklarının geri gelmesini engelleyen testler |

Silinenler: `today-afi-guide.tsx`, `afi-guide-state.ts`, `homeVisibility.ts`
ve testleri; ölü bayraklar `introBeslenme` / `introGecmis`;
`useAfiGuideCompleted`.

Uygulamadaki kurallar tasarımın üstüne iki madde ekledi:

- **Ders bitince tümü biter.** Bir bölüm iki kez reddedilirse yalnız o bölüm
  değil, ders veren bütün bölümler susar (`teachingRetired`). Ödül veren
  bölüm (B7) çalışmaya devam eder: reddedilen şey öğretmekti, vermek değil.
- **Her kapının emniyet valfi var.** Pano ikinci kayıt gününde, Görevlerim ve
  Ligim satırları yedinci günde bölümden bağımsız olarak açılır. Atlanan bir
  bölüm en fazla bir günlük gecikmeye mal olur, özelliğe asla.

Doğrulama: `npm run typecheck` temiz, `npm test` 1025 test geçiyor,
`npx expo export --platform ios --platform android` çıkıyor. Simülatörde
gözle doğrulama yapılmadı.

### Kalan beş bölüm (17 Ağu)

Sistemin üstüne yalnız veri ve görünüm eklendi; kuyruk, kayıt ve rehber
değişmedi. `BUILT_CHAPTERS` artık dokuz anahtarın tamamı.

| Bölüm | Hazırlık (`chapterReady`) | Desen ve yer | Biter |
| --- | --- | --- | --- |
| B4 menu | son 30 günde aynı besin ≥2 farklı günde (`repeats.ts`), sofra yoksa | Bugün'de kart (`MenuChapterCard`) → tekrar eden besinler Menüm'e yazılır, `SofraSheet` adı ve öğünü dolu açılır | sofra kaydedilince |
| B5 direction | vücut profili yoksa ve 5. afiyet günü | Bugün'de kart → `BodySetupSheet` (yön sorusu içinde) | sheet kaydedince |
| B6 circle | grup yoksa; davetliye 0. gün; sofra cevabına göre ailece 2, eşimle 3, yalnız 5 afiyet günü | sahne (`aile` pozu); davetliye "Gruba git", diğerine arkadaş kodu paylaşımı | paylaşım gerçekleşince / gruba gidince |
| B8 team | bugün makrosuz besin **veya** Sohbet ziyareti (`sohbetVisited` bayrağı) **veya** 4. afiyet günü | sahne, Sini ve Demi çocuk olarak; "Tanışalım" → `/yapay-zeka` | tanışma ekranına geçince |
| B9 remind | dönüş günü `awayDays ≥ 3` (kayıt `visits`, günde bir kez ölçülür) | Bugün'de kart: widget tarifi (`WidgetHintSheet`) + izin verilmemişse tek ve son "seslen" (sistem "hayır" demişse Ayarlar) | widget tarifi açılınca ya da izin sorulunca |

Sıra (`PRIORITY`): dönüş → omurga (B1-B3) → ödül (B7) → B4 → B5 → B6 → B8;
davetlide B6 omurganın önüne geçer.

Kapılar (`chapterDoors`): pano B2 / 2. gün · Görevlerim+Ligim B7 / 7. gün ·
Afi satırı B8 / 3. gün · Vücudum B5 ya da profil dolunca / 5. gün · Menüm B4 ya
da sofra varsa / 5. gün · Grubum B6, grup varsa ya da davetliyse / 5. gün.
**Bu sistemden önce hesabı olan** (`established`, geriye dönük dolumda
işaretlenir) hiçbir kapıyı kapalı görmez.

Kendiliğinden biten bölümler (`alreadyDone`, kanun 7 çalışma zamanında):
vücut profili doluysa B5, grup varsa B6, sofra varsa B4 sessizce "sofrada"
olur.

Ayrıca: davetliye kayıtta sofra sorusu sorulmaz (`markInvitedAccount`);
Bugün'deki "Sofra kurulumu" satırı bütün parçalar bitince ya da 14. afiyet
gününde çekilir (dönüş bölümü hiç ayrılmayana gelmez, satır onu beklemez);
sorgular bölüm başına kapanır (`chapterSettled`: görev listesi B7, sofra ve
öğün geçmişi B4 bitince).

Doğrulama (17 Ağu): typecheck temiz, 1047 test yeşil (26 yeni: kalan beş
bölümün kuralları, `repeats`, dönüş günü, "anlatmayı bırak"), export çıkıyor.

Üç garanti (17 Ağu, kullanıcı isteği):
- **Atlanabilir:** her bölümün görünür bir çıkışı var (spotlight "Şimdi değil",
  kartlarda "Bugün olmasın / Şimdilik değil / Sonra", sahnelerde "Sonra/Kapat"
  + arka plan). İki red o bölümü değil bütün dersleri susturur; rehberin
  altındaki **"Anlatmayı bırak"** aynı şeyi tek dokunuşla yapar
  (`retireTeaching`), ödül (B7) gelmeye devam eder. Kapıların valfleri her
  şeyi en geç 7. afiyet gününde açar.
- **Tekrar izlenebilir:** rehberde dokuz parçanın hepsinde "tekrar göster /
  şimdi göster" var (`forceChapter`), tekrar her zaman çizilir: B4 tekrar eden
  besin yoksa ve B7 alınacak görev yoksa kapıya götüren yedek hâlleriyle
  (`replaying`), B9 tekrarında karşılama cümlesi düşer.
- **Duyarlı:** iPhone 17 Pro'da normal ve XXXL yazı boyutunda dokuz bölüm,
  rehber ve widget tarifi galeri rotasıyla gözle doğrulandı (17 Ağu):
  sarıyor, taşmıyor, çıkışlar görünür. iPhone SE oturum gerektirdiği için
  simülatörde açılamadı (simctl dokunamıyor); en dar genişlik açık madde.

---

## 12. Simülasyon

Beş kullanıcı, ekran ekran, son kullanıcı gözünden:

| Kişi | Durum | Ne kanıtlıyor |
| --- | --- | --- |
| Elif, 29 | Yalnız sofra, motive, reelden geldi | Mutlu yol: 0. günden 14. güne yedi bölüm |
| Hatice, 58 | Kızının davet bağlantısıyla geldi | Kuyruk yeniden sıralanır: B6 en başa geçer |
| Mert, 34 | Aceleci, her şeyi atlar | Reddedilen FTUE'de uygulama nasıl görünür |
| Zeynep, 22 | Kâşif, 2. dakikada her kapıya dokunur | Kapalı kapıda isim yazar, kilit yoktur |
| Ahmet, 41 | Beta'dan geliyor, 3 haftalık verisi var | Geriye dönük dolum: hiçbir şey tekrar öğretilmez |

Adım adım anlatım ayrı sayfada (bu dalın simülasyon çıktısı).
