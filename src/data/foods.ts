import type { FoodGroup, FoodMeasure, Macros } from './types'

export type FoodCategory =
  | 'kahvaltilik'
  | 'corba'
  | 'ana_yemek'
  | 'yan'
  | 'salata_yogurt'
  | 'meyve_kuruyemis'
  | 'atistirmalik'
  | 'tatli'
  | 'icecek'

export const FOOD_CATEGORIES: { key: FoodCategory; label: string }[] = [
  { key: 'kahvaltilik', label: 'Kahvaltılık' },
  { key: 'corba', label: 'Çorbalar' },
  { key: 'ana_yemek', label: 'Ana Yemekler' },
  { key: 'yan', label: 'Pilav & Garnitür' },
  { key: 'salata_yogurt', label: 'Salata & Yoğurt' },
  { key: 'meyve_kuruyemis', label: 'Meyve & Kuruyemiş' },
  { key: 'atistirmalik', label: 'Atıştırmalık & Fast Food' },
  { key: 'tatli', label: 'Tatlılar' },
  { key: 'icecek', label: 'İçecekler' },
]

export function categoryMeta(key: FoodCategory) {
  return FOOD_CATEGORIES.find((c) => c.key === key)!
}

export interface SeedFood {
  name: string
  groups: FoodGroup[]
  category: FoodCategory
  /** Bu besin için doğal miktar ölçüsü — miktar girişi buna göre sorulur */
  measure: FoodMeasure
  /** 1 ölçü için yaklaşık makrolar — hassas takip değil, denge pusulası */
  macros: Macros
  /** Besin hakkında kısa, basit bilgi (rehber popup'ında gösterilir) */
  description: string
}

/**
 * Otomatik tamamlama ve besin rehberi için yaygın Türk yemekleri / besinler.
 * Gruplar varsayılandır, kullanıcı eklerken düzenleyebilir.
 * Makrolar 1 ölçü içindir ve yaklaşıktır (ev porsiyonu baz alınır).
 */
