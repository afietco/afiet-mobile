import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useState } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import { ApiError, type ApiGroupSummary, type ApiGroupView } from '@/data/api/client'

/**
 * Grup listesi + eylemleri — useSummary'nin API-tabanlı deseninin
 * zenginleştirilmiş hâli. Gruplar "canlı" tablo olmadığından (useLive tablo
 * birliğinde yok) kendi durumunu tutar: yükleniyor · hata (tekrar dene) ·
 * hazır (boş liste = hiç grupta değil).
 *
 * Tam görünüm dönen eylemler (create/join/rename/removeMember) listedeki özeti
 * yanıttan tazeler — ekstra GET yok. Eylemler hata durumunda fırlatır; çağıran
 * sheet/kart yakalar ve `groupErrorMessage` ile anlaşılır Türkçe metne çevirir.
 * Kurma/katılma başarısında Success haptiği burada verilir (tek yer).
 */

export type GroupsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; groups: ApiGroupSummary[] }

/** req() backend mesajı bulamayınca "HTTP nnn" üretir — kullanıcıya gösterme. */
function backendMessage(e: ApiError): string | null {
  return e.message && !/^HTTP \d+$/.test(e.message) ? e.message : null
}

/** ApiError durum kodunu bağlama göre sıcak Türkçe mesaja çevirir. */
export function groupErrorMessage(e: unknown, context: 'join' | 'group' | 'generic'): string {
  if (e instanceof ApiError) {
    if (context === 'join') {
      if (e.status === 404) return 'Bu ID ile bir grup bulamadık. Kontrol eder misin?'
      if (e.status === 409) return 'Zaten bir gruptasın — önce mevcut grubundan ayrılmalısın.'
    }
    if (context === 'group' && e.status === 404)
      return 'Bu grubu göremiyorsun — üyeliğin sona ermiş olabilir.'
    if (e.status === 403) return 'Bunu yalnızca grubun kurucusu yapabilir.'
    const msg = backendMessage(e)
    if (msg) return msg
  }
  return 'Bir şeyler ters gitti, tekrar dene.'
}

/** Tam görünümden liste özeti türet (listeyi ekstra GET'siz taze tutmak için). */
function toSummary(v: ApiGroupView): ApiGroupSummary {
  return {
    id: v.group.id,
    name: v.group.name,
    code: v.group.code,
    emoji: v.group.emoji,
    myRole: v.myRole,
    memberCount: v.members.length,
    createdAt: v.group.createdAt,
  }
}

export interface UseGroups {
  state: GroupsState
  /** Listeyi yeniden çek (hata ekranındaki "tekrar dene"). */
  reload: () => Promise<void>
  /** Kur/katıl — dönen tam görünümle liste güncellenir. */
  createGroup: (name: string, emoji: string | null) => Promise<ApiGroupView>
  joinGroup: (code: string) => Promise<ApiGroupView>
  /** Sayfa görünümü için tam görünüm; date verilirse üyeler energyRatio taşır. */
  getGroup: (groupId: string, date?: string) => Promise<ApiGroupView>
  /** Ad ve/veya logo güncelle (yalnız owner). */
  updateGroup: (groupId: string, patch: { name?: string; emoji?: string }) => Promise<ApiGroupView>
  /** Kendi userId'nle ayrıl → grup listeden düşer. */
  leaveGroup: (groupId: string, myUserId: string) => Promise<void>
  /** Grubu kalıcı sil (owner + tek üye) → grup listeden düşer. */
  deleteGroup: (groupId: string) => Promise<void>
  /** Owner başka üyeyi çıkarır → güncel görünümü döner (sayfa tazeler). */
  removeMember: (groupId: string, userId: string) => Promise<ApiGroupView>
}

export function useGroups(): UseGroups {
  const [state, setState] = useState<GroupsState>({ status: 'loading' })

  /** Özeti listeye işle (varsa yerinde güncelle, yoksa sona ekle). */
  const upsert = useCallback((v: ApiGroupView) => {
    const sum = toSummary(v)
    setState((s) => {
      if (s.status !== 'ready') return { status: 'ready', groups: [sum] }
      const exists = s.groups.some((g) => g.id === sum.id)
      return {
        status: 'ready',
        groups: exists ? s.groups.map((g) => (g.id === sum.id ? sum : g)) : [...s.groups, sum],
      }
    })
  }, [])

  const reload = useCallback(async () => {
    // Elimizde liste varken yenilerken "yükleniyor"a düşüp titretme.
    setState((s) => (s.status === 'ready' ? s : { status: 'loading' }))
    try {
      const { groups } = await requireApi().listGroups()
      setState({ status: 'ready', groups })
    } catch (e) {
      setState({ status: 'error', message: groupErrorMessage(e, 'generic') })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const createGroup = useCallback(
    async (name: string, emoji: string | null) => {
      const view = await requireApi().createGroup(name.trim(), emoji)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      upsert(view)
      return view
    },
    [upsert],
  )

  const joinGroup = useCallback(
    async (code: string) => {
      const view = await requireApi().joinGroup(code.trim().toUpperCase())
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      upsert(view)
      return view
    },
    [upsert],
  )

  const getGroup = useCallback(
    (groupId: string, date?: string) => requireApi().getGroup(groupId, date),
    [],
  )

  const updateGroup = useCallback(
    async (groupId: string, patch: { name?: string; emoji?: string }) => {
      const view = await requireApi().updateGroup(groupId, patch)
      upsert(view)
      return view
    },
    [upsert],
  )

  const leaveGroup = useCallback(async (groupId: string, myUserId: string) => {
    await requireApi().removeGroupMember(groupId, myUserId)
    setState((s) =>
      s.status === 'ready'
        ? { status: 'ready', groups: s.groups.filter((g) => g.id !== groupId) }
        : s,
    )
  }, [])

  const deleteGroup = useCallback(async (groupId: string) => {
    await requireApi().deleteGroup(groupId)
    setState((s) =>
      s.status === 'ready'
        ? { status: 'ready', groups: s.groups.filter((g) => g.id !== groupId) }
        : s,
    )
  }, [])

  const removeMember = useCallback(
    async (groupId: string, userId: string) => {
      await requireApi().removeGroupMember(groupId, userId)
      const view = await requireApi().getGroup(groupId)
      upsert(view)
      return view
    },
    [upsert],
  )

  return {
    state,
    reload,
    createGroup,
    joinGroup,
    getGroup,
    updateGroup,
    leaveGroup,
    deleteGroup,
    removeMember,
  }
}
