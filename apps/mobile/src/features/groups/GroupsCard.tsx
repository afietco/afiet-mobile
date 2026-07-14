import { createContext, useContext, useState, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthContext'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconHeart } from '@/ui/icons'
import { CreateGroupSheet } from './CreateGroupSheet'
import { GroupDetailSheet } from './GroupDetailSheet'
import { JoinGroupSheet } from './JoinGroupSheet'
import { useGroups, type UseGroups } from './useGroups'

/**
 * Profil sekmesindeki "Gruplarım" bölümü. Sheet'ler @gorhom/bottom-sheet gereği
 * kaydırma alanının DIŞINA (ekran köküne) yerleşmeli; kart ise ScrollView içinde
 * durur. İkisi aynı grup durumunu paylaşsın diye küçük bir context kullanılır:
 * profil ekranı <GroupsProvider> ile sarar, içeride <GroupsCard/> (scroll'da) ve
 * <GroupsSheets/> (scroll'un kardeşi) yer alır.
 */

interface GroupsCtx {
  grp: UseGroups
  myUserId: string | null
  create: { open: boolean; show: () => void; hide: () => void }
  join: { open: boolean; show: () => void; hide: () => void }
  detail: { groupId: string | null; show: (id: string) => void; hide: () => void }
}

const Ctx = createContext<GroupsCtx | null>(null)

function useGroupsCtx(): GroupsCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('GroupsCard/GroupsSheets bir GroupsProvider içinde kullanılmalı')
  return ctx
}

export function GroupsProvider({ children }: { children: ReactNode }) {
  const grp = useGroups()
  const { userId } = useAuth()
  const [create, setCreate] = useState(false)
  const [join, setJoin] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const value: GroupsCtx = {
    grp,
    myUserId: userId,
    create: { open: create, show: () => setCreate(true), hide: () => setCreate(false) },
    join: { open: join, show: () => setJoin(true), hide: () => setJoin(false) },
    detail: { groupId: detailId, show: (id) => setDetailId(id), hide: () => setDetailId(null) },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function Shell({ children }: { children: ReactNode }) {
  const { isDark } = useTheme()
  return (
    <View className="mt-4 rounded-2xl bg-surface p-5">
      <View className="mb-3 flex-row items-center gap-2">
        <IconHeart size={18} color={isDark ? '#34d399' : '#059669'} />
        <AppText weight="bold" className="text-ink">
          Gruplarım
        </AppText>
      </View>
      {children}
    </View>
  )
}

/** "Grup kur" + "Koda katıl" eylem çifti — boş durumda da listede de aynı. */
function Actions() {
  const { create, join } = useGroupsCtx()
  return (
    <View className="mt-4 flex-row gap-2">
      <Pressable
        accessibilityRole="button"
        onPress={create.show}
        className="flex-1 items-center rounded-xl bg-emerald-600 py-3.5"
      >
        <AppText weight="semibold" className="text-white">
          Grup kur
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={join.show}
        className="flex-1 items-center rounded-xl bg-muted py-3.5"
      >
        <AppText weight="semibold" className="text-soft">
          Koda katıl
        </AppText>
      </Pressable>
    </View>
  )
}

export function GroupsCard() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { grp, detail } = useGroupsCtx()
  const { state } = grp

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
          onPress={() => void grp.reload()}
          className="items-center rounded-xl bg-muted py-3"
        >
          <AppText weight="semibold" className="text-soft">
            Tekrar dene
          </AppText>
        </Pressable>
      </Shell>
    )
  }

  // state.status === 'ready'
  if (state.groups.length === 0) {
    return (
      <Shell>
        <AppText className="text-sm text-soft">
          Ailenle ya da arkadaşlarınla birlikte dengede kalın — sofranızı paylaşın,
          birbirinizi kutlayın.
        </AppText>
        <Actions />
      </Shell>
    )
  }

  return (
    <Shell>
      <View className="overflow-hidden rounded-xl border border-line">
        {state.groups.map((g, i) => (
          <Pressable
            key={g.id}
            accessibilityRole="button"
            accessibilityLabel={`${g.name} grubunun detayını aç`}
            onPress={() => detail.show(g.id)}
            className={`flex-row items-center gap-3 px-3 py-3 active:bg-muted ${
              i > 0 ? 'border-t border-line/60' : ''
            }`}
          >
            <View className="min-w-0 flex-1">
              <AppText weight="semibold" numberOfLines={1} className="text-ink">
                {g.name}
              </AppText>
              <AppText className="text-xs text-soft">{g.memberCount} üye</AppText>
            </View>
            {g.myRole === 'owner' ? (
              <View className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 dark:bg-emerald-950/50">
                <AppText weight="semibold" className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  kurucu
                </AppText>
              </View>
            ) : null}
            <IconChevronRight size={16} color={t.faint} />
          </Pressable>
        ))}
      </View>
      <Actions />
    </Shell>
  )
}

/** Grup sheet'leri — ekran kökünde (ScrollView'ın kardeşi) render edilir. */
export function GroupsSheets() {
  const { grp, myUserId, create, join, detail } = useGroupsCtx()

  return (
    <>
      <CreateGroupSheet
        open={create.open}
        onClose={create.hide}
        onSubmit={async (name) => {
          await grp.createGroup(name)
        }}
      />
      <JoinGroupSheet
        open={join.open}
        onClose={join.hide}
        onJoin={async (code) => {
          await grp.joinGroup(code)
        }}
      />
      <GroupDetailSheet
        open={detail.groupId !== null}
        groupId={detail.groupId}
        myUserId={myUserId}
        groups={grp}
        onClose={detail.hide}
      />
    </>
  )
}
