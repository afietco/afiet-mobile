import WidgetKit
import SwiftUI

// afiet · ritim widget'ları — tasarımın tek kaynağı afiet-brand/widget/
// (kucuk-emerald, orta-emerald, kilit-ekrani). Emoji yok; ikonlar duotone
// setin SwiftUI çevirisi, Afi maskotu Path'lerle çizilir (yüz değişmez).
// Veri App Group UserDefaults'tan gelir; timeline öğün sınırlarında döner.

// MARK: - Veri

struct WidgetState: Codable {
    var dots: [Int]        // 7 gün: 0 = boş, 1 = afiyet günü
    var done: Int
    var goal: Int
    var todayIndex: Int    // 0 = Pzt
    var covered: [String]? // bugün kapsanan çekirdek gruplar (sebze, meyve, ...)
}

func loadState() -> WidgetState {
    let defaults = UserDefaults(suiteName: "group.co.afiet.app")
    if let raw = defaults?.string(forKey: "widgetState"),
       let data = raw.data(using: .utf8),
       let s = try? JSONDecoder().decode(WidgetState.self, from: data) {
        return s
    }
    let weekday = (Calendar.current.component(.weekday, from: Date()) + 5) % 7
    return WidgetState(dots: [0, 0, 0, 0, 0, 0, 0], done: 0, goal: 5, todayIndex: weekday, covered: [])
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
        let cal = Calendar.current
        let now = Date()
        var entries: [RitimEntry] = [entry(at: now)]
        for hour in [5, 11, 15, 17, 22] {
            if let t = cal.date(bySettingHour: hour, minute: 0, second: 0, of: now), t > now {
                entries.append(entry(at: t))
            }
        }
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

/// Afi maskotu (koyu zemin paleti). Kaynak: afi-temel-koyu.svg (512 grid).
struct AfiView: View {
    var size: CGFloat
    var body: some View {
        Canvas { ctx, _ in
            let s = size / 512.0
            func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * s, y: y * s) }

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

            var bowl = Path()
            bowl.move(to: pt(116, 276))
            bowl.addLine(to: pt(396, 276))
            bowl.addCurve(to: pt(256, 414), control1: pt(396, 356), control2: pt(334, 414))
            bowl.addCurve(to: pt(116, 276), control1: pt(178, 414), control2: pt(116, 356))
            bowl.closeSubpath()
            ctx.fill(bowl, with: .color(.white))
            ctx.fill(Path(roundedRect: CGRect(x: 210 * s, y: 394 * s, width: 92 * s, height: 20 * s), cornerRadius: 10 * s), with: .color(.white))

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

/// 24px duotone setin SwiftUI çevirileri: beyaz kontur, hafif ton dolgusu.
/// Kaynak: afiet-mobile src/ui/icons.tsx (yaklaşık port, 24 grid).
struct DuotoneIcon: View {
    enum Kind { case bowl, sunrise, sun, moon, apple, broccoli, strawberry, egg, wheat, milk, plus }
    var kind: Kind
    var size: CGFloat
    var color: Color = .white

    var body: some View {
        Canvas { ctx, _ in
            let s = size / 24.0
            func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * s, y: y * s) }
            let line = StrokeStyle(lineWidth: 1.9 * s, lineCap: .round, lineJoin: .round)
            func stroke(_ p: Path) { ctx.stroke(p, with: .color(color), style: line) }
            func tone(_ p: Path) { ctx.fill(p, with: .color(color.opacity(0.16))) }

            switch kind {
            case .bowl:
                var b = Path()
                b.move(to: pt(4, 13))
                b.addArc(center: pt(12, 13), radius: 8 * s, startAngle: .degrees(180), endAngle: .degrees(0), clockwise: true)
                b.closeSubpath()
                tone(b); stroke(b)
                var s1 = Path(); s1.move(to: pt(9.5, 3.5)); s1.addQuadCurve(to: pt(9.5, 6), control: pt(10.3, 4.7)); s1.addQuadCurve(to: pt(9.5, 8.5), control: pt(8.7, 7.3)); stroke(s1)
                var s2 = Path(); s2.move(to: pt(14.5, 3.5)); s2.addQuadCurve(to: pt(14.5, 6), control: pt(15.3, 4.7)); s2.addQuadCurve(to: pt(14.5, 8.5), control: pt(13.7, 7.3)); stroke(s2)
            case .sunrise:
                var d = Path()
                d.move(to: pt(8.2, 15.5))
                d.addArc(center: pt(12, 15.5), radius: 3.8 * s, startAngle: .degrees(180), endAngle: .degrees(0), clockwise: false)
                tone(d); stroke(d)
                for (a, b) in [((12.0, 8.3), (12.0, 5.8)), ((6.7, 10.6), (5.3, 9.2)), ((17.3, 10.6), (18.7, 9.2)),
                               ((3.5, 15.5), (6.1, 15.5)), ((17.9, 15.5), (20.5, 15.5)), ((8.0, 19.2), (16.0, 19.2))] {
                    var l = Path(); l.move(to: pt(a.0, a.1)); l.addLine(to: pt(b.0, b.1)); stroke(l)
                }
            case .sun:
                let c = Path(ellipseIn: CGRect(x: 8 * s, y: 8 * s, width: 8 * s, height: 8 * s))
                tone(c); stroke(c)
                for (a, b) in [((12.0, 3.5), (12.0, 5.5)), ((12.0, 18.5), (12.0, 20.5)), ((3.5, 12.0), (5.5, 12.0)), ((18.5, 12.0), (20.5, 12.0)),
                               ((6.0, 6.0), (7.4, 7.4)), ((16.6, 16.6), (18.0, 18.0)), ((18.0, 6.0), (16.6, 7.4)), ((7.4, 16.6), (6.0, 18.0))] {
                    var l = Path(); l.move(to: pt(a.0, a.1)); l.addLine(to: pt(b.0, b.1)); stroke(l)
                }
            case .moon:
                var m = Path()
                m.move(to: pt(20, 14.1))
                m.addArc(center: pt(12, 12.6), radius: 8 * s, startAngle: .degrees(10), endAngle: .degrees(230), clockwise: false)
                m.addQuadCurve(to: pt(20, 14.1), control: pt(16, 16.5))
                m.closeSubpath()
                tone(m); stroke(m)
            case .apple:
                var a = Path()
                a.move(to: pt(12, 8.6))
                a.addCurve(to: pt(5.9, 9.8), control1: pt(10, 7.1), control2: pt(7.1, 7.6))
                a.addCurve(to: pt(6.9, 17.4), control1: pt(4.6, 12.1), control2: pt(5.4, 15.3))
                a.addCurve(to: pt(10.5, 19.9), control1: pt(7.9, 18.9), control2: pt(9.2, 20.0))
                a.addCurve(to: pt(13.5, 19.9), control1: pt(11.0, 19.6), control2: pt(13.0, 19.6))
                a.addCurve(to: pt(17.1, 17.4), control1: pt(14.8, 20.0), control2: pt(16.1, 18.9))
                a.addCurve(to: pt(18.1, 9.8), control1: pt(18.6, 15.3), control2: pt(19.4, 12.1))
                a.addCurve(to: pt(12, 8.6), control1: pt(16.9, 7.6), control2: pt(14, 7.1))
                a.closeSubpath()
                tone(a); stroke(a)
                var stem = Path(); stem.move(to: pt(12, 8.6)); stem.addQuadCurve(to: pt(14.2, 4.5), control: pt(12, 5.9)); stroke(stem)
            case .broccoli:
                var b = Path()
                b.move(to: pt(6.6, 12.9))
                b.addQuadCurve(to: pt(6.9, 7.0), control: pt(4.4, 9.5))
                b.addQuadCurve(to: pt(15.7, 6.0), control: pt(9.5, 3.0))
                b.addQuadCurve(to: pt(17.4, 12.9), control: pt(20.5, 9.5))
                b.closeSubpath()
                tone(b); stroke(b)
                var st = Path()
                st.move(to: pt(10.1, 12.9)); st.addLine(to: pt(9.6, 17.4))
                st.addQuadCurve(to: pt(11.5, 19.5), control: pt(9.8, 19.5))
                st.addLine(to: pt(12.5, 19.5))
                st.addQuadCurve(to: pt(14.4, 17.4), control: pt(14.2, 19.5))
                st.addLine(to: pt(13.9, 12.9))
                stroke(st)
            case .strawberry:
                var f = Path()
                f.move(to: pt(12, 20.4))
                f.addCurve(to: pt(18.2, 12.9), control1: pt(15.7, 18.8), control2: pt(18.2, 16.1))
                f.addCurve(to: pt(14.2, 8.9), control1: pt(18.2, 10.5), control2: pt(16.3, 8.9))
                f.addCurve(to: pt(12, 9.8), control1: pt(13.4, 8.9), control2: pt(12.6, 9.2))
                f.addCurve(to: pt(9.8, 8.9), control1: pt(11.4, 9.2), control2: pt(10.6, 8.9))
                f.addCurve(to: pt(5.8, 12.9), control1: pt(7.7, 8.9), control2: pt(5.8, 10.5))
                f.addCurve(to: pt(12, 20.4), control1: pt(5.8, 16.1), control2: pt(8.3, 18.8))
                f.closeSubpath()
                tone(f); stroke(f)
                var l1 = Path(); l1.move(to: pt(12, 8.8)); l1.addLine(to: pt(12, 6.2)); stroke(l1)
                var l2 = Path(); l2.move(to: pt(12, 6.2)); l2.addQuadCurve(to: pt(8.6, 4.5), control: pt(10, 6.1)); stroke(l2)
                var l3 = Path(); l3.move(to: pt(12, 6.2)); l3.addQuadCurve(to: pt(15.4, 4.5), control: pt(14, 6.1)); stroke(l3)
            case .egg:
                var e = Path()
                e.move(to: pt(12, 4.2))
                e.addCurve(to: pt(6.1, 12.9), control1: pt(9, 4.2), control2: pt(6.1, 8.7))
                e.addCurve(to: pt(12, 19.2), control1: pt(6.1, 16.4), control2: pt(8.7, 19.2))
                e.addCurve(to: pt(17.9, 12.9), control1: pt(15.3, 19.2), control2: pt(17.9, 16.4))
                e.addCurve(to: pt(12, 4.2), control1: pt(17.9, 8.7), control2: pt(15, 4.2))
                e.closeSubpath()
                tone(e); stroke(e)
            case .wheat:
                var stem = Path(); stem.move(to: pt(12, 21)); stem.addLine(to: pt(12, 6)); stroke(stem)
                for y in [9.8, 13.4, 17.0] {
                    var l = Path(); l.move(to: pt(12, y)); l.addQuadCurve(to: pt(7.5, y - 2.9), control: pt(8.6, y - 0.4)); l.addQuadCurve(to: pt(12, y), control: pt(10.6, y - 2.7)); tone(l); stroke(l)
                    var r = Path(); r.move(to: pt(12, y)); r.addQuadCurve(to: pt(16.5, y - 2.9), control: pt(15.4, y - 0.4)); r.addQuadCurve(to: pt(12, y), control: pt(13.4, y - 2.7)); tone(r); stroke(r)
                }
            case .milk:
                var m = Path()
                m.move(to: pt(7.8, 4)); m.addLine(to: pt(16.2, 4)); m.addLine(to: pt(15.05, 18.8))
                m.addQuadCurve(to: pt(13.05, 20.7), control: pt(15, 20.7))
                m.addLine(to: pt(10.95, 20.7))
                m.addQuadCurve(to: pt(8.95, 18.8), control: pt(9, 20.7))
                m.closeSubpath()
                tone(m); stroke(m)
                var w = Path(); w.move(to: pt(8.3, 10.6)); w.addQuadCurve(to: pt(12, 10.6), control: pt(10.15, 9.6)); w.addQuadCurve(to: pt(15.7, 10.6), control: pt(13.85, 11.6)); stroke(w)
            case .plus:
                var p1 = Path(); p1.move(to: pt(12, 5.5)); p1.addLine(to: pt(12, 18.5)); stroke(p1)
                var p2 = Path(); p2.move(to: pt(5.5, 12)); p2.addLine(to: pt(18.5, 12)); stroke(p2)
            }
        }
        .frame(width: size, height: size)
    }
}

