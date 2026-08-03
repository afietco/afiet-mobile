# Ekonomi modeli: kazanç ve harcama

> Durum: ilke kaydı (tasarım) · Kaynak: afiet-gamification/docs/05, 06, 13
> Karar (16 Tem 2026): iki AYRI ekonomi; aralarında dönüşüm YOK.
> **Revizyon (1 Ağu 2026): köprü bilinçli olarak kuruldu.** Kazanç ekonomisi
> artık harcama ekonomisini besliyor. Duvar kalkmadı, daraldı.
> Terim notu: "ilmek" kelimesi kullanılmaz. Günlük atom = afiyet günü,
> kalıcı gövde = sofra bezi, haftalık işaret = desen/sıra, harcama birimi =
> ikram kesesi ("sofra kesesi" ve "tecrübe kesesi" adları kullanılmaz).

## Özet (tek cümle)

Kaydederek **kazanılan** ama asla harcanmayan kimlik birimi (afiyet günü,
sofra bezi, tecrübe, seviye, unvan) ve her pazartesi **tazelenen** ama asla
biriktirilmeyen harcama hakkı (ikram kesesi) vardır. Kimlik birimi kesenin
BOYUTUNU belirler; kese kimlik birimine dönüşmez.

## Tek yasa (load-bearing, 1 Ağu 2026'da yeniden yazıldı)

Eski yasa şuydu ve artık geçerli değildir:

> ~~Kazanılan asla harcanmaz. Harcanan asla kaydederek kazanılmaz.~~

Yerine geçen dar duvar:

> **Kayıt tutmak hiçbir zaman doğrudan kese üretmez.
> Kese hiçbir zaman sağlık döngüsünde avantaj satın almaz.**

Neden gevşetildi: 23 Tem'de gelen seviye ve lig katmanı hiçbir şeye
yaramıyordu, kullanıcı da ürün sahibi de sistemi anlamlandıramıyordu.
Ödülsüz bir merdiveni kimse öğrenmek istemez. Kese o boşluğu doldurur ve
sistemin tek cümlelik anlatımını mümkün kılar:

> Ligde yükselirsen her hafta Afi'yle daha çok konuşursun.

Neden hâlâ bir duvar var: köprü tamamen kalksaydı ("afiyet günü = kese")
kayıt, sağlık davranışı olmaktan çıkıp kredi farmına dönerdi. Kese bu yüzden
yalnız kademe, seviye, karşılıklı selam ve premiumdan beslenir; öğün, su,
ölçüm ve görev ondan hiçbir şey üretmez. Dolaylı yol (çok kayıt → hızlı
seviye → büyük kese) bilinçli olarak açıktır; seviye eğrisi yavaşlayan
olduğu için kendini frenler.

## 1 · Kazanç ekonomisi: afiyet günü (SAĞLAM, çekirdek)

Sağlık döngüsünün kendisi. Hiç para görmez, hiç harcanmaz.

- **Atom:** afiyet günü (o gün ≥1 öğün kaydı + denge tabağına bakış).
  Kazanç **günde en fazla bir**; öğün ya da makro başına DEĞİL. Bu tavan
  "daha çok kaydet = daha çok birim" farmını yapısal olarak keser.
- **Gövde:** sofra bezi. Kalıcı ve **sökülmez**. Kaçan gün beze bir şey
  eklemez ama var olanı asla sökmez.
- **Hafta:** 5/7 = ritim (bkz. afiyet-ritmi.md). Hedefe ulaşan hafta beze
  bir **sıra/desen** katar; 5 besin grubunun hepsine dokunulan hafta
  "gökkuşağı deseni" olur (bkz. ikinci-halka.md, renk koleksiyonu).
- **Sayı:** tecrübe → seviye → unvan bandı (afiet-gamification/docs/10).
  Hafta eşikli eski unvan merdiveni oraya taşındı.
- **Fizik:** kalıcı-eklemeli. "Unvanlar asla geri alınmaz" kuralı = "bez
  sökülmez" ile birebir aynı şey; bu kolonda kayıp draması imkansız.
- **Harcanmaz.** Bu kolonun tek çıktısı kimlik: "dengeli beslenen biriyim."
  Onu satın alınabilir bir şeye çevirmek çekirdeği öldürür.

## 2 · Harcama ekonomisi: ikram kesesi

Afi sohbetinin ölçüsü. Tam çerçeve: afiet-gamification/docs/13.

**Doluş:** her pazartesi 00:00 (Europe/Istanbul) tazelenir. Birikmez,
devretmez, kullanıcılar arası transfer edilmez. Hafta içinde harcama
serbesttir, tamamı pazartesi bitirilebilir; günlük tavan yoktur.

**Boyut:**

| Kaynak | Katkı |
| --- | --- |
| Kademe tabanı | Tuz 10 · Nane 13 · Kekik 16 · Sumak 19 · Safran 22 |
| Unvan eki | her 5 seviyede +1 (Yeni Sofra +0 → Sofra Piri +6) |
| Karşılıklı selam | kişi başı haftada 1, haftalık tavan +4 |
| Premium | +60 (her şeyin üstüne biner, tabanın yerine geçmez) |
| Hoş geldin | kayıtta tek seferlik dolum (miktar henüz açık) |

Sonuç: yeni kullanıcı 10, tipik aktif 16, freemium tavanı 32, premium 70 ile
92 arası (haftalık). Sayılar tahmindir; prod sohbet telemetrisiyle kalibre
edilecek. Kıyas: bugün sohbet ücretsiz ve `CHAT_DAILY_LIMIT=60` ile
korunuyor, yani pratikte sınırsız.

