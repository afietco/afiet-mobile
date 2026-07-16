# feature-list — oyunlaştırma özellikleri

afiet'in oyunlaştırma katmanının özellik kayıtları. Tasarımın gerekçesi ve
tam TOY çalışması `afiet-gamification` reposunda yaşar (görselleştirme:
oradaki `index.html`); **bu klasör uygulamaya inecek halin özetidir** —
geliştirme sırası geldiğinde her dosya tek başına yeterli olacak şekilde
yazıldı.

> Süzgeç her yerde aynı: **"Sofrayı saydırmadan dengeler"** (BRAND.md).
> Puan/coin, genel liderlik tablosu, kesintisiz seri draması, kilo/kalori
> rozeti bu üründe YOKTUR — gerekçeler afiet-gamification/docs/05'te.

## Karar günlüğü (14 Tem 2026)

| Karar | Sonuç |
| --- | --- |
| Seri modeli | **Haftalık ritim** kazandı (kesintisiz günlük seri değil). Geçmiş sayfası ileride az belirginleşecek/pivot edilecek; kesintisiz seri anlatımı onunla birlikte emekli olur, ritim Bugün'de yaşar. |
| Afi'nin rolü | Kutlama karakteri **+ genişletilmiş yardımcı**: Menüm doldurma, liste dışı yiyeceklerin görsel analizi, chat desteği (bkz. `afi-asistan.md`). |
| Ritim varsayılanı | 5/7 başlangıç; T7 tetikleyicisiyle 4–6 gün arası kişiselleşir. |
| Analytics | **Kendi `events` tablomuz**, admin panelde görünür. Dış bağımlılık (PostHog vb.) istenmiyor. |
| TOY kart oturumu | Fiziksel tur gerekmedi; çalışma v0.1 yeterli bulundu. |
| Birim/ekonomi modeli (16 Tem) | İki AYRI ekonomi: kazanç (afiyet günü → sofra bezi, harcanmaz) + harcama (ikram kesesi, parayla gelir). Aralarında dönüşüm yok. "ilmek" terimi terk edildi. Ayrıntı: [ekonomi-modeli.md](ekonomi-modeli.md). Sağ taraf (ikram) feature havuzu büyüyünce açılır. |

## Dosyalar ve dilim haritası

| Dosya | Özellik | Dilim |
| --- | --- | --- |
| [afiyet-ritmi.md](afiyet-ritmi.md) | Haftalık ritim (çekirdek mekanik) | 1 |
| [denge-tabagi-ve-gun-kapanisi.md](denge-tabagi-ve-gun-kapanisi.md) | Anlık geri bildirim + gün kapanışı | 1 |
| [denge-hamlesi.md](denge-hamlesi.md) | Günlük tek mikro davet | 1 |
| [haftalik-sofra-ozeti.md](haftalik-sofra-ozeti.md) | Pazar akşamı hafta görünümü | 1 |
| [event-altyapisi.md](event-altyapisi.md) | events tablosu + track() + admin | 1 (önkoşul) |
| [tetikleyiciler.md](tetikleyiciler.md) | T1–T7 kuralları ve anti-kurallar | 1 (in-app) → 2 (push) |
| [sofra-molasi.md](sofra-molasi.md) | Oyunlaştırmayı geri çekme modu | 2 |
| [aile-sofrasi.md](aile-sofrasi.md) | Grup ortak hedefi + tepkiler | 3 |
| [ikinci-halka.md](ikinci-halka.md) | Renk koleksiyonu, unvanlar, Menüm ustalığı | 4 |
| [afi-asistan.md](afi-asistan.md) | Afi: kutlama + yardımcı (AI hattı) | kutlama 1 · asistan ayrı hat |
| [ekonomi-modeli.md](ekonomi-modeli.md) | Kazanç/harcama iki ekonomi (birim modeli) | ilke · feature olgunlaşınca |

**Dilim sırası neden böyle:** push bildirimi ve analytics altyapısı henüz
yok. Dilim 1 tamamen uygulama içi çalışır + `events` tablosunu kurar;
Dilim 2 ancak Dilim 1 metrikleri sağlıklıysa push'u açar ("bildirim, zayıf
döngüyü kurtarmaz"). Ayrıntı: afiet-gamification/docs/08.

## Sözlük

- **Afiyet günü** — o gün ≥1 öğün kaydı + denge tabağına bakış. Sistemin
  çekirdek birimi; mükemmellik değil temas ölçüsü.
- **Afiyet ritmi** — haftada 5/7 afiyet günü penceresi; 2 gün "sofra payı".
- **Sofra payı** — haftanın baştan tanınmış 2 günlük esneme hakkı.
- **Denge hamlesi** — günün eksik besin grubundan üretilen tek mikro davet.
- **Sofra molası** — hastalık/tatilde oyunlaştırmanın tamamen geri çekilmesi.
- **Sofra bezi** : afiyet günlerinin biriktiği kalıcı gövde; sökülmez,
  harcanmaz. Kimlik birimi (bkz. ekonomi-modeli.md).
- **Desen / sıra** : hedefe ulaşan bir afiyet haftasının sofra bezine kattığı
  işaret; 5 grubun hepsine dokunulan hafta "gökkuşağı deseni".
- **İkram kesesi** : parayla (abonelikle) gelen, her ay yenilenen premium
  harcama birimi; kayıttan kazanılmaz, ifadeye harcanır (bkz. ekonomi-modeli.md).
