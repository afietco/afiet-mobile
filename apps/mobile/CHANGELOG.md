# Changelog — afiet mobil

Mobil uygulamanın sürüm geçmişi. Web'den bağımsız sürümlenir
(kaynak gerçeklik `apps/mobile/package.json` + `app.json`, tag'ler
`mobile-vX.Y.Z`). Build numarası EAS tarafından uzaktan otomatik artar
(`appVersionSource: remote` + `autoIncrement`).

## [Yayınlanmadı]

- 🔧 Sofra kurma ekranı toparlandı. Kaydet düğmesi artık ad alanının yanında, adı yazar yazmaz beliriyor; eskiden menünün tamamının altında kalıyordu. Besinler de tek tek listelenmiyor: "Menümden seç" ayrı bir ekran açıyor, orada arayabiliyor ve kaydırdıkça devamını görebiliyorsun. Sofra ekranında yalnız sofrandakiler duruyor.

- 🔧 İkram kesesi uygulamadan kalktı. Haftalık mesaj sayacı, dökümü ve boş kese ekranı gitti; artık sohbette geri sayan bir şey yok. Afi ücretsiz kalmaya devam ediyor.

- ✨ Sini ve Demi artık afiet+ ile açılıyor. Premium'un olmadığında sohbet yerine karakterin kendi tanıtımı geliyor: maskotu, ne işe yaradığı ve afiet+ düğmesi. Kilit ikonu ve fiyattan ibaret bir kapı değil, önce tanışıyorsun.

- ✨ Artık birini uygulamadan sofrana çağırabiliyorsun. Ligde ya da arkadaş listesinde birinin profilini aç, "Soframa davet et" de: davet o kişinin ziline düşüyor, oradan katılıyor. Kod paylaşmaya, ekran görüntüsü göndermeye gerek yok. Zaten bir sofrası olan kişi davet edilemiyor; sofran yoksa düğme hiç çıkmıyor. Reddetmek kimseye bildirilmiyor.

- ✨ Profiller artık boş açılmıyor. Ligden birine dokunduğunda unvanını, seviyesini, grubunu, yaptığı sporları ve ne zamandır afiet'te olduğunu görüyorsun. Boy, hareket seviyesi ve günün enerjisi eskisi gibi yalnız arkadaşlara ve aynı gruptakilere açık kalıyor: kimliğe herkes bakabilir, bedene bakamaz.

- ✨ Sıralamada herkesin adının altında grubu yazıyor, seviye halkası da artık dolu: halka kişinin ömür boyu tecrübesine göre doluyor, o ayın puanına göre değil.

- ✨ Lig artık kendini anlatıyor. Başlıktaki soru işareti "Lig nasıl işler?" sayfasını açıyor: beş sofra ve neyi anlattıkları, ayın nasıl geçtiği, puanın nasıl kazanıldığı ve en çok merak edilen soru, yani kötü bir ayın ne alıp ne alamayacağı. Cevap: seviyen, unvanın ve verinin hiçbiri gitmiyor.

- ✨ Sıralamadaki herkes artık açılabiliyor. Bir satıra dokununca o kişinin profili geliyor, oradan arkadaş ekleyebiliyorsun. Herkesin yüzü kendi sofrasının baharat rengiyle çevrelenmiş bir halkanın içinde, seviyesi de halkanın üstünde duruyor.

- 🔧 Lig ekranından ikram kesesi kartı ve afiet+ satırı kalktı. Lig artık kaç mesaj kazandığını değil, nerede olduğunu ve merdivenin nasıl işlediğini anlatıyor.

- ✨ Alt menünün ortasında artık Afi duruyor. Dokununca uygulamaya gelme sebeplerin çıkıyor: besin ekle, ölçüm ekle ve üç sohbet. Besin ve ölçüm hangi sekmedeysen orada açılıyor, sekme değiştirmiyor.

- ✨ Sini ve Demi'nin yüzü var. Beslenme sohbeti artık Sini (yer sofrasının tepsisi), destek sohbeti Demi (demlik); ikisi de kendi çizimleriyle sohbet ekranlarında, giriş kartlarında ve alt menüde görünüyor. Afi kase olarak kalıyor: ev sahibi, gün boyu, ücretsiz.

- 🐛 Bir besnin ölçüsünü değiştirmek artık kalorisini bozmuyor. Porsiyonla ölçülen bir yemeğe "3 kaşık" yazıldığında gün toplamına üç tam porsiyon giriyordu, çünkü hesap ölçüyü hiç okumuyordu. Artık bilinen bir besinde yalnız kendi ölçüsü ve gram seçilebiliyor, gram seçince değerler katalogdaki gram karşılığıyla ölçekleniyor. Ölçü değiştirince miktar da birlikte çevriliyor: bir porsiyon gramda o porsiyonun ağırlığı oluyor. Geçmişte çevrilemeyen bir ölçüyle yazılmış kayıtlar artık uydurma bir sayı üretmek yerine "makrosu bilinmeyen" sayılıyor.

- ✨ Sofranı seçmek artık doğrudan yazmıyor: miktarları bugüne göre ayarlayabileceğin, istemediğini çıkarabileceğin bir adım açılıyor. Aynı sofra her gün aynı boyda değil.

- ✨ Besin arama ekranındaki liste artık senin kendi kaydından geliyor. "Afi'nin senin için seçtikleri", o öğünde son bir ayda en sık yazdıkların; henüz yeterince geçmişin yoksa eksiği katalogdan tamamlanıyor. Liste ekran açılır açılmaz açık geliyor.

- 🔧 Bilmediğimiz bir besni anlatmak artık tek bir yerde. "Afi'ye anlat" ayrı bir forma ve ayrı bir asistana gitmiyor, doğrudan "Afi ile ekle" ekranını açıyor; besin bilgisi yazmadan ilerleyememe engeli kalktı.

- 🐛 "Bunu Afi çözsün" ile gelen ve katalogda olmayan bir besin, ekranı soluk bir kutuyla kapatıp "Kaydet ve devam et" düğmesini kapalı bırakıyordu. Artık besin grubu tahtası açık geliyor: bir gruba dokunmak yetiyor.

- 🔧 "Afi ile ekle" boş açıldığında ne yapacağın ekranda yazıyor: fotoğrafını çek ve galeriden seç artık iki büyük kart. Alttaki çubuk olduğu gibi duruyor.

- 🔧 Afi yazmayı bıraktığın anda konuşuyor. Tepkisi iki saniye yerine dörtte üç saniyede geliyor; "bu besin listede yok" paneli ise bilerek iki saniyede kalıyor, yarım yazılmış bir kelimeye verilmiş bir hüküm gibi durmasın diye.

- ✨ Öğün seçme ekranındaki boşluk doldu: hazırlanmakta olan diyet programları kartı ve sofrası olmayanlara sofra kurmayı anlatan bir kart eklendi.

- ✨ Zil artık kazandığın her şeyi taşıyor. Görev ödülleri, üç günlük seri, onuncu öğün, ilk ölçüm ve hafta kapanışı bildirime dönüşmese bile zilde birikiyor: bildirim göndermemek artık haberi kaybetmek değil, sessizce beklemek demek. Hatırlatmalar zile girmiyor; vakti geçmiş bir dürtme ertesi sabah sitem gibi okunur.

- 🔧 Zilde okundu artık kalem başına. Zili açmak hepsini okumuş saymıyor, dokunduğun kalem okunuyor; hepsini birden geçmek istersen "Hepsini okundu say" duruyor. Bir kaleme dokununca ilgili ekrana da gidiyorsun. Okunmuşlar "Daha önce" başlığı altına iniyor, yani geçmiş kaybolmuyor ama yenilerin arasında kalabalık yapmıyor.

- 🔧 İşi bitmemiş bir bildirim okunmuş sayılmıyor. Ödül bildirimine dokunup ödülü almadan çıkarsan kalem "Yeni"de kalmaya devam ediyor; alınca kendiliğinden yerine oturuyor. Aynı ödül her gün yeniden hatırlatıldığında zil otuz satır biriktirmiyor, tek satır kalıp tarihini tazeliyor.

- ✨ afiet artık mağaza yorumunu tek bir anda istiyor: bir afiyet haftasını kapattığında, kutlamayı kapattıktan sonra. İlk haftanda hiç sormuyor, sorduktan sonra da aylarca susuyor. Kayıt tutarken, hata alırken ya da bir şeyin ortasındayken karşına çıkmıyor.

## [0.12.0] — 2026-08-11

- ✨ afiet+ geldi. Satılan şey Afi'nin iki kişisel asistanı: diyetisyen ve psikolog, üçüncü mesajdan sonra. Kayıt tutmak, denge tabağı, ritim, lig ve fotoğraftan tanıma herkese açık kalmaya devam ediyor ve paranın istendiği ekran bunu açıkça yazıyor. Vaat "sınırsız" değil, uygulamanın kendi gösterdiği sayı: kesene haftada 60 mesaj daha, sofran yükseldikçe artarak.

- 🔧 Premium ekranına giden iki kapı artık arkasında bir şey yoksa açılmıyor. Mağazası bağlanmamış bir kurulumda ya da henüz hazırlanmamış bir platformda insanlar fiyatsız bir ekrana gidiyor, satın al düğmesi de basınca düşüyordu. Aboneliği olan birine de artık satış yapılmıyor.

- 🐛 Satın alma sonrası çıkan teşekkür kartı hâlâ kesenin bitmediğini ve asistanların istediğin kadar yanında olduğunu söylüyordu. Ödemeyi yeni yapmış birinin okuduğu tek ekran orasıydı. Artık uygulamanın hesapladığı sayıyı söylüyor.

- ✨ İlk hafta artık yalnız başına geçmiyor. İlk kaydından sonraki günlerde sırayla üç davet geliyor: ikinci gün için bir çağrı, üçüncü gün henüz denemediysen ölçüm, yedinci gün ise o hafta kaç gün sofranı yazdığın. Zaten yaptığın bir şey varsa o adım atlanıyor. Uzun süredir uğramadıysan ayda bir "sofran seni bekliyor" diyen tek bir davet var, o kadar.

- 🔧 Bildirimler artık nerede olduğunu biliyor. İlk haftandaysan öğün hatırlatması hiç gelmiyor, çünkü henüz hatırlatılacak bir alışkanlık yok; bir süredir uğramadıysan da gelmiyor, çünkü sessizleşen birine sessizleştiğini söylemek yardım değil. Arada, alışkanlık kurarken haftada en fazla iki tane. Arkadaşlarından gelen selamlar bu kuralların hiçbirine takılmıyor.

- 🔧 "Davetler" diye beşinci bir bildirim anahtarı eklendi. Hatırlatmaları kapatan biri ilk hafta rehberliğini de kaybetmesin diye ayrı duruyor.

- ✨ Bildirimler artık yalnız eksik olanı söylemiyor. Afiyet haftanı kaçırdığın haftalarda bile "bu hafta 3 gün sofranı yazdın" diyen bir özet geliyor, üç gün üst üste kaydettiğinde, ilk ölçümünü girdiğinde, onuncu kaydını yaptığında ve kendi besinini eklediğinde birer kutlama var. Tamamlayıp almadığın bir görev ödülü varsa o da hatırlatılıyor. Kilometre taşları yarım saat bekliyor, çünkü o anda zaten uygulamadasın ve ekranda duran şeyin bildirimi gereksiz. Hiçbir hafta "0 gün yazdın" demiyor: söylenecek olumlu bir şey yoksa sessiz kalıyor.

- 🔧 "Afiyet haftası" anahtarı "Kutlamalar" oldu ve bütün kutlamaları kapsıyor. Beş ayrı anahtar aramak zorunda kalmayasın diye tek kategori.

- 🔧 Premium ekranı artık gerçek mağazaya bağlı. Fiyatlar, dönem uzunluğu ve varsa ilk yıl indirimi doğrudan App Store ve Google Play'den geliyor; uygulamanın içinde yazılı tek bir fiyat yok, çünkü mağazadaki fiyat değiştiğinde ekrandaki sayının onunla birlikte değişmesi gerekiyor. Satın alma yarıda bırakılırsa hata gösterilmiyor (vazgeçmek hata değil), gerçekten bir şey ters giderse ekranda tek cümlelik açıklama çıkıyor. Aboneliği olan biri uygulamayı silip yeniden kurduğunda "Satın alımlarımı geri yükle" hakkını geri veriyor.
- 🔧 Bir bildirime dokunduğunda bu artık kayda geçiyor. Şimdiye kadar yalnızca bildirimin ulaşıp ulaşmadığını biliyorduk, açılıp açılmadığını değil; hangi bildirimin işe yaradığı sorusunun cevabı yoktu. Kayıt cihazda bekliyor ve ağ olur olmaz gönderiliyor, yani metroda açılan bir bildirim de sayılıyor: kaybolan bir açılma, ilgilenen birini ilgilenmiyor gösterirdi. Kullanıcıya görünen hiçbir şey değişmiyor.

## [0.11.1] — 2026-08-03

- 🐛 Uygulamanın komple kapanmasına yol açan bir çökme giderildi. Menüden Yapay Zeka Merkezi'ne girerken ve Afi yazarken sohbet listesini açıp kapatırken uygulama tamamen kapanabiliyordu. Sebebi ikisinde de aynıydı: kayan panelin kapanma animasyonu bittiğinde uygulamanın iki ayrı motoru arasında bir çağrı yapılıyordu ve o çağrı bazen boşa düşüyordu. Panelin kapanışı artık o çağrıyı hiç yapmıyor; görünen davranış birebir aynı.