/// 7 noktalı ritim şeridi.
struct RhythmDots: View {
    let state: WidgetState
    var dot: CGFloat = 11
    var body: some View {
        HStack(spacing: dot * 0.6) {
            ForEach(0..<7, id: \.self) { i in
                if i == state.todayIndex {
                    Circle()
                        .fill(Color.white.opacity(state.dots[i] == 1 ? 1 : 0.25))
                        .frame(width: dot - 1, height: dot - 1)
                        .overlay(Circle().stroke(mint, lineWidth: 2.5))
                } else {
                    Circle()
                        .fill(Color.white.opacity(state.dots[i] == 1 ? 1 : 0.22))
                        .frame(width: dot, height: dot)
                }
            }
        }
    }
}

func rhythmLabel(_ state: WidgetState) -> String {
    state.done >= state.goal ? "Bu hafta afiyettesin" : "Bu hafta \(state.done) afiyet günü"
}

// MARK: - Küçük boy

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
                Text(rhythmLabel(entry.state))
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundColor(mint)
                RhythmDots(state: entry.state)
                    .padding(.top, 7)
                HStack(spacing: 6) {
                    DuotoneIcon(kind: .plus, size: 13)
                    Text(entry.meal.label)
                        .font(.system(size: 12.5, weight: .bold, design: .rounded))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(Capsule().fill(Color.white.opacity(0.18)))
                .padding(.top, 12)
            }
            AfiView(size: 118)
                .offset(x: 62, y: -58)
        }
        .padding(14)
        .widgetURL(URL(string: "afiet://ekle?ogun=\(entry.meal.key)"))
    }
}

