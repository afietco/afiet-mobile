import type { ReactNode } from 'react'

/** Gizlilik politikası — herkese açık sayfa (App Store / TestFlight
    gizlilik bağlantısı buraya işaret eder). Profil kapısının DIŞINDA:
    uygulamayı hiç kurmamış ziyaretçi ve Apple incelemesi de görür. */

const EFFECTIVE = '10 Temmuz 2026'
const CONTACT = 'rberkkaratas@gmail.com'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-2 text-lg font-extrabold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-2 text-[15px] leading-relaxed text-soft">{children}</div>
    </section>
  )
}

export function PrivacyPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-5 pt-10 pb-16">
      <header>
        <p className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-500">
          afiet
        </p>
        <p className="mt-0.5 text-soft">Sayma, dengele.</p>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Gizlilik Politikası</h1>
        <p className="mt-1 text-sm text-faint">Yürürlük: {EFFECTIVE}</p>
      </header>

      <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-[15px] leading-relaxed text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
        <span className="font-bold">Kısaca:</span> afiet'e girdiğin her şey senin cihazında
        kalır. Hesap yok, sunucu yok, izleme yok, reklam yok. Verilerini biz göremeyiz —
        çünkü bize hiç gelmez. 💚
      </div>

      <Section title="Hangi veriler, nerede?">
        <p>
          afiet'te tuttuğun bilgiler — isim ve avatar, öğün/su/ölçüm kayıtların, tema tercihin —
          yalnızca kendi cihazında saklanır: mobil uygulamada cihazın yerel veritabanında,
          web sürümünde tarayıcının site deposunda.
        </p>
        <p>Bu veriler internete gönderilmez, bizim ya da üçüncü tarafların eline geçmez.</p>
      </Section>

      <Section title="Toplamadıklarımız">
        <p>
          Hesap ya da üyelik yoktur; e-posta, telefon veya kimlik bilgisi istemeyiz. Analitik,
          izleme veya reklam teknolojisi kullanmayız. Verilerini kimseyle paylaşmayız —
          paylaşacak verimiz olmaz.
        </p>
      </Section>

      <Section title="Verini silmek">
        <p>
          Mobil uygulamayı cihazından sildiğinde tüm afiet verilerin de silinir. Web sürümünde
          tarayıcının site verilerini temizlemek aynı işi görür. Cihazından başka kopya yoktur.
        </p>
      </Section>

      <Section title="Çocuklar">
        <p>
          afiet aile içi kullanım için tasarlandı. Veriler cihaz dışına çıkmadığından, yaşı ne
          olursa olsun hiçbir kullanıcıdan veri toplanmaz.
        </p>
      </Section>

      <Section title="Değişiklikler">
        <p>
          İleride isteğe bağlı hesap veya cihazlar arası eşitleme gibi özellikler gelirse bu
          politika güncellenir, değişiklik bu sayfada ve uygulama içinde duyurulur. Bugün
          geçerli olan tabloyu yukarıda okudun.
        </p>
      </Section>

      <Section title="İletişim">
        <p>
          Soruların için:{' '}
          <a href={`mailto:${CONTACT}`} className="font-semibold text-emerald-600 underline dark:text-emerald-400">
            {CONTACT}
          </a>
        </p>
      </Section>

      <p className="mt-10 border-t border-line/60 pt-4 text-xs leading-relaxed text-faint">
        English summary: afiet stores all data locally on your device only. There are no
        accounts, no servers, no analytics, no ads and no third-party sharing. Deleting the
        app (or clearing browser site data on the web) removes all data. Contact: {CONTACT}
      </p>
    </div>
  )
}
