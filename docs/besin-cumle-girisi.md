# Cümleyle besin girişi + arama sıralaması düzeltmesi

> Durum: **plan, onay bekliyor**. Karar tarihi: 1 Ağu 2026 · Dal:
> `feature/besin-cumle-girisi` (development tabanında, PR #103 merge'inden
> sonra açıldı).
>
> Kararlar kullanıcıyla alındı, bu dosya onların kaydı. Kod yazımı onaydan
> sonra başlar.

---

## 1. İki ayrı iş

| | Ne | Büyüklük |
|---|---|---|
| **A** | "peynir" yazınca "Beyaz peynir" çıkmıyor | küçük, teşhis kondu |
| **B** | Cümleyle çoklu besin girişi | büyük, iki repo |

A'nın B ile teknik ilgisi yok; aynı dalda ama ayrı commit'lerde gider.

---

## 2. İş A: arama sıralaması

### Teşhis (ölçüldü, tahmin değil)

Eşleşme zaten "içeriyor mu" bakıyor, önüne de bakıyor. Bozuk olan **kırpma**:

```
searchSeedFoods('peynir', 8)      → Peynirli omlet, Peynirli manakiş, Peynirli künefe,
                                     Peynirli kete, Beyaz peynir, Kaşar peyniri,
                                     Lor peyniri, Tulum peyniri              ✅

buildFoodSearchRows('peynir', []) → Peynirli omlet, Peynirli manakiş, Peynirli künefe,
  (ekranda görünen 8 satır)          Peynirli kete, Peynir helvası, Peynirli kabak
                                     tatlısı, Peynirli tatlı çörek,
                                     Peynir altı suyu                        ❌
```

`foodSearch.ts` katalogdan **24'lük havuz** istiyor (`SEED_POOL = LIMIT * 3`),
sonra sonucun **ilk 8'ini** alıyor. `searchSeedFoods` içindeki
"başlayanlar en fazla yarıyı alsın" dengesi 24 için hesaplanıyor: 12 başlayan +
12 diğer. İlk 8 kesilince hepsi başlayanlardan geliyor, tek bir gerçek peynir
kalmıyor.

### Yapılacak

Görünen liste kaç satırsa denge o sayı için kurulmalı. Havuzu büyütüp sonra
baştan kesmek, çekirdekteki dengelemeyi hükümsüz kılıyor.

Menü (kullanıcının kendi besinleri) katalogdan önce geldiği için, katalogdan
kaç satır isteneceği menüden kaç satır geldiğine bağlı: kalan yer kadar.

### Test

`tests/mobile/` altında, kaynak metni değil davranışı ölçen:

- `peynir` → ilk 8 satırda **en az bir** gerçek peynir (Beyaz peynir / Kaşar
  peyniri / Lor peyniri / Tulum peyniri) var.
- `peynir` → "Peynirli omlet" hâlâ listede (başlayanlar tamamen ezilmemeli).
- `elma` gibi tek eşleşmeli sorgular bozulmadı.
- Menüde 8 besin varken katalog satırları listeyi taşırmıyor.

---

## 3. İş B: cümleyle çoklu besin

### Örnek

```
"4 yumurtalı omlet 1 dilim ekmek biraz çeçil peynir"
   → 4 yumurtalı omlet   · 1 porsiyon
   → ekmek               · 1 dilim
   → çeçil peynir        · 1 porsiyon (miktar söylenmemiş)
```

### Alınan kararlar

| Karar | Seçilen |
|---|---|
| Backend | **Yeni uç + yeni ajan prompt'u** |
| Giriş | **Arama alanı cümleyi kendisi sezsin** |
| Sonuç ekranı | **Tek tek kuyruk** (fotoğraf akışının aynısı) |
| Katalogda olmayan besin | **Afi'nin değerleriyle eklensin + Menüm'e kaydedilsin** |
| Miktar | **Ajan miktarı da söylesin; belirsizse 1 porsiyon** |
| Sıralama | **Önce mock'la UI, onay sonrası backend + ajan** |
| Ajan | Berk'in kararı: az ile ben kuracağım |

### Sözleşme (önce bu donuyor)

```
POST /v1/afi/besin-ayikla
  { "text": "4 yumurtalı omlet 1 dilim ekmek biraz çeçil peynir" }

200
  { "foods": [
      { "name": "4 yumurtalı omlet",
        "quantity": 1, "measure": "porsiyon", "amountKnown": false,
        "groups": ["protein"], "macros": { "kcal": …, "protein": …, "carb": …, "fat": … },
        "description": "…", "inPool": true },
      { "name": "Ekmek", "quantity": 1, "measure": "dilim", "amountKnown": true, … },
      { "name": "Çeçil peynir", "quantity": 1, "measure": "porsiyon",
        "amountKnown": false, "inPool": false, … }
  ] }
```

