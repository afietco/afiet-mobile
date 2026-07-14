# Sofra molası — oyunlaştırmayı geri çekme modu

> Durum: tasarlandı · Dilim 2 · Kaynak: afiet-gamification/docs/06, 07

## Ne

Hastalık, tatil, yas, yoğunluk… kullanıcı "şimdi olmaz" dediğinde TÜM
oyunlaştırma yüzeylerinin tek anahtarla geri çekilmesi. Sağlık
uygulamasında zorunlu şefkat mekanizması — guardrail'in ürünleşmiş hali.

## Neden

Motivasyon ya da kapasite yokken gelen her teşvik rahatsızlığa döner ve
kalıcı bildirim kapatmayla sonuçlanır. Mola, "bırakmak" ile "ara vermek"
arasındaki farkı ürünün kendisine tanıtır.

## Nasıl çalışır

- Profil'de anahtar: "Sofra molası" (+ isteğe bağlı süre: 3 gün / 1 hafta /
  ben açana kadar).
- Mola boyunca: ritim şeridi ve hamle kartı gizlenir, o hafta ritim
  değerlendirmesine GİRMEZ (eksik hafta sayılmaz), tüm proaktif
  bildirimler susar (T1–T7), aile paylaşımı "molada" durumuna döner
  (sayı paylaşılmaz).
- Kayıt akışı NORMAL çalışır — isteyen mola sırasında da kaydeder;
  oyunlaştırma sessizdir, uygulama değil.
- Dönüşte: "Hoş geldin 🍲" — telafi İSTENMEZ, birikmiş görev/özet yığını
  gösterilmez, ritim taze pencereden devam eder.
- Otomatik öneri YOK (hastalığı biz teşhis etmeyiz); yalnız kullanıcı açar.

## UI dokunuşları

- Profil > tercihler bloğuna anahtar; mola aktifken Bugün'de ince, sakin
  bir "sofra molasındasın" şeridi (kapatma değil, hatırlatma).

## Veri ve event'ler

- `pause_started {duration?}` / `pause_ended`; profile'da mola durumu
  (backend'e sync — haftalık hesap ve bildirim susturması sunucuda da
  bilinmeli).
- Guardrail metriği: moladan dönüş oranı — düşükse dönüş deneyimi
  yeniden tasarlanır.

## Yapma

- Molayı utandıran kopya ("5 gündür molasın!") — asla.
- Mola sırasında "seni özledik" push'u — mola mutlak sessizliktir.
