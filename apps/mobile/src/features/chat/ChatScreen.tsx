import { router, type Href } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { markFtueSeen, useFtueSeen } from '@/features/ftue/ftueFlags'
import { track } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Chip } from '@/ui/Chip'
import { IconMic, IconTrash } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'
import { ASSISTANTS } from './assistants'
import { detectBridge } from './bridge'
import { ChatComposer } from './ChatComposer'
import { DestekIntro } from './DestekIntro'
import type { AssistantId, ChatDraftAttachment, ChatTurn } from './types'
import { useChat } from './useChat'
import { formatDuration } from './useVoiceRecorder'

/**
 * Shared conversation screen for the three assistants: the streaming reply, the
 * history, and a composer that takes a photo or a voice message as well as
 * words (see ChatComposer, and useChat for what can be done with them yet).
 */
export function ChatScreen({ assistant }: { assistant: AssistantId }) {
  const spec = ASSISTANTS[assistant]
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { userId } = useAuth()
  const { turns, liveText, phase, send, clear } = useChat(assistant, userId)
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<ChatDraftAttachment | null>(null)
  const scrollRef = useRef<ScrollView>(null)
  const introSeen = useFtueSeen('chatDestekIntroSeen')

  useEffect(() => {
    track('chat_opened', { asistan: assistant })
  }, [assistant])

  const busy = phase !== 'idle'

  // The agents refer users to each other verbally; when the latest reply
  // names another conversation, offer the doorway as a chip.
  const lastTurn = turns?.[turns.length - 1]
  const bridge =
    !busy && lastTurn?.role === 'assistant' && !lastTurn.offline && !lastTurn.notice
      ? detectBridge(assistant, lastTurn.text)
      : null

  const sendDraft = () => {
    const text = draft.trim()
    if ((!text && !attachment) || busy) return
    setDraft('')
    setAttachment(null)
    send(text, attachment)
  }

  const confirmClear = () => {
    Alert.alert('Sohbeti sil', 'Bu sohbetin geçmişi bu cihazdan silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: clear },
    ])
  }

  /* Deleting a conversation belongs to the conversation, not to the row you
     write in: it is done once, if ever, and it sat next to the send button
     where every other control is one you use in the same breath. */
  const header = (
    <View className="px-4" style={{ paddingTop: insets.top + 8 }}>
      <ScreenHeader
        title={spec.title}
        subtitle={spec.subtitle}
        icon={<AfiPose pose={spec.pose} size={34} />}
        action={
          turns && turns.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sohbeti sil"
              onPress={confirmClear}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full bg-muted active:opacity-70"
            >
              <IconTrash size={18} color={t.soft} />
            </Pressable>
          ) : null
        }
      />
    </View>
  )

  if (assistant === 'destek' && !introSeen) {
    return (
      <View className="flex-1 bg-canvas">
        {header}
        <DestekIntro
          onAccept={() => {
            track('chat_destek_intro_accepted')
            markFtueSeen('chatDestekIntroSeen')
          }}
        />
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
              <UserBubble key={turn.id} turn={turn} />
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

          {bridge ? (
            <View className="mt-1 self-start">
              <Chip
                label={bridge.label}
                onPress={() => router.push(`/sohbet?asistan=${bridge.target}` as Href)}
              />
            </View>
          ) : null}
        </ScrollView>

        <ChatComposer
          draft={draft}
          onDraftChange={setDraft}
          attachment={attachment}
          onAttachmentChange={setAttachment}
          onSend={sendDraft}
          busy={busy}
          placeholder={spec.placeholder}
          bottomInset={insets.bottom}
        />
      </KeyboardAvoidingView>
    </View>
  )
}

/** What the person said, and whatever they said it with. */
function UserBubble({ turn }: { turn: ChatTurn }) {
  const attachment = turn.attachment
  return (
    <View className="max-w-[85%] items-end gap-1 self-end">
      {attachment?.kind === 'image' ? (
        <Image
          source={{ uri: attachment.uri }}
          style={{ width: 168, height: 168, borderRadius: 16 }}
          accessibilityLabel="Gönderdiğin fotoğraf"
        />
      ) : null}
      {attachment?.kind === 'audio' ? (
        <View className="flex-row items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3">
          <IconMic size={18} color="#ffffff" />
          <AppText weight="semibold" className="text-sm text-white">
            Sesli mesaj · {formatDuration(attachment.durationMs ?? 0)}
          </AppText>
        </View>
      ) : null}
      {turn.text ? (
        <View className="rounded-2xl rounded-tr-md bg-emerald-600 px-4 py-3">
          <AppText className="text-sm text-white">{turn.text}</AppText>
        </View>
      ) : null}
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
