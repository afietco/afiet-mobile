# Ekonomi modeli — kazanç ve harcama

> Durum: ilke kaydı (tasarım) · entegrasyon feature havuzu olgunlaşınca · Kaynak: afiet-gamification/docs/05, 06
> Karar (16 Tem 2026): iki AYRI ekonomi; aralarında dönüşüm YOK.
> Terim notu: "ilmek" kelimesi kullanılmaz. Günlük atom = afiyet günü,
> kalıcı gövde = sofra bezi, haftalık işaret = desen/sıra.

## Özet (tek cümle)

İki ayrı birim var: kaydederek **kazanılan** ama asla harcanmayan kimlik
birimi (afiyet günü, sofra bezi), ve parayla **gelen** ama asla kaydederek
kazanılmayan ifade birimi (ikram kesesi). İkisi birbirine dönüşmez.

## Tek yasa (load-bearing)

> **Kazanılan asla harcanmaz. Harcanan asla kaydederek kazanılmaz.**

İki keseyi bağlayan tek bir köprü bile (örn. "20 afiyet günü = 1 ikram")
sistemi çökertir: o an kayıt, sağlık davranışı olmaktan çıkıp para farmına
döner. Duvar bu yüzden var, gevşetilmez.

## 1 · Kazanç ekonomisi — afiyet günü (SAĞLAM, çekirdek)

Sağlık döngüsünün kendisi. Hiç para görmez.

- **Atom:** afiyet günü (o gün ≥1 öğün kaydı + denge tabağına bakış).
  Kazanç **günde en fazla bir**; öğün ya da makro başına DEĞİL. Bu tavan
  "daha çok kaydet = daha çok birim" farmını yapısal olarak keser.
- **Gövde:** sofra bezi. Kalıcı ve **sökülmez**. Kaçan gün beze bir şey
  eklemez ama var olanı asla sökmez.
- **Hafta:** 5/7 = ritim (bkz. afiyet-ritmi.md). Hedefe ulaşan hafta beze
  bir **sıra/desen** katar; 5 besin grubunun hepsine dokunulan hafta
  "gökkuşağı deseni" olur (bkz. ikinci-halka.md, renk koleksiyonu).
- **Kilometre taşı:** 4 / 12 / 24 **toplam** afiyet haftası (kesintisiz
  DEĞİL) → unvanlar: Denge Yolcusu, Sofra Dostu, Sofra Ustası.
- **Fizik:** kalıcı-eklemeli. "Unvanlar asla geri alınmaz" kuralı = "bez
  sökülmez" ile birebir aynı şey; kayıp draması imkansız.
- **Harcanmaz.** Bu kolonun tek çıktısı kimlik: "dengeli beslenen biriyim."
  Onu satın alınabilir bir şeye çevirmek çekirdeği öldürür.

## 2 · Harcama ekonomisi — ikram kesesi (ACELESİ YOK)

Premium katmanı. Sağlık döngüsünün DIŞINDA yaşar. Bilinçli olarak sona
bırakıldı: feature havuzu büyüdükçe kese kolayca somutlaşır.

- **Doluş:** abonelikle. Premium üye **her ay yenilenen** bir ikram kesesi
  alır (istiflenmez: "bu ay ikramların hazır"). Opsiyonel tek seferlik satın
  alma eklenebilir. Kese **asla kayıttan düşmez**.
- **Harcanır (güce değil, ifadeye + sıcaklığa):**
  - desenler (sofra bezi / kilim desenleri)
  - Afi sahneleri (mevsim temaları, özel kutlama anları)
  - aile ikramı (bedava tepkinin ötesinde, aileye özel sıcak jestler)
  - derin içgörü (sezon raporu, daha derin örüntü okuması)
- **Kırmızı çizgi (asla satılmaz):** sağlık döngüsünün sürtünmesi. "Kaçan
  günü satın al", "ritim sigortası", "hamleyi atla" gibi HİÇBİR şey yok.
  Para sofranın süsünü ve derinliğini alır, davranışın hilesini değil.
- **Durum:** sağ taraf henüz olgunlaşmadı; şimdilik ilke + iskele. Somut
  fiyat/kese mantığı premium feature kararıyla birlikte yazılır.

## Neden gamification çalışmasını ihlal etmiyor

Bir ekonomi, hele "harcanabilir" bir birim, ilk bakışta elenen listeye
çarpar gibi görünür. Çarpmıyor; gerekçe:

- **Elenen "puan/coin ekonomisi" (docs/05)** = kaydederek KAZANILAN ve
  harcanan bir sayaç. İkram bunu yapmaz: kayıttan kazanılmaz, yani afiyet
  günü'nün üstünde ikinci bir sayaç değildir.
- **Ödül merdiveni (docs/06)** ödülün para birimini "görmek, açmak, söz
  sahibi olmak" diye tanımlar; Katman 5 "Somut" bilinçli BOŞ bırakılmıştı
  (dışsal motivasyon riski). İkram o boşluğu doldurmaz: sağlık davranışını
  ödüllendirmez, yalnız premium İFADE satar. Davranış ile para arasında duvar
  durur.
- **"Sayma, dengele":** sayılan bir şey yok. Afiyet günü temas ölçüsüdür,
  ikram parayla gelen kesedir; kayıt hâlâ saymaya dönmez.

## Free / premium dengesi

- **Free deneyim kendi başına TAM:** afiyet günü, ritim, unvan, sofra bezi.
  Free kullanıcı hiçbir zaman "eksik" hissetmez.
- **İkram bir üst kat:** güzelleştirir, tamamlamaz. Paywall sofranın süsünü
  satar, alışkanlığın kendisini değil.

## Entegrasyon notu

- Sol taraf Dilim 1 mekanikleriyle (afiyet-ritmi, denge-tabagi-ve-gun-kapanisi,
  ikinci-halka unvanları) zaten örtüşür; ekstra iş minimum.
- Sağ taraf (ikram) ayrı bir dilim: IAP/abonelik altyapısı + premium feature
  havuzu gerektirir. Feature'lar birikince açılır.
- Bu doküman bir ILKE kaydıdır, uygulama spesifikasyonu değil.

## Yapma

- İki keseyi bağlayan köprü/çevrim (dönüşüm) - asla.
- Kayıtla ikram kazandırmak - asla (coin farmını geri getirir).
- Sürtünme atlamayı ya da health-loop avantajını satmak - asla.
- Free kullanıcıya "eksik" hissi veren kilit dili - asla.
- "ilmek" terimini kullanmak - kullanılmıyor (bkz. terim notu).