// MARK: - Orta boy

struct MealPill: View {
    let icon: DuotoneIcon.Kind
    let label: String
    let key: String
    let active: Bool
    var body: some View {
        Link(destination: URL(string: "afiet://ekle?ogun=\(key)")!) {
            VStack(spacing: 2) {
                DuotoneIcon(kind: icon, size: 15)
                Text(label)
                    .font(.system(size: 9.5, weight: active ? .bold : .semibold, design: .rounded))
                    .foregroundColor(.white.opacity(active ? 1 : 0.9))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 5)
            .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(active ? 0.38 : 0.16)))
        }
    }
}

struct RitimMediumView: View {
    let entry: RitimEntry
    let coreGroups: [(String, DuotoneIcon.Kind)] = [
        ("sebze", .broccoli), ("meyve", .strawberry), ("protein", .egg), ("tahil", .wheat), ("sut", .milk),
    ]
    var body: some View {
        let covered = Set(entry.state.covered ?? [])
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("afiet")
                        .font(.system(size: 17, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                    Text("\(rhythmLabel(entry.state)) · hedef \(entry.state.goal)")
                        .font(.system(size: 10.5, weight: .semibold, design: .rounded))
                        .foregroundColor(mint)
                        .lineLimit(1)
                }
                RhythmDots(state: entry.state, dot: 10)
                    .padding(.top, 7)
                Spacer()
                Text("BUGÜNÜN DENGESİ")
                    .font(.system(size: 8.5, weight: .semibold, design: .rounded))
                    .foregroundColor(mint.opacity(0.9))
                HStack(spacing: 11) {
                    ForEach(coreGroups, id: \.0) { g in
                        DuotoneIcon(kind: g.1, size: 17)
                            .opacity(covered.contains(g.0) ? 1 : 0.32)
                    }
                }
                .padding(.top, 3)
                Spacer()
                HStack(spacing: 6) {
                    MealPill(icon: .sunrise, label: "Kahvaltı", key: "kahvalti", active: entry.meal.key == "kahvalti")
                    MealPill(icon: .sun, label: "Öğle", key: "ogle", active: entry.meal.key == "ogle")
                    MealPill(icon: .moon, label: "Akşam", key: "aksam", active: entry.meal.key == "aksam")
                    MealPill(icon: .apple, label: "Ara", key: "ara", active: entry.meal.key == "ara")
                }
            }
            AfiView(size: 92)
                .padding(.trailing, -4)
        }
        .padding(14)
    }
}

