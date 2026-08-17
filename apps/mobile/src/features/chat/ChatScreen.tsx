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
import { requireApi } from '@/data/api/apiHolder'
import { useAuth } from '@/features/auth/AuthContext'
import { markFtueSeen, useFtueSeen } from '@/features/ftue/ftueFlags'
import { usePremium } from '@/features/premium/usePremium'
import { track } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Chip } from '@/ui/Chip'
import { IconChevronRight, IconMenu, IconPencil } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { AssistantGate } from './AssistantGate'
import { AssistantMascot } from './AssistantMascot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ASSISTANTS } from './assistants'
import { detectBridge } from './bridge'
import { ChatComposer } from './ChatComposer'
import { ChatSessionsDrawer } from './ChatSessionsDrawer'
import { DestekIntro } from './DestekIntro'
import type { AssistantId, ChatDraftAttachment, ChatTurn } from './types'
import { useChat } from './useChat'

/**
 * Shared conversation screen for the three assistants: the streaming reply, the
 * history, and a composer that takes a photo or a voice message as well as
 * words (see ChatComposer, and useChat for what can be done with them yet).
 *
 * An assistant holds many conversations. The bar carries the two things that
 * implies and nothing else: start a new one, or go back to an old one through
 * the panel on the right. There is no "clear this conversation" any more,
 * because a conversation you are done with is one you leave rather than erase,
 * and the ones you want gone are deleted by name in that panel.
 */
export function ChatScreen({ assistant }: { assistant: AssistantId }) {
  const spec = ASSISTANTS[assistant]
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { userId } = useAuth()
  const { isPremium } = usePremium()
  const {
    turns,
    liveText,
    phase,
    send,
    sessions,
    activeId,
    startSession,
    openSession,
    deleteSession,
    togglePin,
  } = useChat(assistant, userId)
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<ChatDraftAttachment | null>(null)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const introSeen = useFtueSeen('chatDestekConsent2026_08')
  const [consentPending, setConsentPending] = useState(false)
  const [consentFailed, setConsentFailed] = useState(false)

  useEffect(() => {
    track('chat_opened', { asistan: assistant })
    /* One of the team chapter's triggers (features/ftue/chapters.ts): the
       person has found the conversation on their own. */
    markFtueSeen('sohbetVisited')
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

  /**
   * The bar: back, who you are talking to, and the two conversation controls.
   *
   * The assistant's name is one line and truncates. It used to be a phrase
   * ("kişisel beslenme uzmanım") that wrapped to two lines beside a mascot and
   * two buttons and pushed everything else down; a title that reflows as you
   * navigate is a bar that never sits still. The names are single words now,
   * which settles it, and what is underneath says which conversation you are
   * in, the thing that actually changes here.
   */
  const activeTitle = sessions.find((session) => session.id === activeId)?.title
  const header = (
    <View
      className="flex-row items-center gap-2 border-b border-line/50 px-3 pb-2"
      style={{ paddingTop: insets.top + 6 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Geri dön"
        onPress={() => router.back()}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
      >
        <View style={{ transform: [{ rotate: '180deg' }] }}>
          <IconChevronRight size={20} color={t.faint} />
        </View>
      </Pressable>
      <AssistantMascot assistant={assistant} size={30} />
      <View className="min-w-0 flex-1">
        <AppText weight="extrabold" numberOfLines={1} className="text-base text-ink">
          {spec.title}
        </AppText>
        <AppText numberOfLines={1} className="text-xs text-soft">
          {activeTitle ?? spec.subtitle}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Yeni sohbet başlat"
        onPress={startSession}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center rounded-full bg-muted active:opacity-70"
      >
        <IconPencil size={17} color={t.soft} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sohbetlerim"
        accessibilityHint="Önceki sohbetlerini açar"
        onPress={() => setSessionsOpen(true)}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center rounded-full bg-muted active:opacity-70"
      >
        <IconMenu size={18} color={t.soft} />
      </Pressable>
    </View>
  )

  const drawer = (
    <ChatSessionsDrawer
      open={sessionsOpen}
      onClose={() => setSessionsOpen(false)}
      sessions={sessions}
      activeId={activeId}
      onOpenSession={openSession}
      onNewSession={startSession}
      onDeleteSession={deleteSession}
      onTogglePin={togglePin}
    />
  )

  /* Sini and Demi are what afiet+ sells, so a visitor without it meets the
     character rather than the conversation. Checked before the destek consent
     screen: there is no reason to ask somebody to agree to special-category
     data handling for a room they cannot enter yet. */
  if (assistant !== 'afi' && !isPremium) {
    return (
      <View className="flex-1 bg-canvas">
        {header}
        <AssistantGate assistant={assistant} />
      </View>
    )
  }

  if (assistant === 'destek' && !introSeen) {
    return (
      <View className="flex-1 bg-canvas">
        {header}
        <DestekIntro
          pending={consentPending}
          failed={consentFailed}
          onAccept={() => {
            /* The flag is only set once the server has the consent. Marking it
               first would open a conversation nobody can show agreement for,
               which is the exact situation this screen exists to prevent. */
            setConsentPending(true)
            setConsentFailed(false)
            void requireApi()
              .acceptChatConsent('destek')
              .then(() => {
                track('chat_destek_intro_accepted')
                markFtueSeen('chatDestekConsent2026_08')
              })
              .catch(() => setConsentFailed(true))
              .finally(() => setConsentPending(false))
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
        {drawer}
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
                <AssistantMascot assistant={assistant} size={96} intro="giris" />
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

      {drawer}
    </View>
  )
}

/** What the person said, and whatever they said it with. */
function UserBubble({ turn }: { turn: ChatTurn }) {
  const attachment = turn.attachment
  return (
    <View className="max-w-[85%] items-end gap-1 self-end">
      {attachment ? (
        <Image
          source={{ uri: attachment.uri }}
          style={{ width: 168, height: 168, borderRadius: 16 }}
          accessibilityLabel="Gönderdiğin fotoğraf"
        />
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