## [0.11.0] — 2026-08-03

- ✨ Profiline mevsim rafı geldi: her ayı hangi sofrada bitirdiğin kalıcı olarak duruyor. Sofran daralabildiği için ligin ay sonunu aşan bir parçası yoktu; artık geçmişin siliniyor değil. Raf bilerek nötr: yalnız hangi sofrada bitirdiğini yazıyor, çıktın ya da düştün demiyor.

- 🔧 Lig ekranı artık kendini anlatıyor ve yer kaybetmiyor. Sofranın Afi ile konuşma hakkını kaç mesaja çevirdiği (ve bir üst sofrada kaça çıkacağı) kartın ortasında duruyor; ligin ne işe yaradığı sorusunun cevabı buydu ve dipnottaydı. Yanına premium yerleşti: sofran ne olursa olsun haftada 60 mesaj daha. Yükselme bölgesine kaç puan kaldığı yazıyor. Sıralamada artık yirmi beş kişi değil bir üstün, sen ve bir altın görünüyor; tamamı tek dokunuşla açılan kendi sayfasında. Ayın puanının nereden geldiği kaynak kaynak dökülüyor. En altta katlanır bir bölümde neyin kaç puan getirdiği tam tabloyla var: afiyet günü 20, afiyet haftası 60, öğün kaydı 2, su hedefi 5, ölçüm 10, karşılıklı selam 1. Her satır tavanını da söylüyor, çünkü tavanı söylemeyen bir tablo yanlış vaat verir: elli öğün kaydeden biri yüz puan beklerdi, altı alır.

- ✨ Geçmişte bir güne dokununca artık o günün sayıları da duruyor: enerjisi, protein/karbonhidrat/yağ gramları ve her öğünün kendi enerjisi. Sayılar Bugün ekranındakiyle aynı yerden geliyor, yani iki ekran asla farklı şey söylemiyor. Besin değeri bilinmeyen kayıt varsa kaç tane olduğu yazıyor, çünkü onlar toplama girmiyor. Kaydı olmayan günde hiç gösterilmiyor: boş halkalar "o gün hiçbir şey yedin" demek olurdu.

- ✨ Bilgilerim'e "Değerler" sekmesi geldi: son 30 gününün enerjisi, makro dağılımı, denge takvimi ve hangi besin grubunu hangi öğünde yediğin. Enerji tek tek günler yerine 7 günlük ortalamayla okunuyor, çünkü günlük iniş çıkış çoğunlukla pazar alışverişi ve iştah. Makrolar hedefin yüzdesi olarak değil, enerjinin nasıl paylaşıldığı olarak gösteriliyor: dengeli bir günün geçtiği aralık zeminde duruyor, senin payın onun üstünde bir nokta. Aralığın dışında olmak bir hata değil, bilgi. Kayıt olmayan günler sıfır sayılmıyor; ortalamalar yalnız gerçekten kayıt olan günlerden çıkıyor. Besin değeri bilinmeyen kayıtların sayısı da yazıyor, çünkü onlar toplama girmiyor.

- ✨ Mağazada yeni bir sürüm çıktığında uygulama artık bunu kendisi söylüyor. Açılışta afiet.co'ya kısa bir soru gidiyor ve iki şey oluyor: yeni bir sürüm varsa bir kez nazikçe haber veriliyor ("Şimdi değil" dersen aynı sürüm için üç gün boyunca bir daha sormuyor), çok eski bir sürümdeysen mağazaya götüren tek düğmeli bir ekran karşılıyor. İkincisi ancak bir sürümün gerçekten çalışamaz hâle geldiği durumlar için; kayıtlarına hiçbir şey olmuyor, güncelledikten sonra her şey yerinde. Kontrol açılışı bekletmiyor: karar diskteki son cevaptan anında veriliyor, taze cevap arkada geliyor. iOS ve Android ayrı ayrı yönetiliyor, çünkü iki mağaza aynı anda yayına almıyor.

- 🔧 Açılış hızlandı. Uygulama her açılışta 2000 besinlik kataloğu ilk kare çizilmeden önce baştan sona okuyordu; oysa Bugün ekranının o listeyle hiçbir işi yok. Katalog artık yalnızca gerçekten besin arayan ekranlar açıldığında okunuyor. Yazı tipleri de artık uygulamanın içine gömülü geliyor, açılışta ayrıca yüklenmesi beklenmiyor. Oturum bilgisi ve son gördüğün ekranın hatırlanan hâli aynı anda okunuyor, arka arkaya değil. Bunların toplamı: açılışta hazırlanan kod miktarı üçte birine indi ve açılış artık yeşil ekrandan doğrudan içeriğe geçiyor, arada iskelet görünmüyor.

- ✨ Üç asistan da artık seni tanıyor. Sistem zamanla senin hakkında anladıklarını kısa bir özete damıtıyor (ne yediğinin dökümü değil, nasıl biri olduğunun özeti) ve bu özet üçüne de gidiyor. Yani destek sohbetinde söylediğin bir şeyi beslenme sohbeti de biliyor, her seferinde baştan anlatman gerekmiyor. Ham yemek kayıtların yine yalnız Afi ve beslenme sohbetine gidiyor; destek sohbeti o özeti okuyor, kayıtlarını değil. Yapay Zeka Merkezi ekranı hangisinin neyi gördüğünü güncel haliyle anlatıyor.

- 🔧 Sohbetlerin artık hesabına bağlı, yalnız cihazına değil: telefonu değiştirsen de duruyorlar. Destek sohbeti için ayrıca onayını soruyoruz, çünkü orada konuşulanlar daha hassas; onayını vermeden o sohbet açılmıyor ve istediğin an geri çekebiliyorsun. Bir sohbeti sildiğinde hem cihazından hem sunucudan gidiyor. Destek sohbetini daha önce açmış olsan da yeni metni bir kez daha göreceksin, çünkü eskisi başka bir şeye onay veriyordu.

- 🔧 Uygulama açılışta artık iskelet göstermiyor. Şimdiye kadar her açılışta her şey sıfırdan indiriliyordu; Bugün ekranı tek başına dokuz ayrı istek atıyor, sen de o sırada gri kutulara bakıyordun. Artık son gördüğün hâli hatırlıyor ve ekranı hemen onunla açıyor, tazelemeyi arkada yapıyor. Bir şey değiştiyse sessizce yerine geçiyor, değişmediyse hiçbir şey oynamıyor. Şebeke yokken de uygulama çalışıyor: kayıtların, ölçümlerin, görevlerin ve ritmin yerinde duruyor. Ertesi sabah ilk açılışta doğal olarak "bugün" boş oluyor, çünkü gerçekten boş; artık bunu beklemeden görüyorsun. Hatırlanan hiçbir şey bir haftadan eski olmuyor ve çıkış yaptığında tamamen siliniyor.
- 🔧 Bir bardak su ya da bir öğün kaydettiğinde uygulama artık her şeyi baştan indirmiyor, yalnız o kaydın gerçekten değiştirdiği yerleri tazeliyor. Çok kayıt tutan en çok bekleyen kişi olmaktan çıkıyor.

- ✨ İkram kesesi geldi: Afi ile ve diğer iki asistanla yazışmanın haftalık bir hakkı var artık, bir mesaj bir kese. Kese her pazartesi tazeleniyor, hafta içinde kalan devretmiyor ve boyutunu ligdeki kademen, unvanın ve o hafta karşılıklı selamlaştığın kişiler belirliyor. Yani seviye atlamak ve sofrada yükselmek ilk kez somut bir şey veriyor: her hafta Afi ile daha çok konuşmak. Kese Bugün'ün üstünde, sohbet başlığında, profilindeki Yolculuğun kartında ve Lig ekranında görünüyor; dokununca nereden ne kadar geldiğinin dökümü açılıyor. Kayıt tutmak kese kazandırmıyor, kese de kayıt tarafında hiçbir şey satın almıyor: fotoğraftan besin tanıma ve besin önerisi keseden düşmüyor, onlar eskisi gibi çalışıyor. Kesen dolduğunda sohbet kapanmıyor, yazı alanı duruyor; Afi haftanın dolduğunu söylüyor ve ne zaman tazeleneceğini yazıyor.

- 🐛 Grubum sekmesi bomboş açılıyordu: başlık "Grubum" ve "Dengeyi birlikte kovalayın" duruyor, altında hiçbir şey yok. Sekmeyi kapatıp açmak da uygulamayı kapatıp açmak da düzeltmiyordu. Sebep içerideki giriş animasyonuydu; animasyon çalışmadığında sardığı her şey görünmez ilk karesinde kalıyor. Grup kurmanın ve grup aramanın uygulamadaki tek kapısı o kutunun içinde olduğu için, henüz grubu olmayan biri grup özelliğine hiç ulaşamıyordu. Aynı tuzağın kurulu olduğu üç yer daha kapatıldı: Arkadaşlarım'da gelen isteği kabul etme, arkadaş listesi ve ilk kayıt kutlaması. Sonuncusu en kötüsüydü, kapatılamayan bir kutlamanın iki çıkış düğmesi de görünmez kalabiliyordu.

- 🐛 Kayıt ekranındaki Apple düğmesi "Apple ile Giriş Yap" yazıyordu; kayıt olurken giriş yapıyormuş gibi görünüyordu. Artık kayıt ekranında "Apple ile Kaydol", giriş ekranında "Apple ile Giriş Yap" yazıyor.
- ✨ Apple ile kaydolurken "E-postamı Gizle"yi seçtiysen hesap ekranındaki e-posta satırının altında bunu söyleyen sakin bir satır duruyor; dokununca gerçek adresini ekleyebiliyorsun. Apple bu seçimi yalnızca bir kez soruyor ve bir daha sormuyor, o yüzden adresi buradan değiştirmek tek yol. Gizli adresle kalmak istersen hiçbir şey değişmiyor, hiçbir yer kilitlenmiyor.
- 🐛 Apple ya da Google ile girenlerin e-posta adresi yalnızca ilk kayıtta yazılıyordu. Sağlayıcı tarafındaki adresin sonradan değiştiyse afiet eskisini tutuyordu; artık her girişte tazeleniyor.

- ✨ Besin eklerken ne yediğini tek cümlede yazabiliyorsun: "4 yumurtalı omlet 1 dilim ekmek biraz çeçil peynir". Yazdığın şeyin cümle olduğu anlaşılınca listenin üstünde "Bunu Afi çözsün" beliriyor; Afi besinleri ayırıyor, söylediğin miktarları okuyor ve her birini tek tek onayına sunuyor. Söylemediğin miktarı uydurmuyor, "sen söyle" diyor. Katalogda olmayan bir besin senin yazdığın gibi kaydediliyor ve Menüm'e de ekleniyor, bir dahakine aramada çıkıyor.

- 🐛 Besin ararken "peynir" yazınca beyaz peynir, kaşar, lor ve tulum çıkmıyordu; liste tamamen "Peynirli omlet", "Peynirli kete" gibi kelimeyle başlayanlarla doluyordu. Arama zaten kelimenin ortasına da bakıyordu, sıralama görünen satır sayısına göre kurulmuyordu. Artık aradığın şey listede.

