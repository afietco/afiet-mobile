import * as Haptics from 'expo-haptics'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, Alert, Pressable, Share, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthContext'
import type { ApiFamilyInvite, ApiFamilyMember } from '@/data/api/client'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconHeart, IconPencil, IconSparkles, IconTrash, IconUser } from '@/ui/icons'
import { FamilyNameSheet } from './FamilyNameSheet'
import { JoinFamilySheet } from './JoinFamilySheet'
import { familyErrorMessage, useFamily, type UseFamily } from './useFamily'

/**
 * Profil sekmesindeki "Ailem" bölümü. Sheet'ler @gorhom/bottom-sheet gereği
 * kaydırma alanının DIŞINA (ekran köküne) yerleşmeli; kart ise ScrollView içinde
 * durur. İkisi aynı aile durumunu paylaşsın diye küçük bir context kullanılır:
 * profil ekranı <FamilyProvider> ile sarar, içeride <FamilyCard/> (scroll'da) ve
 * <FamilySheets/> (scroll'un kardeşi) yer alır.
 */

interface FamilyCtx {
  fam: UseFamily
  myUserId: string | null
  create: { open: boolean; show: () => void; hide: () => void }
  join: { open: boolean; show: () => void; hide: () => void }
  rename: { open: boolean; show: () => void; hide: () => void }
}

const Ctx = createContext<FamilyCtx | null>(null)

function useFamilyCtx(): FamilyCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('FamilyCard/FamilySheets bir FamilyProvider içinde kullanılmalı')
  return ctx
}