// MARK: - Kilit ekranı

struct RitimCircularView: View {
    let entry: RitimEntry
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            Circle()
                .stroke(Color.white.opacity(0.22), lineWidth: 5)
                .padding(3)
            Circle()
                .trim(from: 0, to: min(1, CGFloat(entry.state.done) / CGFloat(max(1, entry.state.goal))))
                .stroke(Color.white, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .padding(3)
            DuotoneIcon(kind: .bowl, size: 20)
        }
        .widgetURL(URL(string: "afiet://ekle?ogun=\(entry.meal.key)"))
    }
}

struct RitimRectangularView: View {
    let entry: RitimEntry
    var body: some View {
        HStack(spacing: 8) {
            DuotoneIcon(kind: .bowl, size: 22)
            VStack(alignment: .leading, spacing: 4) {
                Text(rhythmLabel(entry.state))
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .lineLimit(1)
                RhythmDots(state: entry.state, dot: 8)
            }
            Spacer(minLength: 0)
        }
        .widgetURL(URL(string: "afiet://ekle?ogun=\(entry.meal.key)"))
    }
}

// MARK: - Widget tanımı

struct RitimEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: RitimEntry
    var body: some View {
        switch family {
        case .systemMedium:
            RitimMediumView(entry: entry)
                .containerBackground(for: .widget) { brandGradient }
        case .accessoryCircular:
            RitimCircularView(entry: entry)
                .containerBackground(for: .widget) { Color.clear }
        case .accessoryRectangular:
            RitimRectangularView(entry: entry)
                .containerBackground(for: .widget) { Color.clear }
        default:
            RitimSmallView(entry: entry)
                .containerBackground(for: .widget) { brandGradient }
        }
    }
}

struct RitimWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "AfiyetRitmi", provider: RitimProvider()) { entry in
            RitimEntryView(entry: entry)
        }
        .configurationDisplayName("afiyet ritmin")
        .description("Haftalık ritmin ve tek dokunuşla öğün ekleme.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
        .contentMarginsDisabled()
    }
}

@main
struct RitimWidgetBundle: WidgetBundle {
    var body: some Widget {
        RitimWidget()
    }
}