- ✨ Sohbette artık konuşarak yazabiliyorsun. Gönder'in solundaki mikrofona basınca söylediklerin cihazda yazıya çevrilip yazı alanına düşüyor; duyulduğu gibi ekranda beliriyor, bitirince istediğin kelimeyi düzeltip gönderiyorsun. Ses kaydı hiçbir yere gitmiyor, saklanmıyor: asistanlar yazı okuyor, o yüzden sesli mesaj yerine yazıya çevirme var.
- ✨ Sohbete fotoğraf ekleyebiliyorsun. Yazı alanının solundaki fotoğraf düğmesi kendi küçük menüsüyle "çek mi, galeriden mi" diye soruyor. Şimdilik sohbet ucu yalnız yazı taşıdığı için Afi fotoğrafı aldığını söylüyor ama üzerine konuşamıyor; fotoğraftan besin tanıma eskisi gibi Besin Ekle akışında çalışıyor. Yanında yazı da yazdıysan ona normal cevap veriyor.
- ✨ Artık her asistanla birden fazla sohbetin olabiliyor. Sohbeti her açtığında tertemiz bir sayfa açılıyor; sağ üstteki kalem de yeni bir tane başlatıyor, yanındaki menü bugüne kadarkileri listeliyor: birine geri dönebiliyor, birini yukarıda sabitleyebiliyor, istemediğini silebiliyorsun. Sohbetler ilk cümlene göre adlanıyor ve yalnız yazışınca kaydediliyor, yani ekranı açıp vazgeçmek listeye satır eklemiyor. Eski tek sohbetin ilk sohbet olarak listede duruyor.
- ✨ Menüdeki "Afi" ve "Destek sohbeti" satırlarının yerine Yapay Zeka Merkezi geldi: üç asistanın ne yaptığını, hangisinin neyi görüp neyi görmediğini (destek sohbetine yemek kaydın gitmiyor), yazışmaların nerede durduğunu ve neyin teşhis olmadığını anlatıyor. Üçüne de oradan giriliyor.
- 🔧 Vücudum'daki tanışma kartı artık Bugün'deki Afi notu gibi tek tek dönüyor: önce yapılacaklar, sonra tamamlananlar. Dört satır birden, ekranın en uzun kartını bir cümleyle bir çubuktan çıkarıyordu.
- 🔧 Vücudum'daki "Kişisel destek uzmanım" kartı sayfanın en üstüne alındı ve sayfanın kendi moruna döndü.
- 🐛 Sohbette mikrofona basınca uygulama kapanıyordu: iOS, mikrofon izni açıklaması olmayan bir uygulamayı izin isterken anında öldürüyor. Açıklama üç ayrı sebepten binary'e hiç ulaşmamıştı (native tarafın yeniden üretilmemesi, ses eklentisinin kendi hatası ve galerinin "mikrofon kapalı" ayarı); üçü de düzeltildi, izin metinleri artık konuşma tanımayı anlatıyor.
- 🔧 "Sohbeti temizle" kalktı. Bitmiş bir sohbeti silmek yerine yenisini açıyorsun; silmek istediğini de listede adıyla siliyorsun.
- 🔧 Bugün panosunda Afi sohbeti suyun hemen altına taşındı ve yeşil bir zemin aldı; en altta, iki durum satırının arkasında duruyordu. Vücudum ile Görevlerim de yer değiştirdi.
- 🔧 Bugün'ün en üstündeki profil kartının tamamı artık profili açıyor ve sağında bir ok var. Önceden yalnız avatarın kendisi dokunuluyordu, yani kartın neresine bastığına göre ya profil açılıyordu ya hiçbir şey olmuyordu.
- 🔧 Beslenme'deki sohbet kartı artık "Kişisel beslenme uzmanım" diyor ve yeşil zeminde duruyor. Vücudum'un altında da "Kişisel destek uzmanım" kartı var; ilk günden itibaren orada, çünkü konuşmak istemek tanışmanın bitmesini beklemiyor.
- 🔧 Menüm'de Sofralarım en üste geçti, kaydettiğin besinler altta ilk altı satırla açılıyor; gerisi tek dokunuşla geliyor. Uzayan besin listesi sofraları ekranın çok altına itiyordu.
- 🔧 Enerji ve makro kartındaki öğün satırlarında besin sayısı adın altından yanına geçti: dört öğün de doluyken kart gereksiz uzuyordu.
- 🔧 Hamburger menü açılıp kapanırken kayıyor. Panel görünmezken dokunuşları yutmasın diye animasyon kaldırılmıştı; şimdi gizli hâli ekran dışında duruyor ve kapanır kapanmaz hiçbir dokunuşu almıyor, yani yarım kalan bir animasyon bile kapıyı kapatmıyor.
- 🔧 Afiyet ritmin kartı en fazla iki geçmiş hafta gösteriyor, altında Bilgilerim'e giden bir satır var. Liste her hafta bir satır uzuyordu.
- 🐛 Alt sayfalar arka arkaya açılıp kapandığında ekranın altına takılı kalıyordu: Bilgilerim'de günleri, grubunda kişileri gezerken en çok görüleni buydu. Kapanma animasyonu bitmeden yeniden açılan bir sayfa artık kendini yukarı çekiyor.

## [0.10.0] — 2026-08-01