export function FamilyProvider({ children }: { children: ReactNode }) {
  const fam = useFamily()
  const { userId } = useAuth()
  const [create, setCreate] = useState(false)
  const [join, setJoin] = useState(false)
  const [rename, setRename] = useState(false)

  const value: FamilyCtx = {
    fam,
    myUserId: userId,
    create: { open: create, show: () => setCreate(true), hide: () => setCreate(false) },
    join: { open: join, show: () => setJoin(true), hide: () => setJoin(false) },
    rename: { open: rename, show: () => setRename(true), hide: () => setRename(false) },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Davet kodunun geçerlilik notu (ör. "7 gün geçerli"). */
function expiryNote(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (!Number.isFinite(ms) || ms <= 0) return 'süresi doldu'
  const days = Math.ceil(ms / 86_400_000)
  return `${days} gün geçerli`
}

async function shareInvite(code: string) {
  try {
    await Share.share({
      message:
        `afiet'te ailemize katıl 🍲\n\n` +
        `Davet kodu: ${code}\n\n` +
        `afiet'i aç, Profil › Ailem › "Davet koduyla katıl"a dokun ve bu kodu gir. afiet — sayma, dengele.`,
    })
  } catch {
    // paylaşım iptal edildi / paylaşılamadı — sessiz geç
  }
}

function Shell({ children }: { children: ReactNode }) {
  const { isDark } = useTheme()
  return (
    <View className="mt-4 rounded-2xl bg-surface p-5">
      <View className="mb-3 flex-row items-center gap-2">
        <IconHeart size={18} color={isDark ? '#34d399' : '#059669'} />
        <AppText weight="bold" className="text-ink">
          Ailem
        </AppText>
      </View>
      {children}
    </View>
  )
}

function MemberRow({
  member,
  isMe,
  canRemove,
  onRemove,
}: {
  member: ApiFamilyMember
  isMe: boolean
  canRemove: boolean
  onRemove: () => void
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const trimmed = member.displayName?.trim()
  const name = trimmed || 'afiet üyesi'
  const initial = trimmed ? trimmed[0]?.toUpperCase() : null

  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
        {initial ? (
          <AppText weight="bold" className="text-soft">
            {initial}
          </AppText>
        ) : (
          <IconUser size={20} color={t.faint} />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-ink">
          {name}
          {isMe ? ' · sen' : ''}
        </AppText>
        {member.role === 'owner' ? (
          <AppText className="text-xs text-soft">kurucu</AppText>
        ) : null}
      </View>
      {canRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${name} adlı üyeyi çıkar`}
          onPress={onRemove}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <IconTrash size={18} color={isDark ? '#f87171' : '#dc2626'} />
        </Pressable>
      ) : null}
    </View>
  )
}

export function FamilyCard() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { fam, myUserId, create, join, rename } = useFamilyCtx()
  const { state } = fam
  const [invite, setInvite] = useState<ApiFamilyInvite | null>(null)
  const [invBusy, setInvBusy] = useState(false)

  // Aile değişince (ayrılma/yeni aile/katılma) önceki davet kodunu gösterme.
  // Aynı ailede kalırken (ör. üye çıkarma sonrası reload) kod korunur.
  const familyId = state.status === 'in' ? state.data.family.id : null
  useEffect(() => {
    setInvite(null)
  }, [familyId])

  if (state.status === 'loading') {
    return (
      <Shell>
        <View className="items-center py-4">
          <ActivityIndicator color={isDark ? '#34d399' : '#059669'} />
        </View>
      </Shell>
    )
  }

  if (state.status === 'error') {
    return (
      <Shell>
        <AppText className="mb-3 text-sm text-soft">{state.message}</AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => void fam.reload()}
          className="items-center rounded-xl bg-muted py-3"
        >
          <AppText weight="semibold" className="text-soft">
            Tekrar dene
          </AppText>
        </Pressable>
      </Shell>
    )
  }

  if (state.status === 'none') {
    return (
      <Shell>
        <AppText className="mb-4 text-sm text-soft">
          Ailenle birlikte dengede kalın — sofranızı paylaşın, birbirinizi kutlayın.
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={create.show}
          className="items-center rounded-xl bg-emerald-600 py-3.5"
        >
          <AppText weight="semibold" className="text-white">
            Aile oluştur
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={join.show}
          className="mt-2 items-center rounded-xl bg-muted py-3.5"
        >
          <AppText weight="semibold" className="text-soft">
            Davet koduyla katıl
          </AppText>
        </Pressable>
      </Shell>
    )
  }

  // state.status === 'in'
  const { data } = state
  const isOwner = data.myRole === 'owner'

  const genInvite = async () => {
    if (invBusy) return
    setInvBusy(true)
    void Haptics.selectionAsync()
    try {
      setInvite(await fam.createInvite())
    } catch (e) {
      Alert.alert('Kod oluşturulamadı', familyErrorMessage(e, 'generic'))
    } finally {
      setInvBusy(false)
    }
  }

  const confirmRemove = (m: ApiFamilyMember) => {
    const name = m.displayName?.trim() || 'afiet üyesi'
    Alert.alert('Üyeyi çıkar?', `${name} aileden çıkarılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkar',
        style: 'destructive',
        onPress: () => {
          void fam.removeMember(m.userId).catch((e: unknown) =>
            Alert.alert('Çıkarılamadı', familyErrorMessage(e, 'generic')),
          )
        },
      },
    ])
  }

  const confirmLeave = () => {
    Alert.alert(
      'Aileden ayrıl?',
      'Ailenden ayrılırsan üyeliğin sona erer. Dilediğin zaman yeni bir davet koduyla tekrar katılabilirsin.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: () => {
            if (!myUserId) {
              Alert.alert('Ayrılamadı', 'Oturumunu yenileyip tekrar dener misin?')
              return
            }
            void fam.leaveFamily(myUserId).catch((e: unknown) =>
              Alert.alert('Ayrılamadı', familyErrorMessage(e, 'generic')),
            )
          },
        },
      ],
    )
  }

  return (
    <Shell>
      <View className="mb-4 flex-row items-center gap-2">
        <AppText weight="extrabold" numberOfLines={1} className="min-w-0 flex-1 text-xl text-ink">
          {data.family.name}
        </AppText>
        {isOwner ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aile adını düzenle"
            onPress={rename.show}
            className="h-9 w-9 items-center justify-center rounded-full bg-muted"
          >
            <IconPencil size={16} color={t.soft} />
          </Pressable>
        ) : null}
      </View>

      <View className="rounded-xl border border-line px-3">
        {data.members.map((m, i) => (
          <View key={m.userId} className={i > 0 ? 'border-t border-line/60' : ''}>
            <MemberRow
              member={m}
              isMe={m.userId === myUserId}
              canRemove={isOwner && m.userId !== myUserId}
              onRemove={() => confirmRemove(m)}
            />
          </View>
        ))}
      </View>

      {invite ? (
        <View className="mt-4 items-center rounded-2xl border border-line bg-canvas p-4">
          <AppText className="text-xs text-soft">Davet kodu</AppText>
          <AppText weight="extrabold" className="my-1 text-ink" style={{ fontSize: 32, letterSpacing: 8 }}>
            {invite.code}
          </AppText>
          <AppText className="text-xs text-faint">{expiryNote(invite.expiresAt)}</AppText>
          <View className="mt-3 w-full flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              onPress={() => void shareInvite(invite.code)}
              className="flex-1 items-center rounded-xl bg-emerald-600 py-3"
            >
              <AppText weight="semibold" className="text-white">
                Paylaş
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void genInvite()}
              disabled={invBusy}
              className={`items-center justify-center rounded-xl bg-muted px-4 py-3 ${
                invBusy ? 'opacity-50' : ''
              }`}
            >
              <AppText weight="semibold" className="text-soft">
                Yeni kod
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => void genInvite()}
          disabled={invBusy}
          className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 dark:bg-emerald-950/50 ${
            invBusy ? 'opacity-60' : ''
          }`}
        >
          <IconSparkles size={18} color={isDark ? '#34d399' : '#059669'} />
          <AppText weight="semibold" className="text-emerald-700 dark:text-emerald-300">
            {invBusy ? 'Oluşturuluyor…' : 'Davet kodu oluştur'}
          </AppText>
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={confirmLeave}
        className="mt-2 items-center rounded-xl py-3"
      >
        <AppText weight="semibold" className="text-red-600 dark:text-red-400">
          Aileden ayrıl
        </AppText>
      </Pressable>
    </Shell>
  )
}

/** Aile sheet'leri — ekran kökünde (ScrollView'ın kardeşi) render edilir. */
export function FamilySheets() {
  const { fam, create, join, rename } = useFamilyCtx()
  const currentName = fam.state.status === 'in' ? fam.state.data.family.name : ''

  return (
    <>
      <FamilyNameSheet
        open={create.open}
        mode="create"
        initialName="Ailemiz"
        onClose={create.hide}
        onSubmit={fam.createFamily}
      />
      <JoinFamilySheet open={join.open} onClose={join.hide} onJoin={fam.joinFamily} />
      <FamilyNameSheet
        open={rename.open}
        mode="rename"
        initialName={currentName}
        onClose={rename.hide}
        onSubmit={fam.renameFamily}
      />
    </>
  )
}
