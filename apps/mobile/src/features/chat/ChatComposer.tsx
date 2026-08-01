import { useEffect, useState } from 'react'
import { Alert, Image, Linking, Pressable, TextInput, View } from 'react-native'
import { pickFromCamera, pickFromLibrary } from '@/features/nutrition/afiPhoto'
import { photoPermissionCopy } from '@/features/nutrition/afiPhotoPermission'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCamera, IconImage, IconMic, IconTrash, IconX } from '@/ui/icons'
import { useBreathingScale } from '@/ui/motionGate'
import Animated from 'react-native-reanimated'
import type { ChatDraftAttachment } from './types'
import { formatDuration, useVoiceRecorder } from './useVoiceRecorder'

/**
 * The composer: what you can hand an assistant, and how you take it back.
 *
 * Three ways in beyond typing, on every conversation rather than only the one
 * about food. They are laid out on a row of their own under the field, because
 * side by side with the field and the send button on a narrow screen there was
 * no width left for any of them to be a comfortable target.
 *
 * One attachment at a time. A queue would need an order, a way to reorder it
 * and a way to remove the third of five, and none of that earns its place next
 * to a text field.
 */

const ICON_BUTTON = 'h-11 w-11 items-center justify-center rounded-xl bg-muted active:opacity-70'

export interface ChatComposerProps {
  draft: string
  onDraftChange: (value: string) => void
  attachment: ChatDraftAttachment | null
  onAttachmentChange: (value: ChatDraftAttachment | null) => void
  onSend: () => void
  /** A reply is in flight; everything that would start a second one rests. */
  busy: boolean
  placeholder: string
  /** Absent when there is no history to clear. */
  onClear?: () => void
  bottomInset: number
}