- Besin nesnesi fotoğraf akışındaki `ApiAfiPhotoFood` ile **aynı alanlara**
  sahip, üstüne `quantity`, `measure` zaten var, bir de `amountKnown` ekleniyor.
  Böylece mobil taraftaki `toFood()` doğrulaması ve kuyruk olduğu gibi
  kullanılabiliyor.
- `amountKnown: false` → cümle miktarı söylememiş; satırda "ölçüsünü sen söyle"
  ipucu görünür, değer 1 porsiyon olarak gelir.
- `inPool` → katalogda ya da kullanıcının menüsünde aynı adla besin var mı.
- Cümle başına **en fazla 6 besin** (öneri; fotoğraf akışında bu 3).

### Mobil tarafta yapılacaklar

1. **`sentenceInput.ts`** (saf, testli): yazılan şey besin adı mı, cümle mi?
   Kural taslağı, testle sabitlenecek:
   - 3+ kelime, **veya** rakam içeriyor + 2+ kelime, **veya** 2+ katalog besni
     geçiyor;
   - "beyaz peynir", "tavuk şiş", "zeytinyağlı fasulye" gibi **çok kelimeli
     besin adları cümle sayılmayacak** (negatif test kümesi bunun için var).
2. **Arama adımında satır**: sezildiğinde listenin üstünde Afi pozuyla
   "Bunu Afi çözsün" satırı. Aramanın kendisi bozulmuyor, satır sadece ekleniyor.
3. **Çözümleyici geçidi** (`sentenceParse.ts`): faz 1'de **mock**, faz 2'de
   gerçek uç. Tek fonksiyon değişecek.
4. **Kuyruk**: `afiPhotoQueue` yardımcıları yeniden kullanılır; her besin sırayla
   detay adımına düşer, onaylanır / düzeltilir / reddedilir.
5. **Bilinmeyen besin**: onaylandığında hem öğüne yazılır hem `customFoods`'a
   (Menüm) kaydedilir. `contract.ts`'e yeni köken: `'cumle'` (fotoğrafın
   `'photo'`si gibi, kaynağı dürüst kalsın diye ayrı).
6. **Changelog** + gerekiyorsa `releaseNotes.ts`.

### Testler

- Cümle sezme: pozitif/negatif tablo (yukarıdaki kurallar).
- Kuyruk: 3 besin, ortadaki reddedilir, diğer ikisi öğüne düşer.
- Bilinmeyen besin onaylanınca menüye bir kez yazılır (iki kez değil).
- Mock çözümleyici ile uçtan uca akış (arama → satır → kuyruk → kayıt).

---

## 4. Sıralama

**Faz 1 (bu dal, onaydan sonra):** İş A + sözleşme + mock + mobil UI + testler.
Simülatörde göstereceğim, sen onaylayacaksın.

**Faz 2 (ayrı dal/PR, faz 1 onaylanınca):**
1. Foundry'de `afi-besin-ayiklayici` ajanı (prompt + çıktı şeması + örnekler).
2. `afiet-backend`'de `POST /v1/afi/besin-ayikla` + kota + testler.
3. Mobilde mock'un yerine gerçek uç.

---

## 5. Kalan kararlar (alındı, 1 Ağu)

1. **Cümle başına en fazla 6 besin.** Onaylandı.
2. **Kota: paylaşılsın.** Yeni uç mevcut Afi metin kotasını (`afiUseEvent`)
   kullanır, ayrı günlük sayaç açılmaz.
3. **Ajanlar sürümlenecek.** Yalnız yenisi değil, hepsi: üç ortam tek Foundry
   projesini paylaştığı için sabitlenmemiş her ajan portaldan yapılan bir
   publish ile prod'u deploy'suz değiştirebiliyor. Faz 2'de mevcut ajanların
   `*_VERSION` değerleri de doldurulacak.

## 6. Açık riskler

1. **Ajan kurulumu:** Foundry projesi `afiet/project-afiet` (Students
   aboneliği, swedencentral) az ile görünüyor, veri düzlemi token'ı alınıyor.
   Ancak bu kabuk dış ağa çıkamıyor (`curl` engelli), yani ajanı oluşturan REST
   çağrısı için ya sandbox'ı kapatmam ya da tek komutu senin çalıştırman
   gerekecek. Faz 2'nin ilk maddesi bu.
2. **"4 yumurtalı omlet"**: "4" miktar değil, adın parçası. Ajan prompt'unda
   bunu ayıran örnek şart; testte de negatif örnek olarak duracak.