- 🔧 Sohbet cilası: bir sohbet başka bir sohbeti önerdiğinde (mesela Afi seni beslenme sohbetine yönlendirdiğinde) cevabın altında tek dokunuşluk bir geçiş çipi beliriyor. Sohbet kullanımı artık anonim olay olarak ölçülüyor: hangi sohbet açıldı, kaç mesaj gitti, cevap kaç saniyede geldi; yazdıkların hiçbir zaman ölçüme girmiyor.
- ✨ Sohbet geldi: Afi ile serbest sohbet, haftanı değerlendiren beslenme sohbeti ve yemekle ilişkin için destek sohbeti. Girişler Bugün panosunda, Beslenme ekranında ve menüde. Üçü de gerçek Afi ajanlarına bağlı ve cevaplar kelime kelime akıyor; Afi bugünkü kayıtlarını, beslenme sohbeti son haftanın dengesini bilerek konuşuyor, destek sohbetine ise hiçbir yemek verisi gitmiyor. Yazışmaların yalnızca cihazında saklanıyor ve istediğin an silebiliyorsun; destek sohbeti ilk açılışta ne olduğunu ve ne olmadığını açıkça söylüyor, 112 her zaman bir dokunuş uzağında.
- ✨ Kullanıcı adı kalktı, yerine arkadaş kodu geldi. Herkesin sunucunun ürettiği, değişmeyen 8 karakterlik bir kodu var (grup davet kodlarıyla aynı aile). Arkadaş Ekle'de kodun en üstte duruyor, tek dokunuşla paylaşıyorsun; arkadaşının kodunu yazınca doğrudan onu buluyor, istersen adıyla da arayabiliyorsun. Profil ve Hesap'taki kullanıcı adı satırları koda dönüştü; ad seçme, "bu ad alınmış" derdi ve @'li aramalar tarihe karıştı.
- 🔧 Giriş ve kayıt artık yalnız e-postayla. "E-posta veya kullanıcı adı" ikiliği bitti; şifre sıfırlama da e-postayla çalışıyor.
- 🐛 Kayıt olurken iOS'un güçlü şifre önerisi ve sonrasında isim adımının üstüne düşen "Save Password?" penceresi artık çıkmıyor. Girişte kayıtlı şifreni otomatik doldurma aynen çalışmaya devam ediyor.
- 🔧 Yeni hesapta e-posta adresin artık profiline de yazılıyor (e-postayla kayıtta formdaki adres, Apple/Google'da hesabındaki adres). Önceden bu alan hep boş kalıyordu.

- 🔧 Uygulama artık oturum bazlı davranış telemetrisi topluyor: oturum başlangıcı/bitişi, ekran geçişleri (nereden nereye, kaç saniye), alt sayfa açma/kapama ve giriş denemeleri kendi events tablomuza gidiyor. Kuyruk cihazda saklanıyor; çevrimdışı anlar ve uygulama kapanışları veri kaybettirmiyor. Kişisel veri (isim, e-posta, yemek notu) gönderilmiyor.

## [0.9.0] — 2026-07-31

- 🔧 Yön seçiminden "Daha güçlü hissetmek istiyorum" kaldırıldı: sorusu spor ve aktivite tarafına düşüyor, oysa burada kurulan şey sofra. Bunu daha önce seçtiysen yönün "Kilom değişmeden daha iyi hissetmek istiyorum"a çevrildi; kalan dördün en yakını o, çünkü kiloyu sabit tutup daha yüksek protein aralığını isteyen öteki yön.
- 🔧 Yönünü değiştirdiğinde artık bugünden geçerli oluyor. Önceden yalnız ilk seçim anında etki ediyor, sonraki değişiklikler gelecek pazartesiyi bekliyordu; aynı beş cümle, aynı dokunuş, birinde bugün birinde dört gün sonra iş görüyordu ve bunu ancak kartların altındaki küçük gri yazıdan anlayabiliyordun.
- 🐛 Herkese açık bir gruba katıldığında arama sayfası açık kalıyor, satır da dönmeye devam ediyordu: katılma çalışmış, arkadaki ekran değişmiş ama görünen her şey olmamış gibi duruyordu. Sayfa artık kapanıyor, satır da "Katıldın" diyerek kendi başına duruyor.
- ✨ Grubu olmayanlar için "ID ile katıl" yerine "Grup ara" geldi: herkese açık grupları görüp katılabiliyorsun. Davet kodu akışı silinmedi, o listenin en tepesine taşındı; kod, kodu olana lazım.
- ✨ Grup kurarken kimlerin katılabileceğini de seçiyorsun: davetle ya da herkese açık. Sunucu bunu en baştan kabul ediyordu ama uygulama hiç göndermiyordu, yani buradan kurulan her grup gizli oluyordu.

- 🔧 Besin eklerken "Menümden seç" ve "sık yazılanlar" artık ikisi birden, ikisi de kapalı duruyor. Önceden menün varsa sık yazılanları hiç göremiyordun; ikisi birden açık olsa da arama kutusunu klavyenin altına itiyorlardı. Kapalı hâl ne olduğunu ve kaç besin olduğunu söylüyor, dokununca açılıyor.
- 🔧 Bir öğünün içindeki besinlerde artık kalem ikonu var; düzenlenebildikleri çöp kutusunun yanından görünüyor.
- ✨ Afiyet haftası henüz olmayanlara ritim kartında bir kez "afiyet günü ve afiyet haftası ne demek, bakalım mı?" diye soruluyor. Açtığında ya da kapattığında bir daha çıkmıyor.
- 🐛 Kapattığın alt sayfa bir iki saniye sonra kendi kendine geri açılıyordu. Besin eklemeyi kaydetmeden kapattığında en çok görüleni buydu. Kapalı bir alt sayfa artık ne içeriğini tutuyor (içindeki sayaçlar, klavye dinleyicisi ve sorgular kapandıktan sonra da çalışmaya devam ediyordu) ne de kendi kendine yukarı çıkabiliyor.
- 🐛 İlk açılışta besin ekleme ekranı bomboş açılıyordu: alt sayfa "Kahvaltı · Besin Ekle" diyor, Afi köşede duruyor ama altında arama kutusu bile yok. Sebep içerideki giriş animasyonuydu; animasyon çalışmadığında sardığı her şey görünmez ilk karesinde kalıyor ve adım yüklü ama ulaşılamaz oluyor. Aynı sebeple riskli olan üç yer daha kapatıldı: "Seni tanıyalım" kurulum adımları, ilk açılış rehberi ve hamburger menü paneli. Menüdeki panel görünmezken ekranın dörtte üçünü kaplayıp dokunuşları yutuyordu.
- 🐛 Besin ekleme ekranı boş menüyle de açılıyordu. Yeni bir hesapta kaydedilmiş besin olmadığı için, klavye açık ve Afi tepede beklerken ekranda tek bir soluk cümle kalıyordu: ne dokunulacak bir şey vardı ne de katalogda ne olduğunu görmenin bir yolu. Artık seçtiğin öğüne göre o öğünde en çok yazılan besinler listeleniyor, yani ilk kaydını tek dokunuşla yapabiliyorsun.
- 🔧 Afi besin ararken artık her harfte telaşlanmıyor. Yazdığın her tuşta "bir saniye, listeye bakıyorum" deyip duruyordu; şimdi yazman bitene kadar sessiz bekliyor. Alttaki öneri listesi eskisi gibi anında güncelleniyor.
- ✨ Afi o gün eklediğin bir besni artık adıyla anıyor: "Bugün akşam yediğin sulu köfte harikaydı". Dokununca o besnin detayı açılıyor. Beslenme'de Afi'nin söyledikleri bugüne kadar hep eksikler üzerineydi; bu, sofrada olanla ilgili olanı.
- 🔧 İlk kaydının kutlaması artık "bu hafta 1/5" demiyor. O an daha ilk günün bitmemişken beş hedefi anons etmek, yapılan biri değil borçlu kalınan dördü gibi okunuyordu. Artık sadece "İlk afiyet günün" diyor.
- 🔧 Enerji ve makro kartındaki öğün/besin sayfaları artık kartı uzatmıyor. Yatay bir kart en uzun sayfası kadar uzar, yani üstünde çok besin olan bir gün makro çubuklarını boş bir sütunun tepesinde bırakıyordu. Listeler artık ilk beş satırı gösterip gerisini sayıyor.
- ✨ Enerji ve makro kartı artık yana kaydırılıyor. Aynı günün üç okunuşu yan yana: sayılar, o sayıların geldiği öğünler ve o öğünleri oluşturan besinler. İlk sayfa kartın bugüne kadar gösterdiğinin aynısı.
- 🔧 Menüm'e besin eklerken Afi'ye anlatmak ve fotoğraf çekmek artık iki gerçek yol. Eskiden küçük bir "Doldur" düğmesi ve altında etiketsiz iki ikon vardı; üstelik Afi'ye yalnız besnin adı gidiyordu. Artık adın altına "nasıl bir şey" diye kısa bir satır yazabiliyorsun ve o satır da Afi'ye gidiyor, yani "börek" değil "börek (ıspanaklı, ev yapımı)" soruluyor.
- ✨ Bir öğünün içindeyken artık besin ekleyebiliyor ve ekleneni düzenleyebiliyorsun. Öğüne dokununca açılan sayfada tek yapılabilen şey silmekti: "1 dilim yerine 2 olacaktı" diyen biri sayfayı kapatıp ekleme düğmesini bulup zaten cevapladığı öğün sorusuna baştan cevap vermek zorundaydı. Satıra dokunmak artık düzenliyor, altındaki düğme de aynı öğüne bir besin daha ekliyor.
- ✨ Besin Rehberi'ne tür süzgeci eklendi (çorbalar, ana yemekler, tatlılar…) ve süzgeçler artık düşünülen sırada: önce ne zaman, sonra tür, sonra besin grubu, sonra beslenme türü.
- ✨ Besin Rehberi artık gezilebiliyor. Besin grubu, öğün ve beslenme türü (vejetaryen, vegan, glutensiz, laktozsuz) süzgeçleri geldi; grup süzgeçleri kaç besin olduğunu da söylüyor. Listede her besnin emojisi ve bir ölçüsünün kaç gram geldiği yazıyor.
- ✨ Besin detayında artık kataloğun bildiği her şey var: bir ölçünün gramı, lif, sıvı katkısı, hangi öğünlere yakıştığı, uyumlu olduğu beslenme türleri, arama eşanlamlıları ve "canın çekerse şu da yakışır" dengesi. Bunların hepsi verideydi ama hiçbiri gösterilmiyordu.
- ✨ Sofra geldi: birlikte yediğin besinleri bir araya getiriyorsun ve besin eklerken hepsi tek dokunuşla sofrana geliyor. Menüm'de kuruluyor, ne zaman kurulduğunu (kahvaltı, öğle, akşam, ara) sen söylüyorsun ve besin eklerken yalnız o öğünde çıkıyor. Söylemezsen her öğünde çıkıyor.
- ✨ Menün boşken artık sadece "menün boş" demiyor: sık yenen altı besni tek dokunuşla ekleyebiliyorsun. Senin adına sessizce eklemiyoruz, dokunmak sana kalıyor.
- 🔧 Afiyet ritmin kartı sıfır haftayken "Toplam 0 hafta" demiyor. Kuralı henüz kimsenin anlatmadığı bir eksiği duyurmak yerine, başlığın yanına bir soru işareti kondu: ritim, afiyet günü ve afiyet haftasının ne demek olduğunu Afi anlatıyor. "Bu hafta hedef 5 gün" satırı kaldırıldı.

- ✨ Görevlerim'de her göreve dokunulabiliyor. Liste sana ne kadar yaklaştığını söylüyordu ama ne saydığını hiç anlatmıyordu: "Sofranda on farklı besin" aynı yumurtayı on kez yazınca ilerlemiyor, "on afiyet selamı" günde bir kişiye bir kez sayılıyor, afiyet günlerinin arka arkaya olması gerekmiyor. Artık göreve dokunduğunda Afi bunu kendi anlatıyor; süren görevlerde kalan miktar ve ödül, bitenlerde ise ne için kazandığın yazıyor.
- ✨ Görev detayında o görevi ilerleten işe götüren bir düğme var. Yemek görevlerinde doğrudan Bugün'e dönüp besin ekleme sayfasını açıyor, ölçüm görevinde Vücudum'a, grup görevlerinde Grubum'a, kendi yemeklerini öğretme görevinde Menüm'e götürüyor.
- 🔧 "Görevi al" düğmesi artık "Görevi tamamla" diyor.

- 🔧 Bir aksaklık yaşandığında uygulama artık suçu sana atmıyor. Sunucularımızda sorun varken her ekran "bağlantını kontrol et" diyordu; bağlantısı gayet iyi olan insanlar çıkış yapıp, başka hesap deneyip, uygulamayı silip yeniden kuruyordu. Hiçbiri işe yaramazdı. Artık durum sayfamıza bakıp "sorun sende değil" diyor, neyin etkilendiğini söylüyor ve sayfaya bağlantı veriyor. Ayrıca uygulamaya geri döndüğünde kendi kendine yeniden deniyor, yani biz toparlandığımız anda ekran da toparlanıyor.

- 🐛 Tanışma rehberinde takılıp kalanlar kurtarıldı. Rehber, hesap açıldıktan iki gün sonra ekrandan kayboluyor ama alt menüyü kilitli bırakıyordu: sekmeler ölü, ekranda hiçbir açıklama yok ve üç adımı sonradan tamamlasan bile kurtulmanın yolu yoktu. Ayrı olarak, rehber işaret edeceği kartı bulamadığında ekranı karartıyor ama üstüne hiçbir şey çizmiyordu; geriye dokunulamayan karanlık bir sayfa kalıyordu. Artık rehber hiçbir şeyi kilitlemiyor, işaret edeceğini bulamadığında kenara çekiliyor ve her adımında "Şimdi değil" ile kapatılabiliyor. Güncelleyen herkes açılışta kurtulur.

- ✨ Sekmeler artık kaydırarak da geçiliyor. Bugün, Beslenme, Vücudum ve Grubum tek bir şerit gibi: parmağını yana sürükleyerek aralarında dolaşabiliyorsun, alt menüdeki seçim de parmağınla birlikte kayıyor.
- ✨ Alt menü cam bir yüzeye dönüştü. İçerik artık menünün altından akıp geçiyor ve menü Apple'ın yeni tasarım dilindeki gibi arkasındakini seçiyor. iPhone'unuz destekliyorsa gerçek cam, desteklemiyorsa buzlu cam, Android'de ise saydam bir yüzey olarak görünüyor.

- 🐛 Aşağıdan açılan sayfalar alt menünün altında kalıyordu. Sayfa, açıldığı sekmenin içinde çizildiği için alt menünün üstünde kalan yere sıkışıyor, kararan zemin de orada bitiyordu: menü aydınlık ve dokunulabilir kalıyor, uzun akışlarda ise düğmeler menüyle çakışıyordu. Artık her sayfa uygulamanın en üst katmanında açılıyor: menüyü kapatıyor, ekranın tamamını kullanıyor ve açıkken sekme değiştirilemiyor. Sekme yine de değişirse (ör. bildirime dokunmak) sayfa arkada kalmak yerine kapanıyor. Aynı katman menüyü, kutlama ekranlarını ve profil kartını da taşıyor, böylece kutlama açık bir sayfanın üstüne çıkabiliyor.
- 🐛 Yazı boyutunu büyütenlerde kurulum akışı tıkanıyordu. Telefonun yazı boyutu ayarı büyükken tanışma rehberinin "Devam" düğmesi, ilk kurulumdaki "Devam" ve ilk kayıt ekranındaki "Hesabımı oluştur" ekranın alt kenarının altında kalıyor, kaydırma da olmadığı için akış orada bitiyordu. Rehber ekranı kapladığı için geri dönmek de mümkün olmuyordu. Artık bu ekranlarda içerik kayıyor ve düğmeler her yazı boyutunda yerinde duruyor. Yazı çok büyükken Afi metne yer açmak için kenara çekiliyor, alt menüdeki yazılar ise iki satıra sığıyor.

- 🔧 Uygulama artık boşta kalmayı biliyor, telefonun daha az ısınması ve pilin daha yavaş inmesi gerekiyor. Afi ekranda dururken hiç durmadan yeniden çiziliyor, üstüne notu her değiştiğinde baştan kuruluyordu. Bir sekmeden çıktığında da o sekme arkada çalışmaya devam ediyordu: Afi'si oynuyor, sayacı dönüyor, verisini tazeliyordu. Artık bakmadığın hiçbir şey kıpırdamıyor, Afi de her seferinde yeniden kurulmak yerine sadece pozunu değiştiriyor. Gördüğün hiçbir şey değişmedi.
- 🐛 Afi fotoğrafa bakamadığında hep aynı şeyi söylüyordu. Artık ne olduğunu söylüyor: günlük fotoğraf hakkın dolduysa bunu söylüyor ve yarını işaret ediyor, kare çok büyük geldiyse daha yakından çekmeni istiyor. "Bağlanamadım" yüzü yalnız gerçekten bağlanamadığında çıkıyor.

## [0.8.4] — 2026-07-29

- 🐛 Alt sayfalar kapanmıyordu: ölçümün kaydediliyor, kaydediliyor ama sayfa "Kaydediliyor…" yazısıyla ekranda kalıyordu. 0.8.3'te açılma sorunu giderilirken kapanma yolu düşmüştü.

## [0.8.3] — 2026-07-29

- 🐛 Vücut bilgileri alt sayfası dokununca açılmıyordu: rehberin son adımında Vücudum satırı, Profil'de ise Vücut bilgileri hiçbir şey yapmıyor gibi görünüyordu. Sayfaya "açıl" denen an ölçülmesinden önceye düşüyor, komut da düşüyordu ve bir daha tekrarlanmıyordu.
- 🐛 "Seni tanıyalım" akışında Devam düğmesi ekranın alt kenarından taşıyordu. Adımlar artık kendi yükseklikleri kadar yer kaplıyor: kısa bir adımda düğmeler hemen soruların altında, en uzun adımda (on altı spor) liste kendi içinde kayıyor ve düğmeler yine görünüyor.

## [0.8.2] — 2026-07-29

- 🐛 "Seni tanıyalım" akışı boş açılıyordu: sorular hiç görünmüyor, Devam düğmesi sönük kalıyor ve akış kapanmadığı için uygulamayı kapatıp açmak da kurtarmıyordu. Adımların yerleştiği alan yüksekliğini alt sayfadan alamıyordu, o yüzden sıfır yükseklikle çiziliyordu.
- 🔧 Kurulum alt sayfaları artık kapatılabiliyor. Akışın ortasında yanlışlıkla çıkılmasın diye kapalı tutuluyordu; bir şey ters gittiğinde bu kullanıcıyı kapana kıstırıyor. Akış Bugün'den yeniden açılıyor.

## [0.8.1] — 2026-07-28

- ✨ Yenilikler ekranı geri geldi: güncellemeden sonra bir kez kendiliğinden açılıyor ve o sürümde ne geldiğini anlatıyor. Menüdeki sürüm satırından istediğin zaman yeniden açabilirsin. Yeni kurulumda çıkmıyor.
- 🐛 Sekme değiştirirken ekranın boş kalması giderildi. Sekme sahneleri arasındaki çapraz geçiş, ekranı yüklenmiş ama görünmez bırakabiliyordu; geçiş kaldırıldı, alt menüdeki kapsül animasyonu duruyor. Ayrıca her sekme artık bir hata ekranıyla korunuyor: bir şey ters giderse boş beyaz alan yerine Afi'nin "Bu sayfayı açamadım" ekranı ve tekrar deneme çıkıyor.
- 🐛 "peynir" arayınca gerçek peynirler gelmiyordu. Katalogda peynir geçen 48 besin var ama yalnız birkaçı kelimeyle başlıyor, ve sıralama o birkaçını başa alıp bütün listeyi dolduruyordu; Beyaz peynir, Kaşar peyniri, Krem peynir kaç harf yazarsan yaz görünmüyordu. Artık kelime başı da sayılıyor ve baştaki grup listenin tamamını kaplayamıyor.
- 🐛 Apple ya da Google ile kaydolurken kullanıcı adı alanı boş diye ilerlenemiyordu. Sosyal giriş tek dokunuşluk yol olsun diye var; kullanıcı adını sonradan Profil'den koyabiliyorsun. E-posta ile kayıtta hâlâ isteniyor.
- 🐛 Kurulum adımlarında son seçenek Geri/Devam düğmelerinin altında kalıyordu.
- 🐛 Görevlerim'de "Görevi al" başarısız olursa hiçbir şey söylenmiyordu; düşen istekle hiç kaydedilmemiş dokunuş aynı görünüyordu. Artık söyleniyor ve liste tazeleniyor.
- 🐛 Yeni hesapta herkese açık gruplar hiç görünmüyordu. İstek düşünce bölüm tamamen gizleniyordu, yani "getiremedim" ile "hiç grup yok" ayırt edilemiyordu. Artık bölüm duruyor ve tekrar deneyebiliyorsun.
- 🐛 Bir işin sonunda klavye açık kalıp sonraki ekranı örtüyordu (kutlama ekranı sayı tuşlarının arkasında kalıyordu). Artık alt sayfa kapandığında klavye de kapanıyor.
- ✨ Bir besin kaydettikten sonra aynı öğüne bir besin daha ekleyebiliyorsun; öğünü yeniden seçmek gerekmiyor.
- ✨ Kurulumdaki "Seni tanıyalım" akışı artık tüm ekranı kaplıyor, alt menü altında görünmüyor.
- ✨ Yönünü ilk kez seçtiğinde bugünden geçerli oluyor; sonraki değişiklikler yine gelecek pazartesi başlıyor.
- ✨ Diyetisyen Afi ibaresi öğün panelindeki karttan Beslenme'nin tepesindeki Afi mesajlarına taşındı ve yalnız senden bir şey istenmediği anlarda çıkıyor.
- 🔧 Bugün'de tamamlanmış görevin varken Görevlerim satırının tamamı yeşile dönüyor; grubun yoksa kapı "Gruba katıl" diyor.
- 🔧 Makro kartındaki "Değerler yaklaşıktır" satırı ile Besin Rehberi ve Menüm kartlarının alt yazıları kaldırıldı.

## [0.8.0] — 2026-07-28

- ✨ Makro hedeflerin artık senin vücudunla hesaplanıyor. Mezura ölçünü girdiysen yağsız kütlen üzerinden (Katch-McArdle), girmediysen eskisi gibi. Protein kaloriden değil yağsız kütleden ölçekleniyor, yağın bir tabanı var, karbonhidrat kalandan geliyor ve hareket düzeyi tek bir çarpan değil aralık. Beslenme'deki kart aynı kart, arkasındaki hesap değişti; protein sayısı eskisinden düşük çıkabilir.
- 🔧 Kart seni az tanıdığında da susmuyor artık. Cinsiyet, yaş, boy ve kilo yetiyor: mezura yoksa da, yön seçmediysen de gerçek bir aralık veriyor ve ne kadar emin olduğunu ayrıca söylüyor. Önceden bu durumda "Referans hazırlanıyor" yazıp bekletiyordu.
- ✨ Kurulumda Afi bir şey daha soruyor, hareket düzeyinden hemen sonra: "Ölçülerini neye göre kurayım?" Beş yanıt var ("Daha hafif hissetmek istiyorum", "Kilom değişmeden daha iyi hissetmek istiyorum", "Olduğum yerde iyiyim", "Daha güçlü hissetmek istiyorum", "Önce bir düzen kurayım") ve dokunduğun an seçilmiş oluyor. Böylece ölçülerin ilk günden sana göre. Sonradan değiştirmek için Vücudum'da "Yönüm" kartı var; seçim gelecek pazartesi geçerli oluyor ve bunu tek bir satırda sakince söylüyor.
- ✨ Vücudum'un en tepesinde "Afi seni %60 tanıyor" göstergesi: eksik veriyi ceza dili kurmadan davet ediyor. Her eksik satır bir kapı, hiçbiri kırmızı bir işaret değil. Beta'da var olmayan hiçbir madde listede yok, yani %100 gerçekten ulaşılabilir. Altında "Yönüm" ve "Sayılarla" yan yana iki kart duruyor.
- 🔧 Hedef kilo sorulmuyor, gösterilmiyor; "şu tarihte şu kiloda olursun" denmiyor. Motor bunları üretebilecek olsa da ekranın göreceği yerde durmuyorlar.
- 🔧 Güvenlik sınırları öneri değil, kod seviyesinde sert kapı: kadında 1200, erkekte 1500 kcal altına inilmiyor; haftalık değişim vücut ağırlığının %1'ini geçmiyor; 18 yaş altında hedef üretilmiyor, yalnız denge dili kalıyor; hamilelik ve emzirme beyanında açık verilmiyor; böbrek rahatsızlığı beyanında yüksek protein önerilmiyor. Riskli örüntüde hedef geri çekiliyor ve profesyonel destek öneriliyor.
- 🐛 Uzun alt sayfaların tepesi kırpılıyordu: tutamaç, başlık ve Kapat düğmesi ekranın dışında kalabiliyordu. Yükseklik sınırı pencereye göre ölçülüyordu ama sekmeli ekranlarda sayfanın kabı alt menü kadar daha kısa, bu yüzden hesap eksiye düşüyordu. Bir sayfanın kendi başlığını kaybetmesi için içeriğinin uzun olması yetiyordu.
- 🔧 Vücudum'daki ayrı "veri" kartı kalktı; sayılar "Sayılarla" kartından tam ekran açılıyor ve enerji ile makro bloğu o sayfanın en üstünde duruyor. /veri bağlantısı çalışmaya devam ediyor (bildirimler oraya derin bağlantı kurabiliyor).
- ✨ Besin eklemek artık tek bir düğmeden yürüyen üç adımlı bir akış: önce öğününü seçiyorsun, sonra besini buluyorsun, sonra tabağını onaylıyorsun. Onay kutusu yok, seçmek onaylamak demek; her adımda geri dönebiliyorsun ve Afi adım adım yanında, her adımda duruşunu değiştirerek eşlik ediyor. Aynı akış Bugün'deki beslenme kartından da açılıyor, iki sayfa artık birebir aynı davranıyor.
- ✨ Afi, Beslenme sayfasının başında da konuşuyor. Bugün'deki not kartının beslenmeye özel hâli: sofran boşsa çağırıyor, bir besin grubu açıkta kaldıysa hatırlatıyor, tabağın dengeliyse kutluyor.
- ✨ Öğün hücresine dokununca o öğünün içi açılıyor: ne yediğin, tek tek çıkarma ve geri alma. Diyetisyen Afi için de yerini ayırdık; henüz hazır değil, "Yakında" olarak duruyor.
- ✨ Listede olmayan bir besin artık elle tanımlanmıyor. Afi "bu besin listede yok" diyor ve iki gerçek yol bırakıyor: fotoğrafını çek ya da Afi'ye anlat. Adın altına besin bilgisini yazdığında "Afi doldur" açılıyor; grup, ölçü ve miktar ancak Afi doldurduktan sonra düzenlenebiliyor, böylece hiçbir kayıt boş değerle sofraya girmiyor. Afi'nin doldurduğu besin menüne de kaydediliyor, bir dahakine aramada çıkıyor.
- 🔧 Besin ararken klavye artık yazdığın alanın ve sonuçların üstüne binmiyor.
- 🔧 Kalabalıklaşan "Son eklenenler" yığını kaldırıldı; yerine derli toplu "Menümden seç" geldi. Kaç besin kaydetmiş olursan ol liste aynı boyda duruyor.
- 🔧 Öğünler kartı yarı yüksekliğine indi: üç satırlık kutucuklar tek satırlık şeritlere dönüştü, sayı köşede küçük bir rozet olarak duruyor. Dokunma alanları küçülmedi.
- 🔧 Besin Rehberi ve Menüm kısayolları ritim kartının üstüne alındı; ikisi de besin verisine açılan kapı olduğu için öğünlerin yanında duruyorlar.
- 🐛 Aradığın şey listedeki bir besinle birebir aynı yazıldığında öneri satırı kayboluyordu. Artık kaybolmuyor, en üstte "aradığın tam bu" işaretiyle duruyor.
- ✨ Afi'nin poz ve hareket dağarcığı ikiye katlandı. Artık arama boş çıktığında mercekle bakıyor, bağlantı koptuğunda bulutun altında bekliyor, fotoğrafını çekerken vizörden bakıp analiz sürerken düşünüyor, besini tanıyınca onaylıyor. Afiyet selamı, haftalık ritim, seviye atlama ve unvan anlarının da artık kendi sahnesi var.
- ✨ Lig kademelerinin her biri kendi baharatıyla geldi: Tuz sofrasında kristaller, Nane'de yaprak, Kekik'te dal, Sumak'ta salkım, Safran'da altın haleli teller. Kademeni renk tonundan değil, sofrandaki baharattan tanıyorsun.
- ✨ Seviye atladığında ve yeni bir unvan açtığında Afi artık kutluyor. Daha önce bu anlar sessizce geçiyordu.
- ✨ Afi'ye dokunulabiliyor: dokununca ezilip geri açılıyor ve hafifçe titreşiyor.
- 🔧 Boş ekranlar ve hata ekranları birbirinden ayrıldı. Arama boşluğu, bağlantı hatası, ritim beklentisi ve sosyal sessizlik daha önce hep aynı yüzle karşılanıyordu; artık her biri kendi anlatımıyla geliyor. Grup açılmadığında da ayrım var: üyeliğin sona ermişse bu bir cevap, bağlantı koptuysa ayrı bir durum.
- 🔧 Afi'nin hareketleri marka galerisindeki tasarımıyla aynı genliğe getirildi. Cihazda yaklaşık üç kat abartılı oynuyorlardı; zıplama, süzülme ve buhar artık tasarlandığı gibi.
- 🐛 Kutlama konfetisi geri geldi. Aynı ölçek sorunu yüzünden konfeti ve kabarcıklar Afi'nin çevresinden fırlayıp kadrajın dışında kalıyordu; artık kutlama sahnesinde duruyorlar.
- 🔧 Sheet ve kutlama açılışlarında Afi birden belirmek yerine yerleşiyor, gölgesi de onunla birlikte geliyor.
- 🔧 Afi'nin göründüğü ekranlar ekran okuyucuya anlamlı biçimde tanıtıldı (önceden yalnız bir ekranda vardı).
- ✨ Afi artık rakamına göre konuşuyor. Su için 3 bardakla 13 bardak aynı cümleyi
  almıyor: başlangıç, yarıyı geçme, iki bardak kaldı, son bardak ve tamamlandı
  ayrı ayrı söyleniyor. Tabak için de öyle: tek grup kaldıysa "neredeyse tam",
  iki grup kaldıysa ikisi de adıyla anılıyor. Ve tamamlanan şeyler artık
  susmuyor; suyun bittiğinde Afi bunu söylüyor.
- ✨ Afi vücut ölçülerini de hatırlıyor: hiç ölçüm yoksa bir kez giresin diye
  çağırıyor, ölçümün üzerinden bir hafta geçtiyse tazelemeyi öneriyor. Gece
  hiçbiri sorulmuyor, kartta "Ölçüm ekle" kısayolu çıkıyor.
- 🐛 Türkçe büyük "İ" harfinin noktası Afi notunda kırpılıyordu ("İki" yerine
  "Iki" görünüyordu). Nunito'da İ'nin noktası diğer tüm harflerden belirgin
  yukarıda duruyor ve sıkı satır yüksekliği onu kesiyordu.

- 🔧 Bugün'deki selamlama kartı sadeleşti: profil avatarın artık ismin solunda,
  gün filigranı da kartın sağ köşesine yaslandı.
- 🔧 Bugün'ün alt bölümü tek bir panoya dönüştü. Altı ayrı kutu (Ligim,
  Görevlerim, Vücudum, Su, Menüm, Grubum) aynı kılıkta duruyordu; dokunduğun
  ölçer, seni çağıran durum ve düz bir kapı aynı ağırlıktaydı. Artık hepsi tek
  yüzeyde birer satır, değeri sağda. Su satırı hâlâ elinin altında (çubuk ve
  −/+ orada), hazır görevin olduğunda Görevlerim satırı kendi içinde yeşile
  dönüp nabız atıyor. Hiçbir bağlantı kaybolmadı: Menüm ve Grubum panonun son
  satırını paylaşıyor.

