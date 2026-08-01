import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { pickFromCamera, pickFromLibrary } from '@/features/nutrition/afiPhoto'
import { photoPermissionCopy } from '@/features/nutrition/afiPhotoPermission'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCamera, IconImage, IconMic, IconX } from '@/ui/icons'
import { useBreathingScale } from '@/ui/motionGate'
import { Overlay } from '@/ui/overlayHost'
import Animated from 'react-native-reanimated'
import type { ChatDraftAttachment } from './types'
import { useSpeechToText } from './useSpeechToText'

/**
 * The composer: what you can hand an assistant, and how you take it back.
 *
 * One line, and only what is used from it: a photo button, the field, the
 * microphone beside the send button because both of them are ways of sending.
 * Camera and gallery share the one photo button and ask which after the tap,
 * since choosing between them is a decision made once a photo is already
 * wanted, not a decision the row has to keep on display.
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
  bottomInset,
}: ChatComposerProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const window = useWindowDimensions()
  const voice = useSpeechToText()
  const [picking, setPicking] = useState(false)
  /**
   * Where the photo menu sits, measured from the button it belongs to.
   *
   * The menu is drawn in the overlay layer so a tap anywhere else closes it,
   * and the overlay spans the window rather than this row, so it has to be
   * told where the row is. Null means closed.
   */
  const photoButtonRef = useRef<View>(null)
  const [photoMenu, setPhotoMenu] = useState<{ left: number; bottom: number } | null>(null)

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

  /* Asked after the tap rather than shown as two buttons: by the time someone
     reaches for this they have decided on a photo, and where it comes from is
     the smaller half of that decision. The question is asked where it was
     raised, standing on the button, rather than in a system dialog in the
     middle of the screen. */
  const chooseSource = () => {
    if (busy || picking) return
    photoButtonRef.current?.measureInWindow((x, y) => {
      setPhotoMenu({ left: x, bottom: window.height - y + 10 })
    })
  }

  const pick = (source: 'camera' | 'library') => {
    setPhotoMenu(null)
    void attach(source)
  }

  /* A refusal is answered once, in an effect rather than mid-render: it is the
     recorder's state that changed, and the alert has to fire exactly as many
     times as that happened. The phase is cleared by either button, so the
     microphone can be asked for again after a trip to Settings. */
  useEffect(() => {
    if (voice.phase !== 'denied') return
    Alert.alert(
      'Mikrofon izni gerekiyor',
      'Söylediklerini yazıya çevirebilmem için mikrofon ve konuşma tanıma iznine ihtiyacım var. Cihaz ayarlarından açabilirsin.',
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

  /**
   * Dictation writes into the field, so what was already typed is kept in
   * front of it and the spoken part is replaced as the engine corrects itself.
   */
  const beforeDictation = useRef('')
  useEffect(() => {
    if (voice.phase !== 'listening') return
    const base = beforeDictation.current
    const spoken = voice.transcript
    onDraftChange(base && spoken ? `${base} ${spoken}` : base || spoken)
    /* onDraftChange is the parent's setState, stable in practice; listing it
       would re-run this on every keystroke the parent re-renders for. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.phase, voice.transcript])

  const startDictation = () => {
    beforeDictation.current = draft.trimEnd()
    void voice.start()
  }

  return (
    <View
      className="gap-2 border-t border-line/60 bg-surface px-4 pt-3"
      style={{ paddingBottom: Math.max(bottomInset, 12) }}
    >
      {attachment ? (
        <AttachmentPreview attachment={attachment} onRemove={() => onAttachmentChange(null)} />
      ) : null}

      {voice.phase === 'listening' ? (
        <DictationBar
          heard={voice.transcript}
          onCancel={() => {
            voice.cancel()
            onDraftChange(beforeDictation.current)
          }}
          onFinish={voice.finish}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          <Pressable
            ref={photoButtonRef}
            collapsable={false}
            accessibilityRole="button"
            accessibilityLabel="Fotoğraf ekle"
            accessibilityHint="Fotoğraf çekmeyi ya da galeriden seçmeyi sorar"
            accessibilityState={{ expanded: photoMenu !== null }}
            onPress={chooseSource}
            disabled={busy || picking}
            className={`${ICON_BUTTON} ${busy || picking ? 'opacity-40' : ''}`}
          >
            <IconCamera size={20} color={t.soft} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={onDraftChange}
            placeholder={placeholder}
            placeholderTextColor={t.faint}
            editable={!busy}
            multiline
            onSubmitEditing={onSend}
            /* The field is exactly as tall as the buttons beside it and holds
               that height until the text needs more. Sized by its content it
               came out a few pixels shorter and, centred in the row, sat
               visibly high against them. */
            style={{
              flex: 1,
              maxHeight: 120,
              height: draft.includes('\n') || draft.length > 38 ? undefined : 44,
              minHeight: 44,
              borderWidth: 1,
              borderColor: t.line,
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 11,
              fontFamily: 'Nunito_400Regular',
              fontSize: 15,
              lineHeight: 20,
              color: t.ink,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Konuşarak yaz"
            accessibilityHint="Söylediklerini yazı alanına yazar"
            onPress={startDictation}
            disabled={busy || voice.unavailable}
            className={`${ICON_BUTTON} ${busy || voice.unavailable ? 'opacity-40' : ''}`}
          >
            <IconMic size={20} color={t.soft} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gönder"
            onPress={onSend}
            disabled={!sendable}
            className={`h-11 items-center justify-center rounded-full bg-emerald-600 px-4 ${
              sendable ? '' : 'opacity-40'
            }`}
          >
            <AppText weight="bold" className="text-sm text-white">
              Gönder
            </AppText>
          </Pressable>
        </View>
      )}

      {photoMenu ? (
        <Overlay onRequestClose={() => setPhotoMenu(null)}>
          <Pressable
            accessibilityLabel="Kapat"
            onPress={() => setPhotoMenu(null)}
            style={StyleSheet.absoluteFill}
          >
            {/* Standing on its own button, in the corner it was opened from. */}
            <View
              style={{ position: 'absolute', left: photoMenu.left, bottom: photoMenu.bottom }}
              className="overflow-hidden rounded-2xl border border-line/60 bg-surface"
            >
              <PhotoOption
                label="Fotoğraf çek"
                icon={<IconCamera size={19} color={t.soft} />}
                onPress={() => pick('camera')}
              />
              <View className="h-px bg-line/60" />
              <PhotoOption
                label="Galeriden seç"
                icon={<IconImage size={19} color={t.soft} />}
                onPress={() => pick('library')}
              />
            </View>
          </Pressable>
        </Overlay>
      ) : null}
    </View>
  )
}

function PhotoOption({
  label,
  icon,
  onPress,
}: {
  label: string
  icon: ReactNode
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-muted"
    >
      {icon}
      <AppText weight="semibold" className="text-sm text-ink">
        {label}
      </AppText>
    </Pressable>
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
      <Image
        source={{ uri: attachment.uri }}
        style={{ width: 52, height: 52, borderRadius: 12 }}
        accessibilityLabel="Eklenen fotoğraf"
      />
      <AppText weight="semibold" className="text-sm text-ink">
        Fotoğraf hazır
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

/**
 * The composer while the microphone is open.
 *
 * It shows what is being heard, not a timer: a length means nothing when the
 * thing being produced is words, and seeing them appear is the only way to
 * know it is working before you stop talking.
 */
function DictationBar({
  heard,
  onCancel,
  onFinish,
}: {
  heard: string
  onCancel: () => void
  onFinish: () => void
}) {
  const pulse = useBreathingScale(1.4, 900)

  return (
    <View className="gap-2 rounded-2xl bg-muted px-4 py-3">
      <View className="flex-row items-center gap-3">
        <Animated.View
          style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#e11d48' }, pulse]}
        />
        <AppText numberOfLines={2} className="min-w-0 flex-1 text-sm text-ink">
          {heard || 'Dinliyorum, söyle…'}
        </AppText>
      </View>
      <View className="flex-row items-center justify-end gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yazdırmayı iptal et"
          onPress={onCancel}
          className="rounded-xl px-3 py-2 active:opacity-70"
        >
          <AppText weight="semibold" className="text-sm text-soft">
            Vazgeç
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yazdırmayı bitir"
          onPress={onFinish}
          className="rounded-xl bg-emerald-600 px-4 py-2 active:opacity-90"
        >
          <AppText weight="bold" className="text-sm text-white">
            Bitir
          </AppText>
        </Pressable>
      </View>
    </View>
  )
}
