import WidgetKit
import SwiftUI

// afiet · ritim widget'ı — tasarımın tek kaynağı afiet-brand/widget/
// (kucuk-emerald.svg + kucuk-krem.svg). Emoji yok; ikonlar duotone setin
// SwiftUI çevirisi, Afi maskotu Path'lerle çizilir (yüz asla değişmez).
// Veri App Group UserDefaults'tan gelir (uygulama yazar, widget okur);
// timeline gün içi öğün sınırlarında döner ki CTA saatle yaşasın.

// MARK: - Veri

struct WidgetState: Codable {
    var dots: [Int]      // 7 gün: 0 = boş, 1 = afiyet günü
    var done: Int
    var goal: Int
    var todayIndex: Int  // 0 = Pzt
}

func loadState() -> WidgetState {
    let defaults = UserDefaults(suiteName: "group.co.afiet.app")
    if let raw = defaults?.string(forKey: "widgetState"),
       let data = raw.data(using: .utf8),
       let s = try? JSONDecoder().decode(WidgetState.self, from: data) {
        return s
    }
    // Veri yokken (ilk kurulum): boş hafta — davet hâlâ anlamlı.
    let weekday = (Calendar.current.component(.weekday, from: Date()) + 5) % 7
    return WidgetState(dots: [0, 0, 0, 0, 0, 0, 0], done: 0, goal: 5, todayIndex: weekday)
}

// Saat → öğün (uygulamadaki guessMealByTime ile birebir).
func mealFor(hour: Int) -> (key: String, label: String) {
    switch hour {
    case 5..<11: return ("kahvalti", "Kahvaltıyı ekle")
    case 11..<15: return ("ogle", "Öğleyi ekle")
    case 15..<17: return ("ara", "Ara öğün ekle")
    case 17..<22: return ("aksam", "Akşamı ekle")
    default: return ("ara", "Ara öğün ekle")
    }
}

// MARK: - Timeline

struct RitimEntry: TimelineEntry {
    let date: Date
    let state: WidgetState
    let meal: (key: String, label: String)
}

struct RitimProvider: TimelineProvider {
    func entry(at date: Date) -> RitimEntry {
        RitimEntry(date: date, state: loadState(), meal: mealFor(hour: Calendar.current.component(.hour, from: date)))
    }

    func placeholder(in context: Context) -> RitimEntry { entry(at: Date()) }