- 🐛 Bir gruba katıldığında, grup kurduğunda ya da birine "afiyet olsun"
  dediğinde Bugün'deki Görevlerim kartı, seviye halkan ve Ligim kartı
  güncellenmiyordu. Sunucu görevi ve tecrübeyi anında işliyordu ama uygulama
  bunu ancak sen bir öğün/su/ölçüm kaydettiğinde ya da uygulamayı yeniden
  açtığında fark ediyordu. Artık grup hareketleri de bu ekranları tazeliyor.

- 🐛 Sekmeler arası geçişte boş bir sayfada takılı kalma giderildi. Beslenme ve
  Grubum sekmeleri, verisi gelmediğinde ya da istek hiç sonuçlanmadığında
  çıkışı olmayan bir yükleme iskeletinde kalıyordu; sekme değiştirip geri gelmek
  de bunu temizlemiyordu, çünkü ekran açık kalıyor. Artık ikisi de (ve profil
  kapısı da) 10 saniye sonra "Bağlantı kurulamadı, tekrar dene" ekranına
  düşüyor. Beslenme'de başarısız olan istek artık sessizce yutulmuyor.

- ✨ Bugün'de, beslenme kartının hemen altında Afi artık günü okuyup karşılık
  veriyor: sabah selam veriyor, sofran boşken davet ediyor, tabakta eksik kalanı
  ve suyu hatırlatıyor, tatlı ağır bastığında yargısızca söylüyor, ritmini
  kutluyor, beş grup tamamlanınca seviniyor, gece uyuyor. O an doğru olan ne
  varsa hepsini sırayla gösteriyor: her not kendi pozu, hareketi ve rengiyle
  geliyor, kartın kenarındaki minik ray kaç şey söylediğini gösteriyor. Davetli
  hallerinde karta dokunmak besin eklemeyi açıyor. Hiçbir halinde yargılamıyor,
  sayı tutmuyor; gece hiçbir şey istemiyor.
- 🐛 Su kartındaki ilerleme çubuğu, kişisel su hedefi henüz gelmemişken ya da
  sıfır dönerken bozuluyordu. Artık hedef bilinmiyorsa çubuk boş kalıyor ve
  yalnız içtiğin bardak sayısı yazıyor.
- ✨ Açılış tanıtımı yeniden tasarlandı: üç sayfanın her biri artık Afi'nin bir
  sahnesi. Afi selam veriyor, kaşığıyla bekliyor, sonunda yavrusuyla yan yana
  duruyor; arkasında sayfanın rengiyle yumuşak bir ışık var. Kaydırdıkça sahne
  parmağınla birlikte geliyor, noktalar sayfanın rengine uzuyor ve düğme yarı
  yolda kendini güncelliyor. Küçük ekranlarda ve büyük yazı boyutunda sahne
  kırpılmıyor.
- 🐛 Alt sayfalarda (besin ekle, grup kur, ölçüm gir...) kaydırırken uygulamanın
  aniden kapanması giderildi. Sayfa daha yerine oturmadan ya da klavye açılırken
  listeyi kaydırınca uygulama kendi tetiklediği kaydırmaya tekrar tekrar yanıt
  verip kilitleniyordu. Artık bu döngü kesiliyor; kaydırma ve aşağı çekip kapatma
  davranışı aynı kalıyor.

- 🔧 Denge hamlesi önerileri elden geçti: 83 öneri kullanıcıyı daha yoğun bir
  besne yönlendiriyordu. 68 hatalı öneri kaldırıldı, 280 öneri yeniden kuruldu.
- ✨ Besin kataloğu 1009'dan 2009'a çıktı: 500 ham temel gıda (market ve pazar
  malzemeleri, gram ölçüsüyle) ve 500 bölgeye özgü yemek eklendi.
- 🔧 Mevcut 252 besinde grup, takma ad ve porsiyon tutarsızlığı düzeltildi
  (54 içeceğe icecek grubu, 20 kuruyemişe kuruyemis grubu, 152 gereksiz takma ad).
## [0.7.1] — 2026-07-25

- 🐛 Bekleyen bir arkadaşlık isteği ya da yeni kabul edilmiş bir arkadaşlık varken zile dokununca bildirim listesinin çökmesi giderildi. Bu bildirimler sunucudan günsüz geliyordu ve tarih etiketi uygulamayı düşürüyordu; artık gün doğru geliyor, gelmediğinde de satır sessizce atlanıyor. Hatalı bir tarih bir daha hiçbir ekranı düşüremez.

## [0.7.0] — 2026-07-25

