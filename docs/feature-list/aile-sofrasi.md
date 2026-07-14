# Aile sofrası — ortak hedef ve tepkiler

> Durum: tasarlandı · Dilim 3 · Kaynak: afiet-gamification/docs/05, 06
> Önkoşul: Gruplarım altyapısı (üyelik + davet, development'ta mevcut)

## Ne

Grubun ortak haftalık hedefi ("bu hafta ailece 12 afiyet günü") ve üyeler
arası tek dokunuşluk pozitif tepkiler (🎉 🍲). **Sıralama/kıyas yok** —
rekabet değil, aynı sofranın sıcaklığı.

## Neden

Marka zag'i "birey değil aile"; persona yakın çevre desteğine açık,
rekabete kapalı. Sosyal bağ churn'ü düşürür — ama yalnız güven korunursa.

## Nasıl çalışır

- **Paylaşım varsayılan KAPALI.** Üye açarsa grup yalnız şunu görür:
  o gün/haftada kaç afiyet günü yaşadığı. **Öğün detayı, skor, kilo asla
  paylaşılmaz.**
- Ortak hedef: üye sayısı × kişisel ritim hedeflerinin toplamından öneri;
  kurucu 1 hafta sonra düzenleyebilir (ödül-yetki).
- Tepki: üyenin afiyet günü tamamlandığında diğerlerine T5 daveti
  ("Ayşe bugün afiyetteydi — bir 🎉 gönder?"); tepki tek yönlü pozitif,
  yorum/mesajlaşma YOK (aile içi baskı kanalı açılmaz).
- Haftalık aile özeti: "bu hafta sofranızda 11 afiyet günü vardı" — kişi
  kırılımı vurgulanmaz, toplam kutlanır; herkese kendi cümlesi.
- Liderlik tablosu bilinçli YOK (gerekçe: afiet-gamification/docs/05
  elenenler tablosu).

## UI dokunuşları

- Gruplar ekranına (development'taki yeni sekme düzenine uyarak) grup
  kartında ortak hedef halkası + üye tepki satırı.
- Tepki bildirimi Dilim 3'te push ile (Dilim 2 altyapısını kullanır).

## Veri ve event'ler

- Backend: grup içi afiyet-günü paylaşım uçları + tepki ucu (yeni);
  paylaşım izni üye-başına bayrak (varsayılan false).
- Event: `reaction_sent {group_id_hash}`, paylaşım aç/kapa event'i
  (guardrail: kapama oranı >%20 ise varsayılanlar gözden geçirilir).

## Yapma

- Üye kırılımlı karşılaştırma ekranı, "en iyi üye" vurgusu — asla.
- Çocuk profilleri için ayrı düşünülmeden açmak (backlog persona "sofra
  kaptanı" turu bunu ele alacak).