    func getSnapshot(in context: Context, completion: @escaping (RitimEntry) -> Void) {
        completion(entry(at: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RitimEntry>) -> Void) {
        // Bugünün öğün sınırlarında birer giriş: CTA gün boyu doğru kalır.
        let cal = Calendar.current
        let now = Date()
        var entries: [RitimEntry] = [entry(at: now)]
        for hour in [5, 11, 15, 17, 22] {
            if let t = cal.date(bySettingHour: hour, minute: 0, second: 0, of: now), t > now {
                entries.append(entry(at: t))
            }
        }
        // Gece yarısı: yeni gün, nokta kayar.
        if let midnight = cal.date(byAdding: .day, value: 1, to: cal.startOfDay(for: now)) {
            entries.append(entry(at: midnight))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

// MARK: - Marka parçaları

let brandGradient = LinearGradient(
    colors: [Color(red: 0.063, green: 0.725, blue: 0.506),   // #10b981
             Color(red: 0.016, green: 0.471, blue: 0.341)],  // #047857
    startPoint: .topLeading, endPoint: .bottomTrailing
)
let mint = Color(red: 0.655, green: 0.953, blue: 0.816)      // #a7f3d0
let brandDeep = Color(red: 0.016, green: 0.471, blue: 0.341) // #047857

/// Afi maskotu (koyu zemin paleti): beyaz kase, mint + beyaz iki tel buhar,
/// oyulmuş yüz. Kaynak: afiet-brand/maskot/afi-temel-koyu.svg (512 grid).
struct AfiView: View {
    var size: CGFloat
    var body: some View {
        Canvas { ctx, _ in
            let s = size / 512.0
            func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * s, y: y * s) }

            // Buhar telleri (iki tel, asla üç)
            var steam1 = Path()
            steam1.move(to: pt(207, 232))
            steam1.addCurve(to: pt(224, 190), control1: pt(207, 213), control2: pt(224, 209))
            steam1.addCurve(to: pt(207, 150), control1: pt(224, 171), control2: pt(207, 169))
            ctx.stroke(steam1, with: .color(mint), style: StrokeStyle(lineWidth: 21 * s, lineCap: .round))

            var steam2 = Path()
            steam2.move(to: pt(300, 238))
            steam2.addCurve(to: pt(319, 190), control1: pt(300, 217), control2: pt(319, 213))
            steam2.addCurve(to: pt(300, 144), control1: pt(319, 167), control2: pt(300, 167))
            ctx.stroke(steam2, with: .color(.white), style: StrokeStyle(lineWidth: 23 * s, lineCap: .round))

            // Kase: yarım elips gövde + ayak
            var bowl = Path()
            bowl.move(to: pt(116, 276))
            bowl.addLine(to: pt(396, 276))
            bowl.addCurve(to: pt(256, 414), control1: pt(396, 356), control2: pt(334, 414))
            bowl.addCurve(to: pt(116, 276), control1: pt(178, 414), control2: pt(116, 356))
            bowl.closeSubpath()
            ctx.fill(bowl, with: .color(.white))
            ctx.fill(Path(roundedRect: CGRect(x: 210 * s, y: 394 * s, width: 92 * s, height: 20 * s), cornerRadius: 10 * s), with: .color(.white))

            // Yüz: kapalı mutlu gözler + minik gülümseme (değişmez, #047857)
            func arc(_ x1: CGFloat, _ y1: CGFloat, _ cx: CGFloat, _ cy: CGFloat, _ x2: CGFloat, _ y2: CGFloat, _ w: CGFloat) {
                var p = Path()
                p.move(to: pt(x1, y1))
                p.addQuadCurve(to: pt(x2, y2), control: pt(cx, cy))
                ctx.stroke(p, with: .color(brandDeep), style: StrokeStyle(lineWidth: w * s, lineCap: .round))
            }
            arc(180, 316, 203, 295, 226, 316, 15)
            arc(286, 316, 309, 295, 332, 316, 15)
            arc(238, 342, 256, 356, 274, 342, 13)
        }
        .frame(width: size, height: size)
    }
}

/// 7 noktalı ritim şeridi: dolu beyaz, bugün mint halkalı, boş %22.
struct RhythmDots: View {
    let state: WidgetState
    var body: some View {
        HStack(spacing: 6.5) {
            ForEach(0..<7, id: \.self) { i in
                if i == state.todayIndex {
                    Circle()
                        .fill(Color.white.opacity(state.dots[i] == 1 ? 1 : 0.25))
                        .frame(width: 10, height: 10)
                        .overlay(Circle().stroke(mint, lineWidth: 2.5))
                } else {
                    Circle()
                        .fill(Color.white.opacity(state.dots[i] == 1 ? 1 : 0.22))
                        .frame(width: 11, height: 11)
                }
            }
        }
    }
}

// MARK: - Küçük widget görünümü

struct RitimSmallView: View {
    let entry: RitimEntry
    var body: some View {
        ZStack {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("afiet")
                        .font(.system(size: 19, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                    Spacer()
                }
                Spacer()
                Text(label)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundColor(mint)
                RhythmDots(state: entry.state)
                    .padding(.top, 7)
                HStack(spacing: 6) {
                    Image(systemName: "plus")
                        .font(.system(size: 12, weight: .bold))
                    Text(entry.meal.label)
                        .font(.system(size: 12.5, weight: .bold, design: .rounded))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(Capsule().fill(Color.white.opacity(0.18)))
                .padding(.top, 12)
            }
            // Afi köşeden bakar (sağ üst, hafif kırpık)
            AfiView(size: 118)
                .offset(x: 62, y: -58)
        }
        .padding(14)
        .widgetURL(URL(string: "afiet://ekle?ogun=\(entry.meal.key)"))
    }

    var label: String {
        if entry.state.done >= entry.state.goal { return "Bu hafta afiyettesin" }
        return "Bu hafta \(entry.state.done) afiyet günü"
    }
}

// MARK: - Widget tanımı

struct RitimWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AfiyetRitmi", provider: RitimProvider()) { entry in
            RitimSmallView(entry: entry)
                .containerBackground(for: .widget) { brandGradient }
        }
        .configurationDisplayName("afiyet ritmin")
        .description("Haftalık ritmin ve tek dokunuşla öğün ekleme.")
        .supportedFamilies([.systemSmall])
        .contentMarginsDisabled()
    }
}

@main
struct RitimWidgetBundle: WidgetBundle {
    var body: some Widget {
        RitimWidget()
    }
}
