import { useEffect, useRef, useState } from 'react'
import { subscribe, type TableName } from './live'

/**
 * Dexie useLiveQuery'nin native karşılığı — web'den ekran taşırken tek fark
 * tablo listesi:  useLiveQuery(() => q, deps)  →  useLive(['su'], () => q, deps)
 * Sorgu, verilen tablolardan biri her değiştiğinde yeniden çalışır.
 * İlk sonuç gelene dek undefined döner; deps değişiminde eski değer korunur.
 */
export function useLive<T>(
  tables: TableName[],
  query: () => Promise<T>,
  deps: unknown[],
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined)
  const runId = useRef(0)

  useEffect(() => {
    let alive = true
    const run = () => {
      const id = ++runId.current
      void query().then((v) => {
        // Yarış koruması: yalnızca en son başlatılan sorgunun sonucu yazılır
        if (alive && id === runId.current) setValue(v)
      })
    }
    run()
    const unsub = subscribe(tables, run)
    return () => {
      alive = false
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useLiveQuery paritesi: çağıran deps verir
  }, [tables.join('|'), ...deps])

  return value
}