- ✨ Bugün'deki profil avatarın artık seviye göstergesi: etrafındaki halka sonraki seviyeye doğru doluyor, seviyen halkanın kenarında duruyor, dokununca Profil'e gidiyor.
- 🐛 Beslenme kartındaki haftalık afiyet ritmi şeridi geri geldi. 20 Temmuz'daki bir ekran düzenlemesiyle sessizce kaybolmuştu; bu haftanın afiyet günlerini yine Bugün'den tek bakışta görüyorsun (hafta hafta ayrıntılı döküm Beslenme ekranında kalıyor).

- ✨ Seviye ve unvan yolculuğu geldi: afiyet günleri, öğün kayıtların, su hedefin ve ölçümlerin tecrübeye dönüşüyor; Profil'de seviye halkan, unvanın ve sonraki seviyeye kalan görünüyor. Biriken hiçbir şey azalmıyor. Grubum listesi artık seviyeye göre sıralanıyor ve üyelerin unvan rozetleri görünüyor.
- ✨ Aylık lig: her ayın 1'inde aynı kademeden yaklaşık 25 kişilik bir sofraya oturuyorsun, ay boyunca o ay kazandığın tecrübe puanın oluyor. Ay sonunda üst dilim bir üst sofraya geçiyor, alt dilim bir alttakinde devam ediyor; Tuz sofrasından kimse aşağı inmiyor. Seviyen ve unvanın ay sonucundan etkilenmiyor. Bugün'de Ligim kartı, ayrıntı Lig ekranında.
- ✨ Görevlerim geldi: 14 başarım, geçmişinden geriye dönük sayılıyor (uygulamayı önceden kullandıysan bir kısmı hazır bekliyor). Tamamlanan görev olduğunda Bugün'deki kart seni çağırıyor, görevi alınca Afi kutluyor ve kart sakinleşiyor. Her başlıktan yalnız en yakın hedef gösteriliyor, liste bir yapılacaklar listesine dönüşmüyor.

- 🔧 Yerel native derleme artık kutudan çalışıyor: `npm run ios` / `npm run android` Sentry yükleme adımını kendi kapatıyor ve boş bırakılmış locale'i UTF-8'e tamamlıyor. Böylece kimse ortam değişkenini elle vermek zorunda kalmıyor (yayın derlemelerindeki Sentry yüklemesi etkilenmez).

- ✨ Seviye ve lig katmanı (ilk hali, örnek verilerle): Profil'de unvanlı seviye halkası ve sonraki seviyeye ilerleme, Grubum'da üyelerin seviye rozeti, Bugün'ün üst köşesinde lig kapısı ve yeni Lig ekranı (aylık sofra, sıralama, ay sonunda ne olacağının sade anlatımı). Seviye ve unvan hiçbir koşulda geri gitmez.
- 🐛 Uygulamanın tanımadığı bir besin grubu içeren bir öğün ya da besin kaydının açılışta uygulamayı çökertmesi giderildi. Öğün listesi artık bilinmeyen grubu sessizce atlıyor (kayıt görünmeye devam ediyor), grup ve öğün ikonları eksik anahtarda nötr bir ikona düşüyor. Böyle bir kayıt yüzünden içeride kilitlenen hesaplar artık normal açılıyor.
- 🐛 Bir hatadan sonra uygulamaya her girişte aynı hata ekranında kalıp içeri girememe (silip yeniden kurmak bile çözmüyordu) giderildi. Hem "profiline ulaşamıyoruz" ekranında hem de genel hata ekranında artık "çıkış yap ve yeniden başla" seçeneği var; bu, cihazda kalıp yeniden kurulumda bile silinmeyen oturumu temizleyip temiz girişe döndürüyor. Kimse bir hata yüzünden dışarıda kalmıyor.
- 🐛 Uygulama her açılışında kısa süre "Şu an profiline ulaşamıyoruz" ekranının parlayıp hemen ardından Bugün'e geçmesi düzeltildi. Profil, oturum hazır olana kadar yükleniyor olarak gösteriliyor; hata ekranı yalnızca gerçek ve sürüp giden bir sorunda çıkıyor.
- 🔧 Çökme raporlama devreye alındı: yayın derlemeleri artık hataları afiet'in Sentry projesine iletiyor, geliştirme/staging/üretim ayrı ortamlar olarak izleniyor. Staging ve üretim derlemelerinde hata izleri okunabilir satır numaralarına çözülüyor. Geliştirme sırasında rapor gönderilmiyor.
- 🐛 Uygulamanın açılır açılmaz kapanmasına yol açan paket sürümü uyuşmazlığı giderildi: Expo paketleri SDK 57'nin beklediği sürümlere hizalandı ve fotoğraf düzenleme paketi artık diğerleriyle aynı sürümden yükleniyor.

## [0.6.1] — 2026-07-21

- 🐛 Bildirime izin verilen cihazlarda uygulama, cihaz kaydını sunucuya saniyede birkaç kez yeniden gönderip boşuna pil ve veri harcıyordu. Artık kayıt yalnızca gerçekten bir şey değiştiğinde (yeni token, saat dilimi ya da sürüm) gönderiliyor.

## [0.6.0] — 2026-07-21

- ✨ afiet ekibinden gelen duyurular artık uygulamanın herhangi bir ekranına yönlendirebiliyor. Duyurular Hesap ayarlarındaki kendi anahtarıyla kapatılabiliyor ve kapalıysa hiç gönderilmiyor; sessiz saatlere denk gelen duyurular ertesi sabah iletiliyor.
- ✨ Alt navigasyon, seçili sekmeyi izleyen yaylı kapsül ve ekranlar arası kısa fade geçişiyle yenilendi; ikon ve etiketler seçimde hafifçe canlanıyor.
- 🐛 “Seni tanıyalım” hareket ve spor adımları scrollsuz sabit sheet'e alındı; Geri/Devam/Kaydet butonları artık alt navigasyonun arkasında kalmıyor.
- 🐛 Yeni hesaplar artık önceki hesabın tamamlanmış FTUE bayraklarını devralmıyor: Afi rehberi hesap kimliğine göre saklanıyor ve oturum açılırken doğru hesap kapsamı yükleniyor. Çıkış, oturum süresi dolması ve hesap silme sonrasında FTUE, yarım e-posta değişikliği ve onboarding taslağı yerel durumdan temizleniyor.
- 🐛 PostgreSQL tarih metninin Hermes tarafından okunamaması nedeniyle yeni hesap rehberinin sessizce tamamlanmış sayılması düzeltildi. Mobil istemci eski tarih biçimini güvenle ayrıştırıyor, API yeni yanıtlarda UTC/RFC 3339 döndürüyor ve bu hatadan etkilenmiş hesaplar rehbere otomatik geri alınıyor.
- ✨ “Seni tanıyalım” artık tek seferde yalnız bir soru soran animasyonlu bir akış: günlük hareket düzeni spordan bağımsız anlatılıyor, spor yapanlar faaliyetlerini çoklu seçebiliyor. Erkeklerin mezura adımında gereksiz kalça alanı gösterilmiyor.
- 🐛 Afi rehberinin ölçüm adımı artık Vücudum sekmesine geçip akışı koparmıyor; Vücudum kartına dokununca gerekli kurulum ve ölçüm sheet'leri doğrudan Bugün üzerinde açılıyor. Spotlight çevresindeki yeşil border kaldırıldı.
- 🔧 Afi rehberinin spotlight deliği kartların yuvarlak köşelerini izleyen gerçek bir maskeye dönüştürüldü; kilitli alt sekme de ekranla aynı tonda karartılarak beyaz blok görünümü kaldırıldı.
- 🐛 Afi rehberindeki Su ve Vücudum spotlight hedeflerinin ince bir çizgiye çökmesine yol açan yarım kart ölçümü düzeltildi; hedef çerçevesi artık kartın tamamını sarıyor.
- ✨ Yeni FTUE: Bugün ekranında Afi, öğün → su → ölçüm sırasını animasyonlu spotlight ile öğretiyor; hedef dışındaki ekran ve sekmeler akış bitene kadar kilitleniyor. Eski Başlangıç Görevleri ile kapatılabilir tanıtım kartları kaldırıldı.
- ✨ Kayıt sırasında benzersiz kullanıcı adı alınıyor; giriş ve şifre sıfırlama e-posta ya da kullanıcı adıyla çalışıyor, şifre alanlarında standart göster/gizle gözü bulunuyor.
- 🔧 İlk öğün ekranında Afi büyütülüp üst bölüme taşındı; “Bugün ne yedin?” başlığı sonuçlarla yer değiştirmiyor, “Kaydet” alt kenarda kalıyor ve ilk kayıt ekranındaki Afi daha görünür.
- 🐛 Düzeltme: İlk besin aramasında bir sonuca dokunmak artık kaydı doğrudan tamamlıyor; ekran kaşık pozlu Afi ile karşılıyor ve ilk afiyet günü anlatımı günün kaydı üzerinden kuruluyor.
- 🐛 Düzeltme: Onboarding adımlarının dikey hizası sabitlendi; kimlik-only profil sözleşmesi henüz yayına alınmamış dev API ile geçiş uyumluluğu eklendi.
- 🔧 İyileştirme: İsim ve emoji adımları scrollsuz, sabit bir iskelete alındı; üst boşluk ve geçiş kayması kaldırıldı, emoji seçimi artık ızgara hücresini büyütmüyor.

- 🔧 Development build artık ilk açılış tanıtımını geçici bir galeri
  yönlendirmesiyle atlayamıyor; Afi galerisi bağımsız rotasında kalırken Gün 0
  akışı release ile aynı sırada test ediliyor
- 🐛 Widget'tan öğün ekleme bağlantısı artık render sırasında başka ekranın
  state'ini değiştirmiyor; öğün köprüsü güvenli effect aşamasında bir kez
  yazılıp ardından Bugün ekranındaki ekleme sheet'i açılıyor
- 🔧 Alışkanlıklarım ekranındaki alevli kesintisiz seri sayacı kaldırıldı;
  yerine son yedi gündeki gerçek kayıt günlerini gösteren, boş günlerde önceki
  emeği sıfırlamayan haftalık ritim özeti geldi
- 🐛 Oturum sona erdiğinde kök seviye ekranlar artık çalışmayan içerikte
  bırakmıyor; kullanıcı açıklamalı giriş ekranına yönlendiriliyor ve başarılı
  girişten sonra kaldığı ekrana geri dönüyor
- 🐛 Vücudum ekranı özet verisi yokken günlük enerji ve BMR'ı artık sıfırmış
  gibi göstermiyor; BMI işareti de yanıltıcı bir konuma düşmek yerine veri
  hazır olana kadar sakin bir bilgilendirme gösteriyor
- ✨ Bugün ekranı yeni kullanıcının ilk iki gününde boş ikincil kartları
  göstermiyor; karşılama, kahraman Beslenme kartı ve Başlangıç Görevleri ilk
  öğüne kadar odağı koruyor, ilk kayıtla tam pano kendiliğinden açılıyor
- 🐛 Grup adı değiştirildiğinde veya bir üye çıkarıldığında Soframız haftalık
  kartı artık kaybolmuyor; güncel grup görünümü otomatik yeniden yükleniyor
- ♿ Sekme çubuğundaki pasif etiket ve ikonlar artık iki temada da daha yüksek
  kontrasta sahip; sekme yazıları cihazın metin boyutu ayarıyla ölçekleniyor
- 🐛 Oturum kendiliğinden sona erdiğinde giriş ekranı artık neden yeniden giriş
  gerektiğini açıklıyor ve başarılı girişten sonra kullanıcıyı kaldığı ekrana
  geri götürüyor
- 🔧 iOS kamera ve galeri izinleri artık Türkçe ve amaca özel açıklamalar
  gösteriyor; kullanılmayan mikrofon izni uygulama beyanından çıkarıldı
- 🐛 Development build artık API ve Stack Auth için aynı dev ortamını kullanıyor;
  zorunlu ortam ayarı eksikse sessiz fallback yerine açık yapılandırma hatası
  veriyor
- 🔧 Android sürümü artık kullanılmayan mikrofon ve diğer uygulamaların üzerinde
  gösterme izinlerini beyan etmiyor
- 🐛 Öğün, ölçüm, vücut bilgisi ve Menü besini kayıtları ağ hatasında artık
  sessizce kapanmıyor: form açık kalıyor, sakin bir uyarı ve hata titreşimi
  veriliyor. Kayıt sürerken butonlar kilitlenip durum gösterdiği için çift
  dokunuş mükerrer öğün veya ölçüm üretmiyor
- 🐛 Onboarding'in son kaydı ağ hatasında artık kilitlenmiyor: buton yeniden
  denenebilir duruma geliyor ve sakin bir hata mesajı gösteriliyor. Sekiz
  soruluk taslak hesap bazında cihazda saklanıyor, uygulama kapanıp açılsa da
  cevaplar geri geliyor; profil başarıyla oluşunca taslak siliniyor
- 🐛 Geçici ağ/API hatası artık mevcut kullanıcıyı onboarding'e göndermiyor.
  Profil yüklenemezse bilgilerin güvende olduğunu söyleyen sakin bir hata
  ekranı ve "Tekrar dene" düğmesi gösteriliyor; ilk profil kaydı da korumalı
  `POST /v1/profile` sözleşmesini kullanıyor
