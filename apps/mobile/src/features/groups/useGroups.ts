import * as Haptics from 'expo-haptics'
import { useEffect, useSyncExternalStore } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import { ApiError, type ApiGroupSummary, type ApiGroupView } from '@/data/api/client'
import { resolveGroupInvite, type GroupInviteResolution } from './groupInvite'

/**
 * Grup listesi + eylemleri: GLOBAL modül-deposu (notifications.ts / greetings.ts
 * deseninin aynısı). Gruplar live.ts'in canlı tablo birliğinde (TableName)
 * OLMADIĞINDAN durumunu MODÜL DÜZEYİNDE tutar: böylece tüm useGroups tüketicileri
 * (Bugün'deki GroupMiniCard + Grubum sekmesi + Profil) TEK listeyi paylaşır ve
 * bir yerde kurma/katılma/ayrılma diğer ekranları da anında günceller (yeniden
 * açmaya gerek kalmaz). Durum: yükleniyor · hata (tekrar dene) · hazır (boş
 * liste = hiç grupta değil).
 *
 * Tam görünüm dönen eylemler (create/join/rename/removeMember) listedeki özeti
 * yanıttan tazeler, ekstra GET yok. Eylemler hata durumunda fırlatır; çağıran
 * sheet/kart yakalar ve `groupErrorMessage` ile anlaşılır Türkçe metne çevirir.
 * Kurma/katılma başarısında Success haptiği burada verilir (tek yer).
 *
 * Enerji halkaları: liste özeti güne bağlı veri taşımaz, üyelerin enerji oranı
 * yalnız date'li tam görünümdedir (getGroup). Bu yüzden besin eklendiğinde
 * (notify('meals')) halkaları tazeleyen taraf, aktif grubun date'li görünümünü
 * öğün değişimine bağlı yeniden çeken Grubum sayfasıdır (bkz. grubum.tsx meals
 * aboneliği); listeyi öğünde yeniden çekmek boşa istek olurdu.
 */

export type GroupsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; groups: ApiGroupSummary[] }

/** req() backend mesajı bulamayınca "HTTP nnn" üretir, kullanıcıya gösterme. */
function backendMessage(e: ApiError): string | null {
  return e.message && !/^HTTP \d+$/.test(e.message) ? e.message : null
}

/** ApiError durum kodunu bağlama göre sıcak Türkçe mesaja çevirir. */
export function groupErrorMessage(e: unknown, context: 'join' | 'group' | 'generic'): string {
  if (e instanceof ApiError) {
    if (context === 'join') {
      if (e.status === 404) return 'Bu ID ile bir grup bulamadık. Kontrol eder misin?'
      if (e.status === 409) return 'Zaten bir gruptasın, önce mevcut grubundan ayrılmalısın.'
    }
    if (context === 'group' && e.status === 404)
      return 'Bu grubu göremiyorsun, üyeliğin sona ermiş olabilir.'
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
  /** Resolves a pending invitation after the current group list is available. */
  resolveInvite: (code: string) => GroupInviteResolution | null
  /** Listeyi yeniden çek (hata ekranındaki "tekrar dene"). */
  reload: () => Promise<void>
  /** Kur/katıl, dönen tam görünümle liste güncellenir. */
  createGroup: (name: string, emoji: string | null) => Promise<ApiGroupView>
  joinGroup: (code: string) => Promise<ApiGroupView>
  /** Sayfa görünümü için tam görünüm; date verilirse üyeler energyRatio taşır. */
  getGroup: (groupId: string, date?: string) => Promise<ApiGroupView>
  /** Ad, logo ve/veya keşif görünürlüğü güncelle (yalnız owner). */
  updateGroup: (
    groupId: string,
    patch: { name?: string; emoji?: string; isPublic?: boolean },
  ) => Promise<ApiGroupView>
  /** Kendi userId'nle ayrıl, grup listeden düşer. */
  leaveGroup: (groupId: string, myUserId: string) => Promise<void>
  /** Grubu kalıcı sil (owner + tek üye), grup listeden düşer. */
  deleteGroup: (groupId: string) => Promise<void>
  /** Kendi sofra görünürlüğünü değiştir (çağıran görünümü tazeler). */
  setMyVisibility: (groupId: string, visible: boolean) => Promise<void>
  /** Owner başka üyeyi çıkarır, güncel görünümü döner (sayfa tazeler). */
  removeMember: (groupId: string, userId: string) => Promise<ApiGroupView>
}

// ── Global depo (notifications.ts / greetings.ts deseni) ─────────────────────
// state ASLA yerinde değiştirilmez; her geçiş YENİ nesne yazar, böylece
// useSyncExternalStore referans kıyasıyla değişimi görür. Eylemler modül
// düzeyinde ve KARARLI referanstır: tüketiciler arasında paylaşılır, useCallback
// gerekmez, hook imzası (state + eylemler) değişmeden korunur.

let state: GroupsState = { status: 'loading' }
const listeners = new Set<() => void>()
let inFlight: Promise<void> | null = null
let storeGeneration = 0

function getSnapshot(): GroupsState {
  return state
}

function subscribeStore(l: () => void): () => void {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

function setState(next: GroupsState) {
  state = next
  for (const l of listeners) l()
}

/** Özeti listeye işle (varsa yerinde güncelle, yoksa sona ekle). */
function upsert(v: ApiGroupView) {
  const sum = toSummary(v)
  if (state.status !== 'ready') {
    setState({ status: 'ready', groups: [sum] })
    return
  }
  const exists = state.groups.some((g) => g.id === sum.id)
  setState({
    status: 'ready',
    groups: exists
      ? state.groups.map((g) => (g.id === sum.id ? sum : g))
      : [...state.groups, sum],
  })
}

function reload(): Promise<void> {
  // Eşzamanlı çağrıları tek isteğe indir (iki tüketici aynı anda mount olabilir).
  if (inFlight) return inFlight
  const generation = storeGeneration
  // Hata ekranından "tekrar dene": yükleniyor'a dön. Hazır listeyi yenilerken
  // titretme (spinner'a düşme), eldeki listeyi göstermeye devam et.
  if (state.status === 'error') setState({ status: 'loading' })
  inFlight = (async () => {
    try {
      const { groups } = await requireApi().listGroups()
      if (generation !== storeGeneration) return
      setState({ status: 'ready', groups })
    } catch (e) {
      if (generation !== storeGeneration) return
      setState({ status: 'error', message: groupErrorMessage(e, 'generic') })
    } finally {
      if (generation === storeGeneration) inFlight = null
    }
  })()
  return inFlight
}

function resolveInvite(code: string): GroupInviteResolution | null {
  return state.status === 'ready' ? resolveGroupInvite(state.groups, code) : null
}

async function createGroup(name: string, emoji: string | null): Promise<ApiGroupView> {
  const generation = storeGeneration
  const view = await requireApi().createGroup(name.trim(), emoji)
  if (generation === storeGeneration) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    upsert(view)
  }
  return view
}

async function joinGroup(code: string): Promise<ApiGroupView> {
  const generation = storeGeneration
  const view = await requireApi().joinGroup(code.trim().toUpperCase())
  if (generation === storeGeneration) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    upsert(view)
  }
  return view
}

