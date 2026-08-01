# Max Potential veri orkestrasyonu (referans)

> Durum: **yalnızca referans**. afiet'te karşılığı yok, karar verilmedi, iş
> başlamadı. Kaynak: kullanıcının paylaştığı "Data Orchestration — Teknik Akış"
> diyagramı (Max Potential, development'ta canlı) · Kayıt tarihi: 1 Ağu 2026
>
> Bu dosya diyagramda **yazan** şeyleri kaydeder. Diyagramda olmayan hiçbir
> şey buraya tahminle eklenmedi; eksikler [§7](#7-diyagramdan-okunmayanlar)
> altında soru olarak duruyor. afiet'e nasıl uyarlanacağına dair hiçbir öneri
> ya da yön bu dosyada yoktur (bkz. [afiet-mevcut.md](afiet-mevcut.md)).

Tek cümleyle: **olay güdümlü bir pipeline, sporcunun "wiki" hafızasını damıtıp
koçlara geri veriyor.** Üç iddiası var: olay güdümlü, sporcu wiki hafızası,
uçtan uca izlenebilirlik.

---

## 1. Zincir

```
ÜRETİCİLER → OUTBOX → RELAY → KUYRUK → DAMITICI → HAFIZA → CONTEXT BUILDER → KOÇLAR
     ↑                                                                          │
     └──────────────── yeni tur → chat.turn_completed (döngü) ──────────────────┘
```

Halka kapalı: koçun cevabı yeni bir tur üretiyor, o tur yeni bir olay oluyor,
o olay hafızayı güncelliyor, hafıza bir sonraki cevabı besliyor.

---

## 2. Üreticiler (events)

Dört olay tipi, dört ayrı kaynaktan:

| Kaynak | Olay |
|---|---|
| Koç sohbeti | `chat.turn_completed` |
| Check-in | `check_in.created` |
| Onboarding | `onboarding.completed` |
| Haftalık rapor | `weekly_report.generated` |

---

## 3. Outbox: `domain_events`

- **outbox pattern**
- **append-only**
- **tek yazımda commit**: olay, kendisini doğuran iş kaydıyla aynı yazımda
  commit ediliyor.

Yani olay yayımlama ile veri değişikliği arasında "biri oldu öteki olmadı"
durumu yok.

---

## 4. Relay

- `setInterval` servisi
- **yalnızca Worker'da** çalışıyor
- outbox'tan **işlenmemişleri çekiyor**

---

## 5. Kuyruk: BullMQ + Redis

- kuyruk adı: `'page-distiller'`
- `jobId: page-{userId}`
- **single-writer kilidi**

jobId'nin kullanıcı başına sabit olması ile single-writer kilidi aynı şeyin iki
yüzü: bir sporcunun sayfasını aynı anda tek bir iş yazıyor.

---

## 6. Damıtıcı: DistillerAgent

- Azure Foundry
- model: **gpt-5.4**
- **self-sufficient job**: iş kendi kendine yeter (girdisini kendi toplar)

Yan girdi: `agent_memory_candidates (pending)` tablosu damıtıcıya bağlanıyor
(diyagramda kesikli çerçeve, yani ana zincirin dışında bir besleme).

### Hafıza: Sporcu Sayfası (wiki)

Damıtıcının çıktısı sporcunun sayfası. İki tablo:

- `athlete_page_sections`
- `athlete_page_revisions`

Dört bölüm:

| Bölüm | |
|---|---|
| `identity_goals` | `physical` |
| `mental` | `open_topics` |

**provenance:** `model [cN] index → [inv:uuid, tarih] eşlenir`

Yani modelin metin içinde ürettiği `[c1]`, `[c2]`… atıf indeksleri, kaynak
kaydın uuid'si ve tarihiyle eşleniyor. "Uçtan uca izlenebilirlik" iddiasının
dayandığı yer burası: sayfadaki her cümle hangi kayıttan geldiğini taşıyor.

---

## 7. Context Builder

- zarf: **`athlete_context.v1`** (sürümlü)
- içerik: **sayfa bölümleri + görevler + son gözlemler → prompt**

---

## 8. Koçlar

Beş koç: **Buddy · Björn · Maya · Emre · Marcus**

- **cevap öncesi sayfa profilini okur**
- **fiziksel bölüm her koçta** (yani `physical` bölümü koç ayrımı yapmadan
  hepsine gidiyor; diğer bölümlerin dağılımı diyagramda yazmıyor)

---

## 9. Diyagramdan okunmayanlar

Kayda geçsin diye: bunlar diyagramda **yok**. Cevaplarını uydurmadım, gerekirse
sana soracağım.

1. `agent_memory_candidates` nasıl doluyor, "pending" dışındaki durumlar ne?
2. Damıtıcı sayfayı tamamen mi yeniden yazıyor, bölüm bazında mı güncelliyor?
   `athlete_page_revisions` her koşuda mı yazılıyor?
3. Relay'in aralığı, tekrar deneme ve ölü mektup davranışı.
4. Bir olay iki kez işlenirse ne oluyor (idempotency anahtarı var mı)?
5. `physical` dışındaki bölümler hangi koça gidiyor?
6. `athlete_context.v1` zarfının alanları ve sürüm yükseltme kuralı.
7. Damıtıcı hata verirse sayfa eski hâlinde mi kalıyor, iş kuyruğa geri mi
   düşüyor?
8. Sporcunun sayfayı görme/düzeltme hakkı var mı?
