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
4. **Veri cihazda.** Sağlık verisi kimseye satılmaz, kimseye gönderilmez.

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

## Logo

Konsept: **buharı tüten bir kase**. Kase, uygulamanın kendi ölçü dilinden
("kaç kase?"); buhar, sofranın sıcaklığı ve "afiyet olsun" anı. Duotone,
yuvarlak hatlı, sevimli — ikon setiyle aynı ruh.

- Kaynak: `public/icon.svg` (512×512). PNG'ler bundan üretilir:
  `pwa-192.png`, `pwa-512.png`, `pwa-512-maskable.png` (maskable'da içerik
  %80 güvenli alana küçültülür), `apple-touch-icon.png` (180×180).
- Zemin: marka yeşili üzerinde beyaz çizim. Koyu temada da aynı ikon kullanılır.
- Wordmark: ikonla birlikte ya da tek başına, her zaman küçük harf "afiet",
  kalın (extrabold), sıkı harf aralığı (`tracking-tight`).

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
