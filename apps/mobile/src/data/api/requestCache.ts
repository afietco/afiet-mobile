/**
 * GET istekleri için istek birleştirme (in-flight dedup) + çok kısa ömürlü yanıt
 * önbelleği. Backend'in yaptığı sorgu birleştirmenin istemci tarafı karşılığı:
 * aynı ekranın birden çok bileşeni aynı veriyi ayrı ayrı çekmesin.
 *
 * Neden gerekli (ölçüm): repository katmanının TAMAMI ağ çağrısıdır (yerel
 * kopya yok) ve `useLive` her `notify()`'da sorguyu yeniden koşar. Bugün ekranı
 * TEK açılışta `/v1/summary?date=bugün` isteğini DÖRT kez yapıyordu
 * (TodayScreen + useWaterTarget + NutritionCard + BodyMiniCard), `/v1/measurements`
 * ve `/v1/meals/logged-dates` ikişer kez. Her öğün/su kaydı bu fırtınayı
 * baştan tetikliyordu.
 *
 * İki mekanizma:
 *  1) in-flight dedup: aynı yol için uçuşta bir istek varken gelen ikinci
 *     çağrı AYNI promise'i alır. Bayatlama riski YOK (sonuç birebir aynı ağ
 *     yanıtıdır). Bugün'ün eşzamanlı 4× özet isteğini 1'e indiren asıl kazanç.
 *  2) kısa ömürlü önbellek (ttlMs): art arda (ama tam eşzamanlı olmayan)
 *     aynı yol isteklerini de birleştirir: ebeveyn profili çekip çocuklar biraz
 *     sonra mount olduğunda, ilk sonuç TTL içinde tekrar servis edilir.
 *
 * Tazelik (mutasyon geçersizlemesi): POST/PUT/PATCH/DELETE başarıyla dönünce
 * çağıran `invalidateAll()` çağırır. Böylece özet gibi TÜM türev uçlar bir
 * yazımdan sonra asla önbellekten bayat okunmaz. `notify()` tetikli tazeleme
 * (mutasyondan hemen sonra) temizlenmiş önbelleği görüp ağa gider; o
 * tazeleme fırtınası da kendi içinde in-flight dedup ile birleşir.
 *
 * Yaşam süresi: önbellek `createApiClient` örneğine bağlıdır → oturum başına
 * izole, giriş/çıkışta (yeni istemci) sıfırlanır.
 */

export interface RequestCacheOptions {
  /** Yanıt önbelleği taze sayılma süresi (ms). Varsayılan 2000. Kısa tutulur:
   *  amaç mount dalgasını toplamak; her mutasyon zaten tümünü geçersiz kılar. */
  ttlMs?: number
  /** Test için enjekte edilebilir saat; üretimde Date.now. */
  now?: () => number
}

export interface RequestCache {
  /** GET yolu (`key`) için önbellek + dedup uygulayarak `fetcher`'ı sarar. */
  dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T>
  /** Tüm okuma önbelleğini ve uçuştaki kayıtları geçersiz kılar (mutasyon sonrası). */
  invalidateAll(): void
}

interface Inflight {
  p: Promise<unknown>
  /** Bu istek başlatıldığındaki epoch (geçersizleme yarışı koruması için). */
  epoch: number
}

export function createRequestCache(opts: RequestCacheOptions = {}): RequestCache {
  const ttlMs = opts.ttlMs ?? 2000
  const now = opts.now ?? Date.now
  const inflight = new Map<string, Inflight>()
  const fresh = new Map<string, { at: number; value: unknown }>()

  /* Geçersizleme sayacı. invalidateAll() bunu artırır; bir istek yalnız
     BAŞLADIĞI epoch hâlâ güncelse sonucunu önbelleğe yazar. Böylece mutasyondan
     ÖNCE uçmaya başlamış (dolayısıyla bayat) bir GET, mutasyondan sonra taze
     kayıt gibi önbelleğe SIZAMAZ. */
  let epoch = 0

  return {
    dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
      const hit = fresh.get(key)
      if (hit && now() - hit.at < ttlMs) return Promise.resolve(hit.value as T)

      const pending = inflight.get(key)
      if (pending) return pending.p as Promise<T>

      const startedAt = epoch
      const p = fetcher()
        .then((value) => {
          // Yalnız aradan geçersizleme geçmediyse önbelleğe al.
          if (epoch === startedAt) fresh.set(key, { at: now(), value })
          return value
        })
        .finally(() => {
          // Yalnız hâlâ BİZİM kaydımızsa sil; yeni bir istek üzerine yazmışsa dokunma.
          if (inflight.get(key)?.p === p) inflight.delete(key)
        })

      inflight.set(key, { p, epoch: startedAt })
      return p
    },

    invalidateAll(): void {
      epoch++
      fresh.clear()
      inflight.clear()
    },
  }
}
