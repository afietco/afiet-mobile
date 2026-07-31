import { Pressable, View } from 'react-native'
import type { ApiGroupView } from '@/data/api/client'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconSearch, IconUsers } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { PublicGroupsDiscover } from './PublicGroupsDiscover'

/**
 * Looking for a group to be in.
 *
 * The empty group screen used to offer "Grup kur" and "ID ile katıl" side by
 * side, with the public list underneath as a third thing nobody had asked for.
 * That put the narrowest door first: joining by code needs a code, and
 * somebody with no group usually has neither a code nor anybody to ask for
 * one. The wide door is the list of groups that are open to everybody, so the
 * button says what it is for now, and the code goes where it belongs, at the
 * top of the place you look when you do have one.
 *
 * The code sheet is opened by the screen rather than from in here: a sheet
 * over a sheet buries the way out of both.
 */

interface GroupSearchSheetProps {
  open: boolean
  onClose: () => void
  /** Opens the code flow; this sheet closes first. */
  onJoinWithCode: () => void
  /** A real join came back with the group; the screen swaps to it. */
  onJoined: (view: ApiGroupView) => void
}

export function GroupSearchSheet({
  open,
  onClose,
  onJoinWithCode,
  onJoined,
}: GroupSearchSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const accent = isDark ? '#34d399' : '#059669'

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          <IconSearch size={22} color={accent} />
          <AppText weight="bold" className="text-lg text-ink">
            Grup ara
          </AppText>
        </>
      }
    >
      {/* The code path, kept whole and moved: it is the answer for somebody
          who was actually invited, and useless to everybody else. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Davet kodu ile katıl"
        accessibilityHint="Sekiz karakterli grup kodunu girmen için açılır"
        onPress={() => {
          onClose()
          onJoinWithCode()
        }}
        className="min-h-14 flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 active:opacity-80"
      >
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
          <IconUsers size={18} color={accent} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText weight="bold" className="text-ink">
            Davet kodun var mı?
          </AppText>
          <AppText className="text-xs text-soft">8 karakterli kodla doğrudan katıl</AppText>
        </View>
        <IconChevronRight size={18} color={t.faint} />
      </Pressable>

      <View className="mb-1 mt-5 h-px" style={{ backgroundColor: t.line }} />

      {/* Its own heading and empty state live inside; nothing is duplicated. */}
      <PublicGroupsDiscover onJoined={onJoined} />
    </Sheet>
  )
}