export const SEED_FOODS: SeedFood[] = [
  // Kahvaltılık
  {
    name: 'Beyaz peynir',
    groups: ['sut', 'protein'],
    category: 'kahvaltilik',
    measure: 'dilim',
    macros: { kcal: 80, protein: 5, carb: 0.5, fat: 6.5 },
    description:
      'Salamurada olgunlaşan klasik kahvaltı peyniri. İyi bir protein ve kalsiyum kaynağıdır; 1 dilim ~30 g kabul edilir.',
  },
  {
    name: 'Kaşar peyniri',
    groups: ['sut', 'protein'],
    category: 'kahvaltilik',
    measure: 'dilim',
    macros: { kcal: 85, protein: 6, carb: 0.5, fat: 7 },
    description:
      'Sarı, yarı sert bir peynir. Beyaz peynire göre biraz daha yağlı ve enerjisi yüksektir; 1 dilim ~25 g.',
  },
  {
    name: 'Lor peyniri',
    groups: ['sut', 'protein'],
    category: 'kahvaltilik',
    measure: 'kasik',
    macros: { kcal: 35, protein: 3.5, carb: 1, fat: 1.5 },
    description:
      'Peynir altı suyundan yapılan, düşük yağlı ve hafif bir peynir. Protein oranına göre kalorisi düşüktür.',
  },
  {
    name: 'Haşlanmış yumurta',
    groups: ['protein'],
    category: 'kahvaltilik',
    measure: 'adet',
    macros: { kcal: 75, protein: 6.5, carb: 0.5, fat: 5 },
    description:
      'En pratik protein kaynaklarından biri. Yağ eklenmeden piştiği için sahandakine göre daha hafiftir.',
  },
  {
    name: 'Menemen',
    groups: ['protein', 'sebze'],
    category: 'kahvaltilik',
    measure: 'porsiyon',
    macros: { kcal: 220, protein: 12, carb: 8, fat: 15 },
    description:
      'Domates, biber ve yumurtayla yapılan sıcak kahvaltı klasiği. Protein ve sebzeyi bir arada sunar.',
  },
  {
    name: 'Sahanda yumurta',
    groups: ['protein'],
    category: 'kahvaltilik',
    measure: 'adet',
    macros: { kcal: 105, protein: 6.5, carb: 0.5, fat: 8.5 },
    description:
      'Yağda pişen yumurta. Haşlanmışa göre pişirme yağı kadar ek enerji taşır.',
  },
  {
    name: 'Omlet',
    groups: ['protein'],
    category: 'kahvaltilik',
    measure: 'porsiyon',
    macros: { kcal: 210, protein: 13, carb: 1.5, fat: 17 },
    description:
      'Çırpılmış yumurtanın tavada pişmiş hali; 1 porsiyon ~2 yumurta kabul edilir. Peynirli/sebzeli çeşitleri değişir.',
  },
  {
    name: 'Zeytin',
    groups: ['yag'],
    category: 'kahvaltilik',
    measure: 'adet',
    macros: { kcal: 5, protein: 0, carb: 0.2, fat: 0.5 },
    description:
      'Kahvaltının sağlıklı yağ kaynağı. Tekli doymamış yağlardan zengindir; tuz içeriği yüksektir.',
  },
  {
    name: 'Bal',
    groups: ['tatli'],
    category: 'kahvaltilik',
    measure: 'kasik',
    macros: { kcal: 60, protein: 0, carb: 17, fat: 0 },
    description:
      'Doğal ama yoğun bir şeker kaynağı. 1 yemek kaşığı ~20 g alır; miktarı küçük tutmak dengeyi korur.',
  },
  {
    name: 'Reçel',
    groups: ['tatli'],
    category: 'kahvaltilik',
    measure: 'kasik',
    macros: { kcal: 55, protein: 0, carb: 14, fat: 0 },
    description:
      'Meyvenin şekerle pişmiş hali. Meyve içerse de ağırlıklı olarak eklenmiş şeker taşır.',
  },
  {
    name: 'Tahin pekmez',
    groups: ['yag', 'tatli'],
    category: 'kahvaltilik',
    measure: 'kasik',
    macros: { kcal: 90, protein: 2, carb: 10, fat: 5 },
    description:
      'Susam ezmesi ile üzüm/dut pekmezinin karışımı. Enerjisi yüksek, demir ve kalsiyum yönünden zengin bir ikilidir.',
  },
  {
    name: 'Tereyağı',
    groups: ['yag'],
    category: 'kahvaltilik',
    measure: 'kasik',
    macros: { kcal: 75, protein: 0, carb: 0, fat: 8.5 },
    description:
      'Sütten yapılan hayvansal yağ. Doymuş yağ oranı yüksektir; küçük miktarlar lezzet için yeterlidir.',
  },
  {
    name: 'Simit',
    groups: ['tahil'],
    category: 'kahvaltilik',
    measure: 'adet',
    macros: { kcal: 300, protein: 9, carb: 55, fat: 5 },
    description:
      'Susamlı halka ekmek. Pratik ama ağırlıklı olarak rafine karbonhidrattır; yanına peynir eklemek dengeler.',
  },
  {
    name: 'Poğaça',
    groups: ['tahil', 'yag'],
    category: 'kahvaltilik',
    measure: 'adet',
    macros: { kcal: 250, protein: 5, carb: 28, fat: 13 },
    description:
      'Yağlı hamurdan yapılan kahvaltılık hamur işi. Peynirli, patatesli gibi iç malzemesine göre değişir.',
  },
  {
    name: 'Börek',
    groups: ['tahil', 'yag'],
    category: 'kahvaltilik',
    measure: 'dilim',
    macros: { kcal: 280, protein: 7, carb: 28, fat: 15 },
    description:
      'Yufka katları arasına iç konarak pişirilen hamur işi. Yağ ve karbonhidrat ağırlıklıdır; 1 dilim ~100 g.',
  },
  {
    name: 'Tam buğday ekmek',
    groups: ['tahil'],
    category: 'kahvaltilik',
    measure: 'dilim',
    macros: { kcal: 60, protein: 2.5, carb: 11, fat: 1 },
    description:
      'Kepeği ayrılmamış undan yapılan ekmek. Beyaz ekmeğe göre daha fazla lif ve mineral içerir.',
  },
  {
    name: 'Beyaz ekmek',
    groups: ['tahil'],
    category: 'kahvaltilik',
    measure: 'dilim',
    macros: { kcal: 65, protein: 2, carb: 13, fat: 0.5 },
    description:
      'Rafine beyaz undan yapılan günlük ekmek. Lifi azdır; tam tahıllı seçenekler daha uzun tok tutar.',
  },
  {
    name: 'Bazlama',
    groups: ['tahil'],
    category: 'kahvaltilik',
    measure: 'adet',
    macros: { kcal: 350, protein: 10, carb: 68, fat: 4 },
    description:
      'Tavada pişen kalın köy ekmeği. Bir adedi birkaç dilim ekmeğe denk gelir; yarımı çoğu zaman yeterlidir.',
  },
  {
    name: 'Yulaf ezmesi',
    groups: ['tahil'],
    category: 'kahvaltilik',
    measure: 'kase',
    macros: { kcal: 150, protein: 5, carb: 27, fat: 3 },
    description:
      'Lif ve B vitamini zengini tam tahıl. Uzun süre tok tutar; süt ve meyveyle güzel bir kahvaltı olur (kase ~40 g kuru yulaf).',
  },
  {
    name: 'Granola',
    groups: ['tahil'],
    category: 'kahvaltilik',
    measure: 'kase',
    macros: { kcal: 230, protein: 6, carb: 32, fat: 9 },
    description:
      'Fırınlanmış yulaf, kuruyemiş ve kuru meyve karışımı. Besleyicidir ama tatlandırıcı içeriğiyle enerjisi yüksektir.',
  },
  // Çorbalar
  {
    name: 'Mercimek çorbası',
    groups: ['protein', 'sebze'],
    category: 'corba',
    measure: 'kase',
    macros: { kcal: 150, protein: 8, carb: 22, fat: 3 },
    description:
      'Kırmızı mercimekten yapılan en yaygın çorba. Bitkisel protein ve lif deposudur.',
  },
  {
    name: 'Ezogelin çorbası',
    groups: ['protein', 'tahil'],
    category: 'corba',
    measure: 'kase',
    macros: { kcal: 160, protein: 8, carb: 24, fat: 4 },
    description:
      'Mercimek, bulgur ve pirinçle yapılan baharatlı çorba. Mercimek çorbasının biraz daha doyurucu hali.',
  },
  {
    name: 'Tarhana çorbası',
    groups: ['tahil', 'sut'],
    category: 'corba',
    measure: 'kase',
    macros: { kcal: 130, protein: 5, carb: 20, fat: 3 },
    description:
      'Yoğurt, un ve sebzenin fermente edilip kurutulmasıyla yapılan geleneksel çorba. Hafif ve mideye dosttur.',
  },
  {
    name: 'Yayla çorbası',
    groups: ['sut', 'tahil'],
    category: 'corba',
    measure: 'kase',
    macros: { kcal: 140, protein: 5, carb: 16, fat: 6 },
    description: 'Yoğurt ve pirinçle yapılan, nane ile tatlanan yumuşak içimli çorba.',
  },
  {
    name: 'Domates çorbası',
    groups: ['sebze'],
    category: 'corba',
    measure: 'kase',
    macros: { kcal: 110, protein: 3, carb: 14, fat: 5 },
    description:
      'Domates püresiyle yapılan klasik çorba. Kaşar eklendiğinde protein ve kalorisi artar.',
  },
  {
    name: 'Tavuk suyu çorba',
    groups: ['protein'],
    category: 'corba',
    measure: 'kase',
    macros: { kcal: 120, protein: 8, carb: 12, fat: 4 },
    description:
      'Tavuk suyu ve tel şehriyeyle yapılan hafif çorba. Hasta günlerinin klasiğidir.',
  },
  // Ana yemekler
  {
    name: 'Izgara tavuk',
    groups: ['protein'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 250, protein: 40, carb: 0, fat: 9 },
    description:
      'Yağsız pişen tavuk göğsü/pirzola. Yüksek protein, düşük karbonhidrat — porsiyon ~150 g.',
  },
  {
    name: 'Tavuk sote',
    groups: ['protein', 'sebze'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 280, protein: 30, carb: 10, fat: 13 },
    description: 'Tavuğun biber, domates ve soğanla tavada pişmiş hali. Protein + sebze dengesi kurar.',
  },
  {
    name: 'Izgara köfte',
    groups: ['protein'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 350, protein: 28, carb: 5, fat: 24 },
    description:
      'Kıymadan yapılan ızgara köfte; porsiyon 4-5 adet kabul edilir. Protein yüksek, yağı tavuğa göre fazladır.',
  },
  {
    name: 'Izgara balık',
    groups: ['protein', 'yag'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 280, protein: 35, carb: 0, fat: 15 },
    description:
      'Mevsim balığının ızgarası. Kaliteli protein ve faydalı omega-3 yağları sağlar.',
  },
  {
    name: 'Somon',
    groups: ['protein', 'yag'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 310, protein: 30, carb: 0, fat: 20 },
    description:
      'Omega-3 açısından en zengin balıklardan. Yağlı bir balık olduğu için enerjisi beyaz balıktan yüksektir.',
  },
  {
    name: 'Et sote',
    groups: ['protein'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 320, protein: 30, carb: 6, fat: 19 },
    description: 'Kuşbaşı kırmızı etin sebzelerle sotelenmiş hali. Protein ve demir kaynağıdır.',
  },
  {
    name: 'Karnıyarık',
    groups: ['sebze', 'protein'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 300, protein: 12, carb: 15, fat: 21 },
    description:
      'Kıyma dolgulu patlıcan yemeği. Patlıcan yağ çektiği için enerjisi görünenden yüksektir.',
  },
  {
    name: 'İmam bayıldı',
    groups: ['sebze', 'yag'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 230, protein: 3, carb: 15, fat: 18 },
    description: 'Zeytinyağlı, soğanlı patlıcan yemeği. Etsizdir; zeytinyağı ana enerji kaynağıdır.',
  },
  {
    name: 'Kuru fasulye',
    groups: ['protein', 'sebze'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 310, protein: 16, carb: 40, fat: 10 },
    description:
      'Baklagil klasiği. Bitkisel protein ve lif deposudur; pilavla birlikte tam bir protein oluşturur.',
  },
  {
    name: 'Nohut yemeği',
    groups: ['protein', 'sebze'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 300, protein: 14, carb: 38, fat: 10 },
    description: 'Sulu nohut yemeği. Kuru fasulye gibi lif ve bitkisel protein açısından zengindir.',
  },
  {
    name: 'Yeşil mercimek yemeği',
    groups: ['protein', 'sebze'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 260, protein: 14, carb: 34, fat: 8 },
    description: 'Yeşil mercimeğin sulu yemeği. Demir ve folat yönünden güçlü bir baklagildir.',
  },
  {
    name: 'Barbunya pilaki',
    groups: ['protein', 'sebze'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 270, protein: 12, carb: 35, fat: 9 },
    description: 'Zeytinyağlı barbunya. Sıcak da soğuk da yenen, lifli bir baklagil yemeğidir.',
  },
  {
    name: 'Türlü',
    groups: ['sebze'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 180, protein: 6, carb: 18, fat: 10 },
    description: 'Mevsim sebzelerinin bir arada piştiği karışık sebze yemeği. Çeşitlilik için birebirdir.',
  },
  {
    name: 'Kabak yemeği',
    groups: ['sebze'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 130, protein: 4, carb: 12, fat: 8 },
    description: 'Hafif ve sulu bir sebze yemeği. Kalorisi düşük, su içeriği yüksektir.',
  },
  {
    name: 'Ispanak yemeği',
    groups: ['sebze'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 150, protein: 6, carb: 12, fat: 9 },
    description:
      'Kıymalı ya da zeytinyağlı pişen ıspanak. Demir ve folat kaynağıdır; yanında yoğurtla klasikleşmiştir.',
  },
  {
    name: 'Taze fasulye',
    groups: ['sebze'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 160, protein: 4, carb: 15, fat: 10 },
    description: 'Zeytinyağlı ya da etli pişen yeşil fasulye. Lifli, hafif bir sebze yemeğidir.',
  },
  {
    name: 'Bamya',
    groups: ['sebze'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 140, protein: 4, carb: 14, fat: 8 },
    description: 'Küçük bamyaların domatesli sulu yemeği. Düşük kalorili ve lif açısından iyidir.',
  },
  {
    name: 'Dolma',
    groups: ['sebze', 'tahil'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 220, protein: 5, carb: 30, fat: 9 },
    description:
      'Biber/kabak gibi sebzelerin pirinçli iç ile doldurulması. Porsiyon 3-4 adet kabul edilir.',
  },
  {
    name: 'Sarma',
    groups: ['sebze', 'tahil'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 230, protein: 5, carb: 32, fat: 10 },
    description:
      'Asma yaprağına sarılan pirinçli iç. Porsiyon 5-6 adet kabul edilir; zeytinyağlısı etlisinden hafiftir.',
  },
  {
    name: 'Mantı',
    groups: ['tahil', 'protein', 'sut'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 450, protein: 18, carb: 55, fat: 17 },
    description:
      'Kıyma dolgulu minik hamurların yoğurt ve salçalı sosla buluşması. Doyurucudur; enerjisi yüksektir.',
  },
  {
    name: 'Karnabahar graten',
    groups: ['sebze', 'sut'],
    category: 'ana_yemek',
    measure: 'porsiyon',
    macros: { kcal: 220, protein: 10, carb: 15, fat: 14 },
    description: 'Beşamel sos ve kaşarla fırınlanan karnabahar. Sebzeyi sevdiren fırın yemeği.',
  },
  // Yan / karbonhidrat
  {
    name: 'Pirinç pilavı',
    groups: ['tahil'],
    category: 'yan',
    measure: 'porsiyon',
    macros: { kcal: 260, protein: 4, carb: 45, fat: 7 },
    description:
      'Tereyağı/sıvı yağ ile pişen beyaz pirinç. Hızlı enerji verir; tam tahıllara göre lifi azdır.',
  },
  {
    name: 'Bulgur pilavı',
    groups: ['tahil'],
    category: 'yan',
    measure: 'porsiyon',
    macros: { kcal: 220, protein: 6, carb: 40, fat: 5 },
    description:
      'Kırık buğdaydan yapılan pilav. Pirince göre daha fazla lif ve protein içerir, kan şekerini daha yavaş yükseltir.',
  },
  {
    name: 'Makarna',
    groups: ['tahil'],
    category: 'yan',
    measure: 'porsiyon',
    macros: { kcal: 300, protein: 10, carb: 55, fat: 5 },
    description:
      'Buğday irmiğinden yapılan klasik. Sosuna göre enerjisi çok değişir; sade hali orta düzeydedir.',
  },
  {
    name: 'Patates haşlama',
    groups: ['sebze'],
    category: 'yan',
    measure: 'adet',
    macros: { kcal: 130, protein: 3, carb: 29, fat: 0 },
    description:
      'Haşlanmış orta boy patates. Yağsız piştiği için patatesin en hafif hali; potasyum kaynağıdır.',
  },
  {
    name: 'Fırın patates',
    groups: ['sebze'],
    category: 'yan',
    measure: 'porsiyon',
    macros: { kcal: 220, protein: 4, carb: 40, fat: 5 },
    description: 'Fırında az yağla pişen patates. Kızartmaya göre belirgin şekilde daha hafiftir.',
  },
  {
    name: 'Kumpir',
    groups: ['sebze', 'sut'],
    category: 'yan',
    measure: 'adet',
    macros: { kcal: 550, protein: 15, carb: 70, fat: 23 },
    description:
      'Közlenmiş büyük patatesin kaşar ve çeşitli malzemelerle doldurulması. İçindekilere göre tam bir öğün olur.',
  },
  // Salata & yoğurt
  {
    name: 'Çoban salata',
    groups: ['sebze'],
    category: 'salata_yogurt',
    measure: 'kase',
    macros: { kcal: 90, protein: 2, carb: 8, fat: 6 },
    description:
      'Domates, salatalık, biber ve soğanın zeytinyağıyla buluşması. Sofraya renk ve lif katar.',
  },
  {
    name: 'Mevsim salata',
    groups: ['sebze'],
    category: 'salata_yogurt',
    measure: 'kase',
    macros: { kcal: 80, protein: 2, carb: 7, fat: 5 },
    description: 'Mevsim yeşillikleriyle hazırlanan karışık salata. Sos miktarı enerjisini belirler.',
  },
  {
    name: 'Roka salatası',
    groups: ['sebze'],
    category: 'salata_yogurt',
    measure: 'kase',
    macros: { kcal: 60, protein: 2, carb: 4, fat: 4 },
    description: 'Acımsı aromalı roka yaprakları; limon ve zeytinyağıyla servis edilir. Çok düşük kalorilidir.',
  },
  {
    name: 'Ton balıklı salata',
    groups: ['sebze', 'protein'],
    category: 'salata_yogurt',
    measure: 'kase',
    macros: { kcal: 220, protein: 20, carb: 8, fat: 12 },
    description: 'Yeşillik üzerine konserve ton balığı. Pratik, proteinli ve doyurucu bir öğün alternatifi.',
  },
  {
    name: 'Tavuklu salata',
    groups: ['sebze', 'protein'],
    category: 'salata_yogurt',
    measure: 'kase',
    macros: { kcal: 230, protein: 25, carb: 8, fat: 11 },
    description: 'Izgara tavuk parçalı bol yeşillikli salata. Protein + sebzeyi tek kasede toplar.',
  },
  {
    name: 'Yoğurt',
    groups: ['sut'],
    category: 'salata_yogurt',
    measure: 'kase',
    macros: { kcal: 120, protein: 7, carb: 9, fat: 6 },
    description:
      'Fermente süt ürünü; probiyotik, protein ve kalsiyum kaynağı. 1 kase ~200 g kabul edilir.',
  },
  {
    name: 'Cacık',
    groups: ['sut', 'sebze'],
    category: 'salata_yogurt',
    measure: 'kase',
    macros: { kcal: 90, protein: 5, carb: 7, fat: 4 },
    description: 'Yoğurt, salatalık ve nane karışımı. Sulandırılarak içilir ya da yemek yanında yenir.',
  },
  {
    name: 'Ayran',
    groups: ['sut'],
    category: 'salata_yogurt',
    measure: 'bardak',
    macros: { kcal: 90, protein: 4, carb: 6, fat: 5 },
    description: 'Yoğurdun su ve tuzla açılmış hali. Gazlı içeceklere sağlıklı bir alternatiftir.',
  },
  {
    name: 'Kefir',
    groups: ['sut'],
    category: 'salata_yogurt',
    measure: 'bardak',
    macros: { kcal: 110, protein: 7, carb: 9, fat: 5 },
    description:
      'Kefir taneleriyle fermente edilen içilebilir süt ürünü. Probiyotik çeşitliliğiyle bilinir.',
  },
  {
    name: 'Süt',
    groups: ['sut'],
    category: 'salata_yogurt',
    measure: 'bardak',
    macros: { kcal: 120, protein: 6.5, carb: 9.5, fat: 6.5 },
    description: 'Kalsiyum ve proteinin temel kaynağı. Değerler 1 bardak (~200 ml) tam yağlı süt içindir.',
  },
  // Meyve & kuruyemiş
  {
    name: 'Elma',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'adet',
    macros: { kcal: 90, protein: 0.5, carb: 23, fat: 0.3 },
    description: 'Lifli, pratik günlük meyve. Kabuğuyla yendiğinde lif kazancı daha yüksektir.',
  },
  {
    name: 'Muz',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'adet',
    macros: { kcal: 105, protein: 1.3, carb: 27, fat: 0.4 },
    description:
      'Potasyum deposu, hızlı enerji veren meyve. Spor öncesi/sonrası pratik bir atıştırmalıktır.',
  },
  {
    name: 'Portakal',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'adet',
    macros: { kcal: 70, protein: 1.5, carb: 17, fat: 0.2 },
    description: 'C vitamini klasiği kış meyvesi. Suyunu sıkmak yerine bütün yemek lifini korur.',
  },
  {
    name: 'Mandalina',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'adet',
    macros: { kcal: 45, protein: 0.8, carb: 11, fat: 0.2 },
    description: 'Küçük, kolay soyulan kış meyvesi. C vitamini kaynağıdır; kalorisi düşüktür.',
  },
  {
    name: 'Üzüm',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'avuc',
    macros: { kcal: 55, protein: 0.5, carb: 14, fat: 0.1 },
    description: 'Doğal şekeri yüksek tatlı meyve. 1 avuç ~80 g (küçük bir salkım) kabul edilir.',
  },
  {
    name: 'Karpuz',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'dilim',
    macros: { kcal: 75, protein: 1.5, carb: 18, fat: 0.4 },
    description: 'Yazın serinleten, %90\'ı su olan meyve. 1 dilim ~250 g kabul edilir.',
  },
  {
    name: 'Kavun',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'dilim',
    macros: { kcal: 70, protein: 1.5, carb: 16, fat: 0.4 },
    description: 'Hoş kokulu yaz meyvesi. Su oranı yüksek, kalorisi düşüktür; 1 dilim ~200 g.',
  },
  {
    name: 'Çilek',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'avuc',
    macros: { kcal: 35, protein: 0.7, carb: 8, fat: 0.3 },
    description: 'C vitamini ve antioksidan zengini; meyvelerin en düşük kalorililerinden (avuç ~100 g).',
  },
  {
    name: 'Kiraz',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'avuc',
    macros: { kcal: 50, protein: 0.8, carb: 12, fat: 0.2 },
    description: 'Antioksidan açısından zengin yaz meyvesi. 1 avuç ~80 g (10-12 adet) kabul edilir.',
  },
  {
    name: 'Şeftali',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'adet',
    macros: { kcal: 60, protein: 1.4, carb: 14, fat: 0.4 },
    description: 'Sulu ve lifli yaz meyvesi. A ve C vitamini sağlar.',
  },
  {
    name: 'Armut',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'adet',
    macros: { kcal: 100, protein: 0.6, carb: 27, fat: 0.2 },
    description: 'Lif oranı yüksek sonbahar meyvesi; sindirime dosttur.',
  },
  {
    name: 'Nar',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'adet',
    macros: { kcal: 140, protein: 2.5, carb: 33, fat: 2 },
    description: 'Antioksidan deposu kış meyvesi. Taneleriyle yendiğinde lif de sağlar.',
  },
  {
    name: 'Kuru kayısı',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'adet',
    macros: { kcal: 20, protein: 0.3, carb: 5, fat: 0 },
    description:
      'Kurutulunca şekeri yoğunlaşmış kayısı. Lif ve potasyum kaynağı; birkaç adet tatlı isteğini bastırır.',
  },
  {
    name: 'Hurma',
    groups: ['meyve'],
    category: 'meyve_kuruyemis',
    measure: 'adet',
    macros: { kcal: 65, protein: 0.4, carb: 18, fat: 0 },
    description:
      'Doğal şekeri çok yoğun kuru meyve. Tek adedi küçük bir tatlıya yakın enerji verir.',
  },
  {
    name: 'Ceviz',
    groups: ['yag', 'protein'],
    category: 'meyve_kuruyemis',
    measure: 'avuc',
    macros: { kcal: 195, protein: 4.5, carb: 4, fat: 19.5 },
    description:
      'Omega-3 açısından en zengin kuruyemiş. 1 avuç ~30 g (3-4 tam ceviz); küçük miktarı bile besleyicidir.',
  },
  {
    name: 'Badem',
    groups: ['yag', 'protein'],
    category: 'meyve_kuruyemis',
    measure: 'avuc',
    macros: { kcal: 175, protein: 6, carb: 6, fat: 15 },
    description: 'E vitamini ve sağlıklı yağ kaynağı. 1 avuç ~30 g (20-23 adet) kabul edilir.',
  },
  {
    name: 'Fındık',
    groups: ['yag', 'protein'],
    category: 'meyve_kuruyemis',
    measure: 'avuc',
    macros: { kcal: 190, protein: 4.5, carb: 5, fat: 18 },
    description: 'Tekli doymamış yağdan zengin kuruyemiş. 1 avuç ~30 g kabul edilir.',
  },
  {
    name: 'Leblebi',
    groups: ['protein'],
    category: 'meyve_kuruyemis',
    measure: 'avuc',
    macros: { kcal: 110, protein: 6, carb: 18, fat: 1.5 },
    description:
      'Kavrulmuş nohut. Kuruyemişlerin en az yağlısı; proteinli ve hafif bir atıştırmalıktır.',
  },
  // Atıştırmalık & fast food
  {
    name: 'Döner',
    groups: ['protein', 'tahil', 'fastfood'],
    category: 'atistirmalik',
    measure: 'porsiyon',
    macros: { kcal: 550, protein: 28, carb: 50, fat: 26 },
    description:
      'Ekmek arası ya da dürüm döner. Protein içerir ama ekmek ve yağla birlikte enerjisi yüksektir.',
  },
  {
    name: 'Lahmacun',
    groups: ['tahil', 'protein', 'fastfood'],
    category: 'atistirmalik',
    measure: 'adet',
    macros: { kcal: 300, protein: 12, carb: 40, fat: 10 },
    description:
      'İnce hamur üzerine kıymalı harç. Fast food içinde görece hafif kalır; yanında salata/ayranla dengelenir.',
  },
  {
    name: 'Pide',
    groups: ['tahil', 'protein', 'fastfood'],
    category: 'atistirmalik',
    measure: 'porsiyon',
    macros: { kcal: 650, protein: 25, carb: 85, fat: 22 },
    description:
      'Kaşarlı/kıymalı fırın pidesi. Bir porsiyon (1 pide) tam öğün enerjisi taşır; yarımı da doyurucudur.',
  },
  {
    name: 'Hamburger',
    groups: ['fastfood', 'protein', 'tahil'],
    category: 'atistirmalik',
    measure: 'adet',
    macros: { kcal: 500, protein: 25, carb: 40, fat: 26 },
    description:
      'Köfte, ekmek ve sos üçlüsü. Sos ve boyuta göre enerjisi hızla artar; patates eklemeden orta düzeydedir.',
  },
  {
    name: 'Pizza',
    groups: ['fastfood', 'tahil', 'sut'],
    category: 'atistirmalik',
    measure: 'dilim',
    macros: { kcal: 270, protein: 11, carb: 30, fat: 12 },
    description:
      'Hamur, sos ve peynirli fırın klasiği. Değerler orta boy 1 dilim içindir; malzemeye göre değişir.',
  },
  {
    name: 'Patates kızartması',
    groups: ['fastfood'],
    category: 'atistirmalik',
    measure: 'porsiyon',
    macros: { kcal: 340, protein: 4, carb: 42, fat: 17 },
    description:
      'Derin yağda kızaran patates. Kızartma yağıyla haşlamanın yaklaşık üç katı enerji taşır.',
  },
  {
    name: 'Tost',
    groups: ['tahil', 'sut'],
    category: 'atistirmalik',
    measure: 'adet',
    macros: { kcal: 350, protein: 14, carb: 40, fat: 15 },
    description: 'Kaşarlı klasik tost. Pratik bir ara öğündür; sucuklusu biraz daha enerjiktir.',
  },
  {
    name: 'Cips',
    groups: ['fastfood'],
    category: 'atistirmalik',
    measure: 'avuc',
    macros: { kcal: 160, protein: 2, carb: 15, fat: 10 },
    description:
      'Kızarmış patates dilimleri. Küçük avuç bile yoğun yağ ve tuz taşır; paket boyu yanıltıcıdır.',
  },
  {
    name: 'Çikolata',
    groups: ['tatli'],
    category: 'atistirmalik',
    measure: 'adet',
    macros: { kcal: 135, protein: 2, carb: 15, fat: 8 },
    description:
      'Değerler küçük boy (~25 g) bir çikolata içindir. %70+ bitter olanlar daha az şeker içerir.',
  },
  {
    name: 'Gofret',
    groups: ['tatli'],
    category: 'atistirmalik',
    measure: 'adet',
    macros: { kcal: 180, protein: 2, carb: 22, fat: 9 },
    description: 'Kremalı ince yufka katmanları. Küçük görünür ama şeker ve yağ yoğunluğu yüksektir.',
  },
  {
    name: 'Bisküvi',
    groups: ['tatli', 'tahil'],
    category: 'atistirmalik',
    measure: 'adet',
    macros: { kcal: 45, protein: 0.7, carb: 7, fat: 1.7 },
    description: 'Çay yanının klasiği. Tek adedi küçüktür ama sayı hızla artabilir.',
  },
  {
    name: 'Kek',
    groups: ['tatli', 'tahil'],
    category: 'atistirmalik',
    measure: 'dilim',
    macros: { kcal: 230, protein: 3, carb: 32, fat: 10 },
    description: 'Ev yapımı sade kek dilimi (~60 g). Kakaolu/kremalı çeşitlerde enerji artar.',
  },
  {
    name: 'Kurabiye',
    groups: ['tatli', 'tahil'],
    category: 'atistirmalik',
    measure: 'adet',
    macros: { kcal: 95, protein: 1, carb: 12, fat: 5 },
    description: 'Un, yağ ve şekerin klasiği. Tereyağlı olduğundan tek adedi bile enerjiktir.',
  },
  // Tatlılar
  {
    name: 'Baklava',
    groups: ['tatli'],
    category: 'tatli',
    measure: 'dilim',
    macros: { kcal: 250, protein: 3, carb: 28, fat: 14 },
    description:
      'Şerbetli tatlıların şahı; yufka, fıstık/ceviz ve şerbet. 1 dilim özel günlerde keyifle yenir.',
  },
  {
    name: 'Sütlaç',
    groups: ['tatli', 'sut'],
    category: 'tatli',
    measure: 'kase',
    macros: { kcal: 260, protein: 7, carb: 45, fat: 6 },
    description:
      'Sütlü pirinç tatlısı. Süt içerdiği için şerbetlilere göre protein ve kalsiyum katkısı vardır.',
  },
  {
    name: 'Künefe',
    groups: ['tatli', 'sut'],
    category: 'tatli',
    measure: 'porsiyon',
    macros: { kcal: 450, protein: 10, carb: 50, fat: 24 },
    description:
      'Tel kadayıf arasında sıcak peynir, üzerinde şerbet. Tatlıların en enerjiklerinden; paylaşmak iyi fikir.',
  },
  {
    name: 'Kazandibi',
    groups: ['tatli', 'sut'],
    category: 'tatli',
    measure: 'porsiyon',
    macros: { kcal: 300, protein: 7, carb: 48, fat: 9 },
    description: 'Altı mühürlenmiş sütlü muhallebi tatlısı. Sütlü tatlıların orta enerjilisidir.',
  },
  {
    name: 'Dondurma',
    groups: ['tatli', 'sut'],
    category: 'tatli',
    measure: 'porsiyon',
    macros: { kcal: 200, protein: 4, carb: 24, fat: 10 },
    description: 'Değerler 2 top (~100 g) içindir. Meyveli sorbeler sütlü çeşitlerden daha hafiftir.',
  },
  {
    name: 'Revani',
    groups: ['tatli'],
    category: 'tatli',
    measure: 'dilim',
    macros: { kcal: 280, protein: 4, carb: 42, fat: 11 },
    description: 'İrmikli şerbetli kek tatlısı. Şerbeti bolca çektiği için şekeri yüksektir.',
  },
  {
    name: 'Lokma',
    groups: ['tatli'],
    category: 'tatli',
    measure: 'adet',
    macros: { kcal: 75, protein: 1, carb: 11, fat: 3 },
    description: 'Kızarıp şerbete atılan minik hamur topları. Tek adedi küçük ama toplamı hızla büyür.',
  },
  // İçecekler
  {
    name: 'Çay',
    groups: [],
    category: 'icecek',
    measure: 'bardak',
    macros: { kcal: 0, protein: 0, carb: 0, fat: 0 },
    description:
      'Şekersiz demli çay neredeyse kalorisizdir. Her küp şeker bardağa ~20 kcal ekler.',
  },
  {
    name: 'Türk kahvesi',
    groups: [],
    category: 'icecek',
    measure: 'fincan',
    macros: { kcal: 5, protein: 0.3, carb: 0.5, fat: 0.1 },
    description: 'Telveli geleneksel kahve. Sade içildiğinde kalorisi yok denecek kadar azdır.',
  },
  {
    name: 'Filtre kahve',
    groups: [],
    category: 'icecek',
    measure: 'bardak',
    macros: { kcal: 5, protein: 0.3, carb: 0, fat: 0 },
    description:
      'Sade filtre kahve kalorisizdir; süt, krema ve şuruplar eklendikçe içecekten tatlıya yaklaşır.',
  },
  {
    name: 'Taze sıkılmış portakal suyu',
    groups: ['meyve'],
    category: 'icecek',
    measure: 'bardak',
    macros: { kcal: 90, protein: 1.4, carb: 21, fat: 0.4 },
    description:
      'C vitamini kaynağı; ancak posasız hali meyvenin lifini kaybettirir ve şekeri hızlı verir.',
  },
  {
    name: 'Kola',
    groups: ['tatli'],
    category: 'icecek',
    measure: 'bardak',
    macros: { kcal: 105, protein: 0, carb: 26, fat: 0 },
    description:
      'Gazlı şekerli içecek; 1 bardak (~250 ml) ~5 küp şekere denk gelir. Şekersiz versiyonları kalorisizdir.',
  },
  {
    name: 'Gazoz',
    groups: ['tatli'],
    category: 'icecek',
    measure: 'bardak',
    macros: { kcal: 100, protein: 0, carb: 25, fat: 0 },
    description: 'Şekerli gazlı içecek. Enerjisi tamamen eklenmiş şekerden gelir.',
  },
  {
    name: 'Meyve suyu (hazır)',
    groups: ['tatli'],
    category: 'icecek',
    measure: 'bardak',
    macros: { kcal: 110, protein: 0.5, carb: 26, fat: 0.2 },
    description:
      'Hazır meyve nektarı çoğunlukla şeker ilavelidir; meyvenin lifini taşımaz. Şekerce gazoza yakındır.',
  },
  {
    name: 'Smoothie',
    groups: ['meyve'],
    category: 'icecek',
    measure: 'bardak',
    macros: { kcal: 150, protein: 3, carb: 32, fat: 1.5 },
    description:
      'Blenderdan geçirilmiş meyve (bazen yoğurt/süt) karışımı. Meyve suyundan farkı posasını korumasıdır.',
  },
]

const trLower = (s: string) => s.toLocaleLowerCase('tr-TR')

/** Ada göre (Türkçe küçük harf duyarlı) seed besin bulur */
export function findSeedFood(name: string): SeedFood | undefined {
  const q = trLower(name.trim())
  return SEED_FOODS.find((f) => trLower(f.name) === q)
}

export function searchSeedFoods(query: string, limit = 6): SeedFood[] {
  const q = trLower(query.trim())
  if (!q) return []
  const starts = SEED_FOODS.filter((f) => trLower(f.name).startsWith(q))
  const includes = SEED_FOODS.filter(
    (f) => !trLower(f.name).startsWith(q) && trLower(f.name).includes(q),
  )
  return [...starts, ...includes].slice(0, limit)
}