function getGroup(groupId: string, date?: string): Promise<ApiGroupView> {
  return requireApi().getGroup(groupId, date)
}

async function updateGroup(
  groupId: string,
  patch: { name?: string; emoji?: string; isPublic?: boolean },
): Promise<ApiGroupView> {
  const generation = storeGeneration
  const view = await requireApi().updateGroup(groupId, patch)
  if (generation === storeGeneration) upsert(view)
  return view
}

async function leaveGroup(groupId: string, myUserId: string): Promise<void> {
  const generation = storeGeneration
  await requireApi().removeGroupMember(groupId, myUserId)
  if (generation === storeGeneration && state.status === 'ready') {
    setState({ status: 'ready', groups: state.groups.filter((g) => g.id !== groupId) })
  }
}

function setMyVisibility(groupId: string, visible: boolean): Promise<void> {
  return requireApi().setMyGroupVisibility(groupId, visible)
}

async function deleteGroup(groupId: string): Promise<void> {
  const generation = storeGeneration
  await requireApi().deleteGroup(groupId)
  if (generation === storeGeneration && state.status === 'ready') {
    setState({ status: 'ready', groups: state.groups.filter((g) => g.id !== groupId) })
  }
}

async function removeMember(groupId: string, userId: string): Promise<ApiGroupView> {
  const generation = storeGeneration
  const api = requireApi()
  await api.removeGroupMember(groupId, userId)
  const view = await api.getGroup(groupId)
  if (generation === storeGeneration) upsert(view)
  return view
}

/** Clears group data and invalidates responses started by the previous session. */
export function resetGroupsStore(): void {
  storeGeneration += 1
  inFlight = null
  setState({ status: 'loading' })
}

export function useGroups(): UseGroups {
  const snap = useSyncExternalStore(subscribeStore, getSnapshot)
  // İlk tüketici mount olduğunda listeyi çek; eşzamanlı mount'lar reload'un
  // in-flight tekilleştirmesiyle tek GET'e iner. Sekmeye dönüşte de tazeler.
  useEffect(() => {
    void reload()
  }, [])
  return {
    state: snap,
    resolveInvite,
    reload,
    createGroup,
    joinGroup,
    getGroup,
    updateGroup,
    leaveGroup,
    deleteGroup,
    setMyVisibility,
    removeMember,
  }
}
