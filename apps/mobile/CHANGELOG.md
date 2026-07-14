# Changelog — afiet mobil

Mobil uygulamanın sürüm geçmişi. Web'den bağımsız sürümlenir
(kaynak gerçeklik `apps/mobile/package.json` + `app.json`, tag'ler
`mobile-vX.Y.Z`). Build numarası EAS tarafından uzaktan otomatik artar
(`appVersionSource: remote` + `autoIncrement`).

## [Yayınlanmadı]

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