export function ChatComposer({
  draft,
  onDraftChange,
  attachment,
  onAttachmentChange,
  onSend,
  busy,
  placeholder,
  onClear,
  bottomInset,
}: ChatComposerProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const voice = useVoiceRecorder()
  const [picking, setPicking] = useState(false)

  const sendable = !busy && (draft.trim().length > 0 || attachment !== null)

  const attach = async (source: 'camera' | 'library') => {
    if (picking || busy) return
    setPicking(true)
    const result = source === 'camera' ? await pickFromCamera() : await pickFromLibrary()
    setPicking(false)
    if (result.kind === 'picked') {
      onAttachmentChange({ kind: 'image', uri: result.image.uri, base64: result.image.base64 })
      return
    }
    if (result.kind === 'permission-denied') {
      const copy = photoPermissionCopy(result.source, result.canAskAgain)
      Alert.alert('İzin gerekiyor', copy.message, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: copy.actionLabel,
          onPress: () => {
            if (result.canAskAgain) void attach(source)
            else void Linking.openSettings()
          },
        },
      ])
      return
    }
    if (result.kind === 'error') {
      Alert.alert('Olmadı', 'Fotoğrafı alamadım. Birazdan tekrar dener misin?')
    }
  }

  /* A refusal is answered once, in an effect rather than mid-render: it is the
     recorder's state that changed, and the alert has to fire exactly as many
     times as that happened. The phase is cleared by either button, so the
     microphone can be asked for again after a trip to Settings. */
  useEffect(() => {
    if (voice.phase !== 'denied') return
    Alert.alert(
      'Mikrofon izni gerekiyor',
      'Sesli mesaj gönderebilmem için mikrofon erişimine izin vermen gerekiyor. Cihaz ayarlarından açabilirsin.',
      [
        { text: 'Vazgeç', style: 'cancel', onPress: voice.dismissDenied },
        {
          text: 'Ayarları Aç',
          onPress: () => {
            voice.dismissDenied()
            void Linking.openSettings()
          },
        },
      ],
      { onDismiss: voice.dismissDenied },
    )
  }, [voice.dismissDenied, voice.phase])

  return (
    <View
      className="gap-2 border-t border-line/60 bg-surface px-4 pt-3"
      style={{ paddingBottom: Math.max(bottomInset, 12) }}
    >
      {attachment ? (
        <AttachmentPreview attachment={attachment} onRemove={() => onAttachmentChange(null)} />
      ) : null}

      {voice.phase === 'recording' ? (
        <RecordingBar
          elapsedMs={voice.elapsedMs}
          onCancel={() => void voice.cancel()}
          onFinish={() => {
            void voice.finish().then((recorded) => {
              if (recorded) {
                onAttachmentChange(recorded)
                return
              }
              /* Ending as fast as you started it leaves nothing to send, and a
                 recording bar that simply vanishes looks like a lost message. */
              Alert.alert('Çok kısa kaldı', 'Kaydı biraz daha uzun tutarsan gönderebilirim.')
            })
          }}
        />
      ) : (
        <>
          <View className="flex-row items-end gap-2">
            <TextInput
              value={draft}
              onChangeText={onDraftChange}
              placeholder={placeholder}
              placeholderTextColor={t.faint}
              editable={!busy}
              multiline
              onSubmitEditing={onSend}
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
              onPress={onSend}
              disabled={!sendable}
              className={`rounded-full bg-emerald-600 px-4 py-2.5 ${sendable ? '' : 'opacity-40'}`}
            >
              <AppText weight="bold" className="text-sm text-white">
                Gönder
              </AppText>
            </Pressable>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sesli mesaj kaydet"
              onPress={() => void voice.start()}
              disabled={busy}
              className={`${ICON_BUTTON} ${busy ? 'opacity-40' : ''}`}
            >
              <IconMic size={20} color={t.soft} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fotoğraf çek"
              onPress={() => void attach('camera')}
              disabled={busy || picking}
              className={`${ICON_BUTTON} ${busy || picking ? 'opacity-40' : ''}`}
            >
              <IconCamera size={20} color={t.soft} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Galeriden seç"
              onPress={() => void attach('library')}
              disabled={busy || picking}
              className={`${ICON_BUTTON} ${busy || picking ? 'opacity-40' : ''}`}
            >
              <IconImage size={20} color={t.soft} />
            </Pressable>

            {onClear ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sohbeti sil"
                onPress={onClear}
                disabled={busy}
                className={`${ICON_BUTTON} ml-auto ${busy ? 'opacity-40' : ''}`}
              >
                <IconTrash size={20} color={t.soft} />
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </View>
  )
}

/** What is about to be sent, and the one control that takes it back. */
function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: ChatDraftAttachment
  onRemove: () => void
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  return (
    <View className="flex-row items-center gap-3 self-start rounded-2xl bg-muted p-2 pr-3">
      {attachment.kind === 'image' ? (
        <Image
          source={{ uri: attachment.uri }}
          style={{ width: 52, height: 52, borderRadius: 12 }}
          accessibilityLabel="Eklenen fotoğraf"
        />
      ) : (
        <View
          style={{ width: 52, height: 52, borderRadius: 12 }}
          className="items-center justify-center bg-emerald-600"
        >
          <IconMic size={22} color="#ffffff" />
        </View>
      )}
      <AppText weight="semibold" className="text-sm text-ink">
        {attachment.kind === 'image'
          ? 'Fotoğraf hazır'
          : `Sesli mesaj · ${formatDuration(attachment.durationMs ?? 0)}`}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Eki kaldır"
        onPress={onRemove}
        hitSlop={8}
        className="h-8 w-8 items-center justify-center rounded-full bg-surface"
      >
        <IconX size={15} color={t.soft} />
      </Pressable>
    </View>
  )
}

/** The composer while the microphone is open; nothing else is reachable. */
function RecordingBar({
  elapsedMs,
  onCancel,
  onFinish,
}: {
  elapsedMs: number
  onCancel: () => void
  onFinish: () => void
}) {
  const pulse = useBreathingScale(1.4, 900)

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-muted px-4 py-3">
      <Animated.View
        style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#e11d48' }, pulse]}
      />
      <AppText weight="bold" className="flex-1 text-ink">
        {formatDuration(elapsedMs)}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kaydı iptal et"
        onPress={onCancel}
        className="rounded-xl px-3 py-2 active:opacity-70"
      >
        <AppText weight="semibold" className="text-sm text-soft">
          Vazgeç
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kaydı bitir"
        onPress={onFinish}
        className="rounded-xl bg-emerald-600 px-4 py-2 active:opacity-90"
      >
        <AppText weight="bold" className="text-sm text-white">
          Bitir
        </AppText>
      </Pressable>
    </View>
  )
}
