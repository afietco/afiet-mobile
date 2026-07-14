# afiet — Marka Rehberi

Bu dosya markanın tek gerçeklik kaynağıdır. UI metni yazan, ekran tasarlayan
ya da yeni özellik ekleyen herkes (insan ya da model) önce buradan geçer.

## İsim

**afiet** — "afiyet"in sahiplenilmiş yazımı. Kökü Arapça *āfiyah*: sağlık,
esenlik. Her Türk sofrasında söylenen "afiyet olsun"un içindeki kelime.
Sesli okunuşta "afiyet"ten farkı yoktur; yazımı markayı ayırt edilir ve
korunabilir kılar (Flickr/Tumblr hamlesi).

Yazım kuralları:

- Her yerde **küçük harfle**: "afiet". Cümle başında bile: "afiet seni tanımak istiyor."
  Büyük harf ("Afiet", "AFIET") kurumsal kaçar; kullanma.
- Çekim eki apostrofla: "afiet'e hoş geldin", "afiet'te".
- İngilizce bağlamda da değişmez: "afiet".
- Alan adı: **afiet.co**

## Öz (onlyness)

> afiet, kalori saydırmadan, Türk sofrasının kendi ölçüleriyle (dilim, kase,
> avuç) konuşarak ailenin dengeli beslenme alışkanlığını oyunlaştıran tek
> sağlık uygulamasıdır.

Kategorideki herkesin zig'ine karşı dört zag:

1. **Kalori sayısı yok, denge var.** Rakiplerin varlık sebebini reddediyoruz.
2. **Türk sofrasının diliyle.** "Kaç dilim?", "kaç kase?", "bir avuç" —
   oz/cup/serving değil.
3. **Birey değil aile.** Hedef bireysel optimizasyon değil, birlikte alışkanlık.
4. **Suçluluk değil, şefkat.** Rakipler utandırır ("hedefini aştın!"); afiet
   sofrada seni seven biri gibi konuşur. Yargı yok, davet ve kutlama var.

## Trueline ve tagline

- **Trueline** (içeride; ürün kararlarını süzen cümle): *Sofrayı saydırmadan dengeler.*
  Yeni bir özellik bu cümleyle çelişiyorsa (ör. kalori hedefi dayatmak,
  suçluluk bildirimi) o özellik yapılmaz.
- **Tagline** (dışarıda): **Sayma, dengele.**

## Ses tonu

Temel his: **sofrada seni seven biri**. Yargılamaz, buyurmaz, kutlar, davet eder.

| Yazma ✗ | Yaz ✓ |
|---|---|
| "Yağ tüketimini azaltmalısın" | "Bugün sebzeye yer açılır mı? 🌿" |
| "Hedefini tutturamadın" | "Bugün farklıydı, yarın yeni bir sofra" |
| "3 gündür kayıt girmedin!" | "Sofran seni özledi 🍲" |
| "Kalori limitini aştın" | (asla — kalori bir limit değil, bilgidir) |
| "Kullanıcı", "profil oluşturun" | "sen", "seni tanıyalım" |

Kurallar:

- Her zaman **sen** dili; resmiyet yok ("siz", "-iniz" yok).
- Emir kipi + suçluluk asla; davet + merak her zaman.
- Kutlama anları cömerttir: "Afiyet olsun! 🎉" ilk kayıtta, "Bugün afiyetteydin"
  denge gününde. "afiyet olsun / afiyette olmak" kalıpları markanın
  mikro-kopya hazinesidir — çekinmeden kullan.
- Emoji, mesaj metinlerinde ve avatarlarda serbest; ikon yerine emoji kullanma
  (ikonlar `src/ui/icons.tsx`).
- Sayılar bilgilendirir, yargılamaz: "yaklaşık 1.850 kcal" denir, "1.850/2.000
  kaldı!" baskısı kurulmaz.

## Logo — Afi

Konsept: **Afi, buharı tüten mutlu bir kase.** İlk bakışta buharı tüten kase
(uygulamanın kendi ölçü dili — "kaç kase?"; sofranın sıcaklığı), ikinci
bakışta gülümseyen bir yüz (markanın özü: yargısız şefkat, "afiyet olsun"
diyen biri). Afi bir maskottur: kutlama anları, boş durumlar ve tanıtım
görsellerinde karakter olarak kullanılabilir.

Anatomi ve kurallar:

- Zemin: emerald degrade (sol üst `#10b981` → sağ alt `#047857`), köşe
  yarıçapı 116/512.
- Kase ve ayak beyaz; gözler ve gülümseme `#047857` (zeminin koyu ucu —
  başka renk verilmez, yüz "çizilmiş" değil "oyulmuş" durur).
- Buhar iki tel: sol kısa tel açık yeşil `#a7f3d0`, sağ uzun tel beyaz —
  duotone kimlik. Buhar telleri asla üçe çıkarılmaz (eski, kişiliksiz logo).
- Yüz ifadesi sabittir: kapalı mutlu gözler + minik gülümseme. Kızgın/üzgün
  Afi varyantı yapılmaz — marka asla yargılamaz, maskotu da yargılamaz.
- Kaynak: `apps/mobile/assets/icon.svg` (512×512, tek gerçek). PNG türevleri
  `node apps/mobile/scripts/generate-assets.mjs` ile üretilir: uygulama
  ikonu, Android adaptive foreground/monochrome, splash ikonu ve favicon.
  İçerik maskable güvenli bölgesinin (merkez %80) içindedir.
- Wordmark: ikonla birlikte ya da tek başına, her zaman küçük harf "afiet",
  kalın (extrabold), sıkı harf aralığı (`tracking-tight`). Referans hali
  mobil Bugün başlığıdır: Nunito ExtraBold, marka yeşili (emerald-600),
  altında "Sayma, dengele." tagline'ı — Bugün ekranından hiç kalkmaz
  (mobilde `src/ui/BrandHeader.tsx`).

## Renk

- **Marka yeşili:** emerald — `#059669` (emerald-600). PWA theme, ikon zemini,
  birincil aksan. Koyu temada `emerald-400/500` tonları.
- Bölüm aksanları korunur: Vücudum = mor (violet), Su = mavi (sky) —
  marka yeşili "beslenme + bütün"ün rengidir, her şeyi yeşile boyama.
- Semantik token'lar (`src/index.css`) her zaman öncelikli; ham renk sınıfı yok.

## Uygulama kimliği (teknik)

- PWA manifest: `name: 'afiet'`, `short_name: 'afiet'` (`vite.config.ts`).
- `<title>`: "afiet — sayma, dengele".
- IndexedDB adı `family-health` olarak **kalır** (`src/data/db.ts`) —
  değiştirmek mevcut kullanıcıların verisini yetim bırakır. Marka, veritabanı
  adına sızmaz.
- localStorage anahtarları `fh:` önekiyle kalır (aynı sebep).