- ✨ Afi artık yalnızca logo değil, ekranın içinde yaşayan bir maskot. Marka
  çalışmasındaki pozlar ve hareketler uygulamaya taşındı: ilk besin kaydında
  zıplayarak, hafta kapanışında çift hopla konfeti savuruyor; grup boş
  ekranında yavrusuyla birlikte sofraya davet ediyor; yükleme iskeletinde
  buharı tüterek beklemeye eşlik ediyor. Kutlamalardaki 🎉 emojisi ve grup
  boş ekranındaki gradyan karo kalktı, yerlerini Afi aldı
- ✨ Boş ekranlar artık sessiz değil: menün, arkadaş listen, bildirimlerin,
  istatistiklerin, ritim geçmişin ve besin araman boşken Afi merakla ya da
  kaşığıyla bekliyor. Başlangıç görevleri tamamlanınca da bir kutlama veriyor
- ✨ Hata ekranlarında Afi eşlik ediyor (grup, arkadaşlar, geçersiz davet
  bağlantısı, açılamayan profil). Marka kuralı gereği yüzü asla üzülmez:
  şefkati duruş ve mikro-kopya taşır, suçlayan bir maskot yok
- 🔧 Maskot animasyonları dekoratiftir: cihazda "hareketi azalt" açıkken
  hiçbiri başlamaz, Afi statik pozunda durur

## [0.5.1] — 2026-07-18

- 🐛 Afi'nin "Menüne ekle ve öğüne yaz" butonu bazı besinlerde basılıyor ama
  hiçbir şey olmuyordu. Kök neden sunucudaydı: besin grubu listesi 12'ye
  çıkarıldığında (bakliyat, kuruyemiş, hamur işi, içecek) API doğrulaması
  8 grupta kalmıştı; bu grupları taşıyan besin sessizce 400 alıyordu. Sunucu
  listesi eşitlendi, istemci de artık kayıt hatasını yutmuyor: olmadığında
  Afi bunu söylüyor
- 🔧 Afi tabakta birden fazla besin gördüğünde alttaki liste artık "Ekle /
  Reddet" seçeneği taşımıyor; yalnızca "Tespit ettiğim diğer besinler" olarak
  gösteriliyor. Baştaki besin eklenince ya da reddedilince sıradaki
  kendiliğinden ana karta geçiyor, karar tek tek veriliyor
- 🔧 Afi'nin önerdiği besin listende (katalog ya da menün) zaten varsa artık
  menüne ikinci kez yazılmıyor; kartta senin listendeki kalori, grup ve ölçü
  değerleri gösteriliyor
- ✨ Grup kurucusu grubu "herkese açık" yapabiliyor: açıkken grup keşifte
  listeleniyor ve henüz grubu olmayanlar koda gerek kalmadan katılabiliyor.
  (Keşif ekranı vardı ama hiçbir grup herkese açık işaretlenemediğinden hep
  boş kalıyordu)

## [0.5.0] — 2026-07-18

- ✨ Besin kataloğu büyüdü: komşu coğrafyaların mutfaklarından ~500 yeni besin
  eklendi (toplam ~1000); arama ve öğün girişinde artık çok daha fazla yemek
  çıkıyor
- 🔧 Performans (veri katmanı): API istemcisine istek birleştirme (in-flight
  dedup) + çok kısa ömürlü okuma önbelleği eklendi. Bugün ekranı tek açılışta
  aynı `/v1/summary` isteğini DÖRT kez yapıyordu (Bugün + su hedefi + Beslenme
  kartı + Vücudum kartı); artık eşzamanlı özdeş GET'ler tek ağ çağrısında
  birleşiyor, `/v1/measurements` ve `/v1/meals/logged-dates` tekrarları da
  toplanıyor. Mutasyon (öğün/su/ölçüm kaydı) tüm okuma önbelleğini geçersiz
  kılar, böylece türev özet bir yazımdan sonra asla bayat okunmaz. Repository
  arayüzleri ve UI DEĞİŞMEDİ (yeni: `data/api/requestCache.ts`)
- 🔧 Performans (reaktivite): `useLive`, `notify()` sonrası tazeleme AYNI veriyi
  döndürdüğünde önceki referansı koruyor (derin eşitlik, `data/equal.ts`);
  değişmeyen veride gereksiz re-render tetiklenmiyor
- 🔧 Performans (Besin Rehberi): ~1000 satırlık liste satırı memo'landı; aramada
  yazarken yalnız props'u değişen satırlar yeniden çiziliyor

- ✨ Sayfalar yüklenirken artık boş/atlamalı açılış yerine tüm ekranı kaplayan
  sakin bir yükleme iskeleti (skeleton) görünüyor; veri gelince gerçek içerik
  yerine oturur. Ana sekmeler ve menü sayfalarının hepsinde aynı iskelet
- ✨ Afi ile fotoğraftan ekleme, tabaktaki birden çok besni artık tek tek
  ilerletiyor: ana bulguyu ekleyince (ya da yanlışsa reddedince) sıradaki besin
  kendiliğinden öne, ana bulguya geçer; kalanların her birini "Ekle" ya da
  "Reddet" ile yönet, yanlış tanınanı Afi'ye yazarak düzelt. Önceden ana besni
  ekleyince kalan besinler ekrandan kayboluyordu
- ✨ Grup davet linki artık çalışıyor: paylaşılan afiet.co/katil/{kod}
  bağlantısına dokununca afiet açılır ve seni doğrudan o gruba katılma adımına
  götürür (zaten bir gruptaysan sakin bir dille bilgilendirilirsin); uygulaman
  yoksa açılan sayfa kodu büyük gösterir, indirip Grubum > ID ile katıl'da bu
  kodu girersin
- ✨ Profil ekranı yenilendi: enerji halkalı büyük avatar, isminin altında
  @kullanıcı adı, Arkadaşlarım ve Grubum kısayolları (sofra arkadaşı sayın ve
  grubunun adı; dokununca ilgili sayfaya götürür), afiyet ritmi özeti
  (tamamladığın afiyet haftası + toplam afiyet günü) ve tek bakışta vücut +
  bugünün besin grubu dengesi özeti bir arada
- ✨ Arkadaş ve grup üyesi profil kartı zenginleşti: grubu, afiyet haftası ve
  "bugün afiyette ✨" rozetleri daha belirgin; sofra arkadaşınsa ya da
  grubundansa küçük bir "birlikte afiyet" vurgusu, sana açık sınırlı vücut
  bağlamı (cinsiyet · boy · aktivite) ve bugünün enerjisi sakin bir satırda
- ✨ Kullanıcı adı: profilden @handle'ını belirle ya da değiştir; yazarken adın
  uygun olup olmadığı anında ve sakin bir dille bildirilir
- ✨ Kayıt sırasında kullanıcı adı: yeni hesapta isminden hemen sonra bir @handle
  seçiyorsun; biçim yazarken denetlenir, ad başkasınca alınmışsa sakin bir dille
  başka bir ad seçmen istenir
- ✨ Kullanıcı adını artık Hesap ayarlarım'dan da yönetebilirsin: mevcut @handle'ını
  görüp tek dokunuşla değiştir (profildeki akışla aynı)
- ✨ Görünüm sayfası: tema seçimi (Açık / Koyu / Otomatik) artık hamburger
  menüdeki ayrı Görünüm sayfasında; Otomatik "Önerilen" olarak işaretli ve
  cihazının ayarını izler
- ✨ Arkadaşlarım sayfası: hamburger menüden aç, sofra arkadaşlarını enerji
  halkalarıyla gör, bekleyen istekleri (sana gelenler ve gönderdiklerin) tek
  yerden yönet; bir satıra dokununca arkadaşının profil kartı açılır
- ✨ Arkadaş ekleme: kullanıcı adıyla ara, çıkan sonucu tek dokunuşla ekle;
  isteğin karşı tarafın onayına düşer, o da seni eklediyse arkadaş olursunuz
- ✨ Arkadaşlık isteklerini artık bildirimlerden de yanıtlayabilirsin: gelen
  istek kaleminin altındaki Kabul et / Reddet ile hızlıca karar ver
- 🔧 Sosyal katman gerçek backend'e bağlandı: kullanıcı adı, arkadaşların ve
  istekler, kullanıcı araması, herkese açık grup keşfi ile katılma ve arkadaş
  profil kartı artık sunucuyla senkron ve cihazlar arası kalıcı; arkadaş ekleme,
  isteği kabul/geri alma ve gruba katılma dokununca anında görünür, arkada
  kaydedilir; listeler yüklenirken sakin bir bekleyiş, erişilemezse nazik bir
  "tekrar dene" gösterilir
- 🐛 Açılışta zümrüt splash ile içerik arasında beliren boş beyaz kare
  kaldırıldı: splash artık ilk ekran gerçekten çizilene kadar kalıyor ve
  yumuşak bir geçişle soluklanarak doğrudan içeriğe bağlanıyor
- 🐛 Onboarding avatar seçiminde emoji ızgarasının kartları ekranın sağ ve sol
  kenarından taşıyordu; kartlar artık yatay boşluğun içinde düzgün oturuyor
- 🐛 Grubum ekranında üyelerin enerji halkaları, sen besin ekleyince aynı
  kalıyordu; artık besin eklendiğin an grubun günün oranıyla yeniden çekilir ve
  halkalar canlı güncellenir (uygulamayı yeniden açmaya gerek yok)
- 🐛 Bir gruba katıldığında (herkese açık grup keşfinden ya da ID ile) ana
  ekrandaki Grubum kartı hâlâ "Bir gruba katıl" gösteriyordu; grup listesi artık
  tüm ekranlarca paylaşıldığından kart anında grubunun adına döner
- 🔧 Ana ekrandaki su kartında + / - artık anında tepki veriyor: bardak değeri
  dokunur dokunmaz değişiyor, kayıt arkada tamamlanıyor, bir aksilik olursa
  değer sessizce eski haline dönüyor
- ✨ Menüne Kaydet'te de fotoğraftan tanıma: yeni besin eklerken adını yazmak
  yerine kamerayla çekebilir ya da galeriden seçebilirsin; Afi tanırsa grup,
  ölçü ve yaklaşık değerleri düzenlenebilir biçimde forma doldurur, onaylayana
  kadar hiçbir şey kaydedilmez
- ✨ Fotoğraf akışlarına galeri seçeneği: hem "Afi ile ekle"de hem Menüne
  Kaydet'te kameranın yanına galeriden görsel seçmek için ayrı bir ikon geldi
- 🐛 "Afi ile ekle" sheet'inde klavye açılınca yazı satırı ve Gönder düğmesi
  klavyenin altında kalıyordu; artık giriş çubuğu klavyenin tam üstüne çıkıyor

- ✨ E-posta adresini artık uygulamadan değiştirebilirsin: Hesap ayarlarım ›
  E-posta › Değiştir'de yeni adresini yaz, sana gelen maildeki doğrulama
  bağlantısına dokun ve uygulamaya dönüp "Doğruladım, devam et" de. Böylece
  hesap ayarlarındaki son taslak ekran da gerçek oldu
- ✨ Apple ile giriş: giriş ve kayıt ekranındaki Apple butonuyla tek dokunuşla
  hesabına girebilirsin (yalnız iOS). Apple ile gelen hesaba dilersen Hesap
  ayarlarım › Şifre › Belirle'den bir de şifre belirleyip e-postanla da giriş
  yapabilirsin
- ✨ Google ile giriş: giriş ve kayıt ekranındaki "Google ile devam et"
  butonuyla hesabına girebilirsin (iOS ve Android). Onayı güvenli biçimde
  sistem tarayıcısında verirsin, bitince uygulamaya kendiliğinden dönersin
- ✨ Şifremi unuttum: giriş ekranındaki bağlantıyla kayıtlı e-postana bir
  sıfırlama bağlantısı gönderebilirsin; yeni şifreni afiet.co'da açılan
  sayfada belirleyip uygulamadan giriş yaparsın
- ✨ E-posta doğrulama: Hesap ayarlarım'da "Doğrulanmamış" rozetinin yanındaki
  Doğrula ile kendine doğrulama maili gönderebilirsin; yeni kayıtlara
  doğrulama maili otomatik gider ve maildeki bağlantıyla doğrulayıp
  uygulamaya döndüğünde rozet kendiliğinden güncellenir
- ✨ Şifreni artık uygulamadan değiştirebilirsin: Hesap ayarlarım › Şifre ›
  Değiştir'de mevcut ve yeni şifreni gir; kaydolunca sakin bir onay görürsün.
  Güvenlik için diğer cihazlardaki oturumların kapatılır, bu cihaz açık kalır
- ✨ Hesap ayarlarında e-posta satırı artık gerçek bilgini gösteriyor: giriş
  yaptığın adres ve yanında sakin bir doğrulama durumu rozeti (Doğrulanmış /
  Doğrulanmamış)
- 🔧 Oturum güvenliği sertleşti: giriş anahtarların cihazın güvenli deposuna
  (Keychain / Keystore) taşındı; güncelleme yapan kullanıcılar oturumdan
  düşmeden sorunsuz devam eder (sessiz taşıma)
- 🔧 Çıkış yaptığında oturum sunucu tarafında da sonlandırılıyor; cihazdaki
  temizlik ve çıkış her koşulda anında çalışır

- ✨ Kapsamlı arayüz revizyonu. Alt menü yeni sıra: Bugün · Beslenme ·
  Vücudum · Grubum. Geçmiş ve Profil sekmeden çıktı; sağ üstteki hamburger
  menüden açılıyor (Profilim, Bilgilerim, Alışkanlıklarım, Geçmiş günler,
  Hesap ayarlarım)
