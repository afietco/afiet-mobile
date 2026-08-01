import { useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { markFtueSeen, useFtueSeen } from '@/features/ftue/ftueFlags'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Chip } from '@/ui/Chip'
import { IconTrash } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'
import { ASSISTANTS } from './assistants'
import { DestekIntro } from './DestekIntro'
import type { AssistantId, ChatTurn } from './types'
import { useChat } from './useChat'

/**
 * Shared conversation screen for the three assistants. Phase 1: replies come
 * from the scripted mock transport; the layout, streaming bubble and history
 * behave exactly as they will against the real endpoint.
 */
export function ChatScreen({ assistant }: { assistant: AssistantId }) {
  const spec = ASSISTANTS[assistant]
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { userId } = useAuth()
  const { turns, liveText, phase, send, clear } = useChat(assistant, userId)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<ScrollView>(null)
  const introSeen = useFtueSeen('chatDestekIntroSeen')

  const busy = phase !== 'idle'

  const sendDraft = () => {
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    send(text)
  }

  const confirmClear = () => {
    Alert.alert('Sohbeti sil', 'Bu sohbetin geçmişi bu cihazdan silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: clear },
    ])
  }

  const header = (
    <View className="px-4" style={{ paddingTop: insets.top + 8 }}>
      <ScreenHeader
        title={spec.title}
        subtitle={spec.subtitle}
        icon={<AfiPose pose={spec.pose} size={34} />}
      />
    </View>
  )

  if (assistant === 'destek' && !introSeen) {
    return (
      <View className="flex-1 bg-canvas">
        {header}
        <DestekIntro onAccept={() => markFtueSeen('chatDestekIntroSeen')} />
      </View>
    )
  }

  if (turns === null) {
    return (
      <View className="flex-1 bg-canvas">
        {header}
        <PageSkeleton />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-canvas">
      {header}

      {assistant === 'destek' ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Acil bir durumda 112'yi ara"
          onPress={() => void Linking.openURL('tel:112')}
          className="mx-4 mb-2 rounded-xl bg-muted px-3 py-2"
        >
          <AppText className="text-xs text-soft">
            Acil bir durumda 112 her zaman yanında. Bu sohbet bir terapi değildir.
          </AppText>
        </Pressable>
      ) : null}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {turns.length === 0 ? (
            <>
              <View className="items-center pb-1 pt-2">
                <AfiPose pose={spec.pose} size={96} intro="giris" />
              </View>
              <AssistantBubble turn={{ id: 'welcome', role: 'assistant', text: spec.welcome, date: '' }} />
              {phase === 'idle' ? (
                <View className="mt-1 flex-row flex-wrap gap-2 self-start">
                  {spec.starters.map((starter) => (
                    <Chip key={starter} label={starter} onPress={() => send(starter)} />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}

          {turns.map((turn) =>
            turn.role === 'assistant' ? (
              <AssistantBubble key={turn.id} turn={turn} />
            ) : (
              <View
                key={turn.id}
                className="max-w-[85%] self-end rounded-2xl rounded-tr-md bg-emerald-600 px-4 py-3"
              >
                <AppText className="text-sm text-white">{turn.text}</AppText>
              </View>
            ),
          )}

          {phase === 'waiting' ? (
            <View className="flex-row items-center gap-1 self-start rounded-2xl rounded-tl-md bg-surface px-4 py-2">
              <AfiPose pose="dusunuyor" size={52} />
              <AppText className="text-sm text-soft">{spec.busyLabel}</AppText>
            </View>
          ) : null}

          {phase === 'streaming' && liveText ? (
            <AssistantBubble
              turn={{ id: 'live', role: 'assistant', text: liveText, date: '' }}
            />
          ) : null}
        </ScrollView>

        <View
          className="flex-row items-end gap-2 border-t border-line/60 bg-surface px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          {turns.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sohbeti sil"
              onPress={confirmClear}
              disabled={busy}
              className={`h-11 w-11 items-center justify-center rounded-xl bg-muted ${busy ? 'opacity-40' : ''}`}
            >
              <IconTrash size={20} color={t.soft} />
            </Pressable>
          ) : null}
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={spec.placeholder}
            placeholderTextColor={t.faint}
            editable={!busy}
            multiline
            onSubmitEditing={sendDraft}
            style={{
              flex: 1,
              maxHeight: 120,
              borderWidth: 1,
              borderColor: t.line,
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontFamily: 'Nunito_400Regular',
              fontSize: 15,
              color: t.ink,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gönder"
            onPress={sendDraft}
            disabled={busy || !draft.trim()}
            className={`rounded-full bg-emerald-600 px-4 py-2.5 ${busy || !draft.trim() ? 'opacity-40' : ''}`}
          >
            <AppText weight="bold" className="text-sm text-white">
              Gönder
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

function AssistantBubble({ turn }: { turn: ChatTurn }) {
  return (
    <View className="max-w-[85%] self-start rounded-2xl rounded-tl-md bg-surface px-4 py-3">
      {turn.offline ? (
        <View className="flex-row items-center gap-2">
          <AfiPose pose="cevrimdisi" size={44} />
          <AppText className="flex-1 text-sm leading-relaxed text-ink">{turn.text}</AppText>
        </View>
      ) : (
        <AppText className="text-sm leading-relaxed text-ink">{turn.text}</AppText>
      )}
    </View>
  )
}
