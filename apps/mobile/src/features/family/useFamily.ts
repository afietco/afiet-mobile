import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useState } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import { ApiError, type ApiFamily, type ApiFamilyInvite } from '@/data/api/client'

/**
 * Aile durumu + eylemleri — useSummary'nin API-tabanlı deseninin zenginleştirilmiş
 * hâli. Aile "canlı" tablo olmadığından (useLive tablo birliğinde yok) kendi
 * durumunu tutar: yükleniyor · hata (tekrar dene) · ailede değil (404) · ailede.
 *
 * Eylemler (create/join/rename/leave/remove) hata durumunda fırlatır; çağıran
 * sheet/kart yakalar ve `familyErrorMessage` ile anlaşılır Türkçe metne çevirir.
 * Kayıt/katılma başarısında Success haptiği burada verilir (tek yer).
 */

export type FamilyState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'none' }
  | { status: 'in'; data: ApiFamily }

/** ApiError durum kodunu bağlama göre sıcak Türkçe mesaja çevirir. */
export function familyErrorMessage(e: unknown, context: 'create' | 'join' | 'generic'): string {
  if (e instanceof ApiError) {
    if (e.status === 409) return 'Zaten bir ailedesin. Önce mevcut ailenden ayrıl.'
    if (context === 'join') {
      if (e.status === 404) return 'Bu kodu bulamadık. Tekrar kontrol eder misin?'
      if (e.status === 410) return 'Bu kodun süresi dolmuş ya da doldu. Yeni bir kod iste.'
    }
    if (e.message) return e.message
  }
  return 'Bir şeyler ters gitti, tekrar dene.'
}

export interface UseFamily {
  state: FamilyState
  /** Aileyi yeniden çek (hata ekranındaki "tekrar dene" ve üye değişimi sonrası). */
  reload: () => Promise<void>
  createFamily: (name: string) => Promise<void>
  joinFamily: (code: string) => Promise<void>
  /** Yeni davet kodu üretir; gövdeyi döner (kart geçici olarak gösterir/paylaşır). */
  createInvite: () => Promise<ApiFamilyInvite>
  renameFamily: (name: string) => Promise<void>
  /** Kendi userId'nle ayrıl → durum "ailede değil"e döner. */
  leaveFamily: (myUserId: string) => Promise<void>
  /** Owner başka üyeyi çıkarır → üye listesi yenilenir. */
  removeMember: (userId: string) => Promise<void>
}

export function useFamily(): UseFamily {
  const [state, setState] = useState<FamilyState>({ status: 'loading' })

  const reload = useCallback(async () => {
    // Elimizde aile varken yenilerken "yükleniyor"a düşüp titretme.
    setState((s) => (s.status === 'in' ? s : { status: 'loading' }))
    try {
      const data = await requireApi().getFamily()
      setState({ status: 'in', data })
    } catch (e) {
      // 404 = ailede değil; hata değil, boş durum.
      if (e instanceof ApiError && e.status === 404) setState({ status: 'none' })
      else setState({ status: 'error', message: familyErrorMessage(e, 'generic') })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const createFamily = useCallback(async (name: string) => {
    const data = await requireApi().createFamily(name.trim())
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setState({ status: 'in', data })
  }, [])

  const joinFamily = useCallback(async (code: string) => {
    const data = await requireApi().joinFamily(code.trim().toUpperCase())
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setState({ status: 'in', data })
  }, [])

  const createInvite = useCallback(() => requireApi().createInvite(), [])

  const renameFamily = useCallback(async (name: string) => {
    const data = await requireApi().renameFamily(name.trim())
    setState({ status: 'in', data })
  }, [])

  const leaveFamily = useCallback(async (myUserId: string) => {
    await requireApi().removeMember(myUserId)
    setState({ status: 'none' })
  }, [])

  const removeMember = useCallback(
    async (userId: string) => {
      await requireApi().removeMember(userId)
      await reload()
    },
    [reload],
  )

  return {
    state,
    reload,
    createFamily,
    joinFamily,
    createInvite,
    renameFamily,
    leaveFamily,
    removeMember,
  }
}