- ✨ Üst başlıkta yardımcı üçlü: sofra kesesi (harcama ekonomisi göstergesi;
  şimdilik mock + bilgi kartı, kazanç ekonomisiyle köprüsü yok), okunmamış
  sayısını gösteren bildirim rozeti (eski tek nokta yerine) ve sağdan açılan
  hamburger menü
- 🔧 Bugün panosu sadeleşti: Vücudum ve Su kartları yarı genişlik minimal
  ikiliye indi; altına Menüm ve Grubum kartları eklendi (Grubum: grubun varsa
  adını, yoksa "gruba katıl" teşvikini gösterir, dokununca Grubum'a gider)
- 🔧 Beslenme sayfası: Afiyet ritmi kartı Geçmiş'ten buraya taşındı; öğünler
  tek satırda, tek dokunuşla ekleme yapılan yeni tasarıma (MealBoard) geçti;
  enerji & makrolar ile Besin Rehberi + Menüm kısayolları korundu
- ✨ Yeni sayfalar (hamburger menü): Bilgilerim (besin grubu dağılımı odaklı
  istatistik), Alışkanlıklarım (kayıt düzeni, öğün tercihi, su alışkanlığı),
  Hesap ayarlarım (e-posta/şifre taslak; çıkış ve hesap silme gerçek).
  Profilim'de kimlik + tema kaldı; Geçmiş günler'de ritim kartı artık yok
- 🐛 Google ile giriş çalışmıyordu ("şu anda kullanılamıyor" hatası veriyordu);
  giriş isteğindeki bir güvenlik parametresi eksikti, düzeltildi
- 🐛 Çıkış yaptığında artık doğrudan giriş ekranına dönüyorsun (eskiden Hesap
  ayarlarım ekranında kalıp geri tuşuyla çıkman gerekiyordu)
- 🐛 Tema "Otomatik" iken uygulama artık gerçekten cihazının açık/koyu
  temasını izliyor: yayın yapısında (TestFlight) uygulama, cihaz teması hazır
  olmadan açıldığında temayı açık varsayıp öyle kalabiliyordu; açılışta cihazın
  anlık teması okunup uygulanıyor
- 🐛 Ana sekmeler (Bugün · Beslenme · Vücudum · Grubum) arasında geçerken
  klavyenin belirip kaybolması giderildi: alt sayfaların içeriği yalnızca sayfa
  ilk kez açıldığında yükleniyor; kapalı bir alt sayfadaki otomatik-odaklı
  giriş (Grup kur) artık ekran açılışında klavyeyi tetiklemiyor

- ✨ Grubun yoksa Grubum'da herkese açık grupları keşfet: kur/katıl
  seçeneklerinin altında hazır sofralar (logo, ad, üye sayısı) listelenir,
  birine "Katıl" diyerek aralarına katılabilirsin
- ✨ Grup üyesinin adına ya da avatarına dokununca profil kartı açılıyor;
  oradan arkadaşlık isteği gönderebilirsin (kendi satırın dokunulamaz)

## [0.4.0] — 2026-07-16

- ✨ Ana ekran widget'ı (Faz 1, iOS + Android): haftalık ritim noktaları,
  saat bağlamlı "öğünü ekle" kapısı ve köşeden bakan Afi; marka
  degradesi, emoji yok. Dokunuş uygulamayı o öğün önseçili Besin Ekle
  ile açar (afiet://ekle). Veri uygulamadan beslenir, widget internete
  çıkmaz. Not: widget yalnız native build'de görünür (TestFlight/dev
  build); Expo Go'da yoktur

- ✨ Afi ile fotoğraftan besin ekleme: Besin Ekle'de kamera düğmesi;
  tam ekran sohbet akışında Afi fotoğrafı tanır, emin olamazsa çipli net
  sorular sorar ya da ek fotoğraf ister; sonuç düzenlenebilir besin kartı
  olarak düşer, havuzda olmayan besin tek dokunuşla Menüm'e kaydedilip
  öğüne yazılır. Yazılmış ad ilk turda Afi'ye referans gider; karede
  görülen ek besinler "bunu da ekle" kartlarıyla sunulur. Fotoğraflar
  sunucuda saklanmaz; kota günde 20 tur (POST /v1/afi/photo-chat)

- ✨ Besin grupları genişledi: Bakliyat, Kuruyemiş, Hamur İşi ve İçecek
  eklendi (çekirdek 5'li ve denge skoru değişmedi); her birine özgün
  ikon ve renk
- 🔧 Menüne Kaydet'te grup çipleri sadeleşti: Afi doldurunca yalnız
  seçilenler görünür, elle girişte 3 varsayılan + "+N daha" ile açılır,
  "daha az göster" ile kapanır
- 🐛 Aynı formda ikinci kez "Doldur" denince besin bilgisi notu artık
  yeni öneriyle güncelleniyor (elle yazılmış not korunur)

- ✨ Afi asistanı, Menüm doldurma: "Yakında" rozeti gitti; yeni besin
  Afi'den geçer (Besin Ekle'den adla gelince öneri otomatik istenir),
  grup + ölçü + yaklaşık makrolar dolar, tüm alanlar düzenlenebilir
  kalır, onaysız kayda geçmez. Elle giriş "Değerleri kendim girmek
  istiyorum" ile; grup ve dört yaklaşık değer dolmadan kaydet pasif.
  Öneri sunucudan (POST /v1/afi/food-suggest, kota günde 30). Event'ler:
  afi_assist_used, afi_suggestion_accepted
- 🔧 Menüne Kaydet tam ekran modala taşındı (iOS'ta native kart): başlık
  ve kaydet çubuğu sabit, form ortada kayar; üst güvenli alan taşması
  kalmadı. Tüm sheet'ler artık çentik bölgesine giremiyor (topInset)

- ✨ Afiyet olsun jesti: Grubum'da o gün afiyette olan üyenin satırında
  "Afiyet olsun 🧡" butonu (üye başına günde 1 kez, gönderilince
  "dedin ✓" — durum sunucuda tutulur, cihazlar arası tutarlı); alınan
  selamlar bildirim merkezine düşer
- ✨ Bildirim merkezi: dört ana ekranın sağ üstünde sabit zil, okunmamış
  bildirimde turuncu nokta; dokununca bildirim listesi açılır (afiyet
  olsun selamları; ileride push bildirimleri de buraya düşecek). Liste
  ve okundu durumu sunucudan (GET /v1/notifications + ack)

- ✨ Geçmiş: "kesintisiz seri" pankartı emekli oldu; yerine afiyet ritmi
  kartı geldi (bu haftanın şeridi, "Toplam N hafta 🧡" rozeti, geçmiş
  haftaların dökümü ve "hedef 5 gün · 2 gün sofra payın var" notu).
  Günlük liste aynen duruyor
- 🔧 Bugün başlığındaki alevli seri rozeti ritim rozetine dönüştü: kase
  ikonu + bu haftanın afiyet günü sayısı; hedef dolunca 🧡. Kayıp dili
  ("seriyi bozma") tüm uygulamadan kalktı

## [0.3.1] — 2026-07-15

- ✨ Profil › Afiyet ritmin: haftalık özet artık profilinde — bu haftanın
  canlı şeridi ve afiyet günü sayısı, kalıcı "Toplam N hafta 🧡" rozeti ve
  geçmiş haftaların dökümü (tarih aralığı, mini noktalar, gün sayısı,
  kazanılan haftalarda 🧡; boş haftalar listelenmez, kayıp dili yok)
- ✨ Hafta kapanışı: hedefe ulaşan hafta bittiğinde (pazar günü tuttuysa o
  akşam) Afi'li konfetili kutlama — "Bu hafta afiyetteydin 🎉", haftanın
  noktaları ve kalıcı "Toplam N afiyet haftan" sayacı (asla azalmaz,
  hesabında saklanır). Ulaşılamayan haftada hiçbir mesaj yok — pencere
  pazartesi sessizce tazelenir
- 🔧 Ritim sayıları sadeleşti: "1/5", "5/7" gibi kesirler kalktı — şerit
  artık düz afiyet günü sayısı gösterir; 5'e ulaşan hafta afiyet haftası olur

- ✨ Soframız: Grubum'a grubun ortak haftalık hedefi geldi — afiyet günü
  halkası (hedef: üye × 5), gün-gün grup çubukları (kişi kırılımı yok) ve
  üyelerde "bugün afiyetteydi" işareti; Bugün'deki beslenme kartına 7 noktalı
  kişisel afiyet ritmi şeridi (bugünün noktası nabızlı, Pzt–Paz penceresi).
  Veriler canlı: afiyet günü = o gün en az bir öğün kaydı, backend hesaplar
- ✨ Sofra görünürlüğüm: grup ayarlarında tek anahtar — kapatınca grup enerji
  halkanı ve afiyet günlerini GERÇEKTEN göremez olur (sunucu tarafında);
  öğün detayı ve kilo hiçbir zaman görünmez. ID ile katılırken bilgilendirme
- ✨ Görünmez temel: davranış telemetrisi açıldı (kendi events tablomuz,
  toplu ve sessiz gönderim) — oyunlaştırma guardrail'leri buradan okunacak
- 🔧 Bugün: renk el değiştirdi — karşılama başlığı tek satırlık kompakt
  şeride indi (selam · tarih, isim, seri rozeti, avatar), zümrüt degrade
  sayfanın odağı olan Beslenme kartına taşındı; makro halkaları degrade
  üzerinde tek ton beyaz (renkli set yeşilde iyi okunmuyordu)
- 🔧 Alt menü sırası: Bugün · Grubum · Geçmiş · Profil
- 🔧 Yazılar uygulama genelinde bir tık büyüdü (okunabilirlik geri bildirimi)
- 🐛 Grubum: üye çıkarma/düzenleme sonrası enerji halkaları sıfırlanıyordu —
  eldeki oranlar korunur; Beslenme kartının degradesi kart büyüyünce yarım
  kalabiliyordu — kart boyutu ölçülerek çizilir
- ✨ Grubum sekmesi: gruplar Profil'den alt menüde kendi sekmesine taşındı ve
  tek grup modeline geçildi — herkes bir grupta bulunur; grubun yoksa sıcak
  karşılama + kur/katıl, grubun varsa grubun kendisi sayfada yaşar. Süreli davet
  kodu yerine kalıcı 8 haneli grup ID'si (adın yanında, dokununca paylaşılır) ve
  "Gruba davet et" linki; katılma bu ID ile. Düzenleme (logo + ad) ve grubu
  sil / gruptan ayrıl pop-up'ta: kurucu üyeleri çıkarabilir ve grupta tek başına
  kaldıysa grubu silebilir. Üye avatarlarının çevresinde günün enerji halkası:
  0'dan büyüyerek dolar, maviden yeşile olgunlaşır, aşımda turuncudan kırmızıya
  döner. Grup ID/logo/üye enerji oranları canlı backend'den gelir (grup v2
  API'si); üye avatarları profil emojisini gösterir; davet paylaşımı kalemin
  yanındaki paylaş ikonunda
- ✨ Tanıtım turu: uygulamayı ilk kez açanlar girişten önce 3 sayfalık
  kaydırmalı tanıtımla karşılanıyor (Sayma dengele · Sofranın diliyle ·
  Ailece birlikte) — bir kez gösterilir, Atla ile geçilebilir
- 🐛 Oturum: her açılışta yeniden giriş isteniyordu — token yenileme isteği
  gövdesiz gittiği için Stack Auth her seferinde 400 dönüyordu; istek boş JSON
  gövdesiyle düzeltildi, oturum artık cihazda kalıcı (aynı hata hesap silmede
  Stack kimliğinin sessizce silinememesine de yol açıyordu, o da düzeldi)
- 🐛 Oturum: token yenileme geçici bir ağ hatasında bile oturumu kapatıyordu —
  artık yalnızca refresh token gerçekten geçersizse çıkış yapılır; aynı anda
  gelen istekler tek yenileme çağrısını paylaşır (beklenmedik "çıkış yapılmış"
  durumlarının olası sebebi)
- 🐛 Kayıt: "bu e-posta zaten kayıtlı" durumunda e-posta adresini içeren uzun
  İngilizce ham hata görünüyordu — kısa Türkçe mesajla değiştirildi; bilinmeyen
  auth hatalarında da ham sunucu mesajı artık gösterilmiyor
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

- ✨ Besin havuzu 109'dan **509'a** çıktı: 400 yeni Türk/dünya mutfağı besini
  (kebaplar, çorbalar, zeytinyağlılar, meyve/kuruyemiş, tatlılar, içecekler…)
  eklendi. Havuzdaki HER besin artık gramaj (`gramPerMeasure`), lif (`fiberG`),
  yakıştığı öğünler (`suitableMeals`), diyet etiketleri
  (vejetaryen/vegan/glutensiz/laktozsuz), emoji, önerilen varsayılan miktar,
  arama eşanlamlıları (`aliases`), sıvı katkısı (`liquidMl`, içecek/çorba) ve
  daha hafif alternatif (`lighterAlternative`, "denge hamlesi") taşıyor.
  Autocomplete artık ada ek olarak eşanlamlıları da eşleştiriyor. Backend
  katalog eşitlemesi migration `000007_foods_v2_enrichment` ile geldi
  (UI'da yeni alanları yüzeye çıkarma ayrı adım)

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