**Harcanır:** üç sohbet ajanının hepsi (Afi, diyetisyen, psikolog), mesaj
başına **1 kese**. Ücretsiz ajan yoktur; genel Afi de ölçülür.

**Kesenin dışında kalanlar:** fotoğraftan besin tanıma (`/v1/afi/photo-chat`,
günde 20) ve besin önerisi (günde 30) kayıt akışının parçasıdır, kendi
ücretsiz kotalarında kalır. Kural: **kese sohbeti ölçer, kaydı asla.**

**Kırmızı çizgi (asla satılmaz):** sağlık döngüsünün sürtünmesi. "Kaçan günü
satın al", "ritim sigortası", "hamleyi atla" gibi HİÇBİR şey yok.

**Sofra molası:** molada lig kesimi işlemediği için kademe tabanı olduğu
yerde durur, kullanıcı kese kaybetmez. Selam eki doğal olarak sıfırlanır,
telafi istenmez, bildirim gitmez.

## Boş kese ekranı

Kese bitince sohbet kapanmaz. Sırasıyla üç şey görünür:

1. Afi'nin hazır tek cümlesi. **Model çağrısı yapılmaz**, metin istemcide
   durur; sıcaklık maliyet üretmez.
2. "Pazartesi tazelenir" geri sayımı.
3. Premium teklifi.

Mesaj kutusu kaybolmaz, kilit dili kurulmaz, üzgün Afi gösterilmez. Ama
ekran dürüst olmalı: Afi o hafta gerçekten konuşamıyor.

## Free / premium dengesi (1 Ağu'da değişti)

Eski maddeydi: "Free deneyim kendi başına TAM; free kullanıcı hiçbir zaman
eksik hissetmez." Bu artık geçerli değil, çünkü genel Afi de keseye alındı ve
ücretsiz katmanda susabiliyor.

Yeni denge:

- **Sağlık döngüsü tamamen ücretsiz ve tam:** kayıt, denge tabağı, ritim,
  afiyet günü, sofra bezi, seviye, unvan, lig, görevler, fotoğraftan tanıma.
  Paywall alışkanlığın hiçbir parçasına dokunmaz.
- **Sohbet ölçülür:** free kullanıcı haftada 10 ile 32 arası, premium 70 ile
  92 arası mesaj yazar. Aktiflik iki tarafta da keseyi büyütür, yani lig ve
  seviye ücretli üyede de anlamını korur.
- **Zemin asla sıfır değildir:** Tuz kademesinde bile haftada 10 mesaj vardır
  ve Tuz'dan düşülmez.

## Neden gamification çalışmasını ihlal etmiyor

- **Elenen "puan/coin ekonomisi" (docs/05)** kaydederek KAZANILAN ve harcanan
  bir sayaçtı. Kese bunu yapmaz: kayıttan kazanılmaz, birikmez; bir sayaç
  değil haftalık bir haktır.
- **Ödül merdiveni (docs/06)** Katman 5 "Somut" bilinçli BOŞ bırakılmıştı
  (dışsal motivasyon riski). Kese o katmanı doldurur ama sağlık davranışını
  doğrudan ödüllendirmeden: ödülü veren kademe ve seviyedir, kaydın kendisi
  değil.
- **"Sayma, dengele":** kayıt hâlâ saydırmaz. Sayılan tek şey haftalık
  sohbet hakkıdır ve o da beslenmeyle ilgili değildir.

## Entegrasyon notu

- Sol taraf Dilim 1 mekanikleriyle (afiyet-ritmi,
  denge-tabagi-ve-gun-kapanisi, ikinci-halka unvanları) zaten örtüşür.
- Sağ taraf artık soyut değil: kese `POST /v1/afi/sohbet`e bağlıdır ve
  bugün canlı olan sohbet katmanını ölçer. IAP/abonelik altyapısı yalnız
  premium +60 için gerekir; kesenin geri kalanı abonelik olmadan çalışır.
- Bakiye tablosu YOKTUR: hak okuma anında hesaplanır (kademe + unvan +
  o haftaki selamlar), harcama o haftaki sohbet çağrısı sayısıdır. Görevlerin
  türetilmiş ilerleme deseniyle (docs/12) aynı yaklaşım.
- Bu doküman bir ILKE kaydıdır, uygulama spesifikasyonu değil.

## Yapma

- Kayıtla (öğün, afiyet günü, su, ölçüm, görev) doğrudan kese kazandırmak.
- Kese ile sürtünme atlatmak ya da health-loop avantajı satmak.
- Fotoğraftan tanımayı ya da besin önerisini keseye almak.
- Kese biriktirmek, devretmek, kullanıcılar arası transfer etmek.
- Kese biten kullanıcıya kilit dili kurmak ya da üzgün Afi göstermek.
- Ay ortası "kesen azalacak" uyarısı göndermek.
- "ilmek", "sofra kesesi", "tecrübe kesesi" terimlerini kullanmak.

## Açık kalanlar

1. Hoş geldin dolumunun miktarı (öneri 25, karar verilmedi).
2. Prod telemetrisiyle kalibrasyon doğrulaması (kişi başı gerçek haftalık
   mesaj dağılımı; medyan ve p90).
3. Kesenin sohbet dışında görüneceği yüzeyler (Bugün, Profil) ve biçimi.
4. Kayıt aydınlatmasına kesenin sosyal kaynağının eklenmesi (KVKK).
