import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, View, type TextStyle } from 'react-native'
import { useAuth } from '@/features/auth/AuthContext'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconMail } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import {
  clearPendingEmailChange,
  loadPendingEmailChange,
  savePendingEmailChange,
  type PendingEmailChangePhase,
} from './pendingEmailChange'

/**
 * Two-step email change flow. The waiting channel is persisted so an
 * application restart cannot lose the only reference needed to resume or
 * cancel it. Finalization is also marked before the remote mutation so an
 * interrupted response never causes a potentially primary channel to be
 * deleted as if it were still waiting.
 */

interface ChangeEmailSheetProps {
  open: boolean
  onClose: () => void
  /** Current email shown as context when it is available. */
  currentEmail: string | null
  /** Called with the new address after the change is finalized. */
  onSuccess: (newEmail: string) => void
}

export function ChangeEmailSheet({
  open,
  onClose,
  currentEmail,
  onSuccess,
}: ChangeEmailSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const {
    userId,
    startEmailChange,
    resendEmailChangeVerification,
    isEmailChangeVerified,
    finalizeEmailChange,
    abortEmailChange,
  } = useAuth()
  const [step, setStep] = useState<'input' | 'waiting'>('input')
  const [email, setEmail] = useState('')
  // The channel is shared by verification, resend, finalization, and cleanup.
  const [channelId, setChannelId] = useState<string | null>(null)
  const [channelPhase, setChannelPhase] = useState<PendingEmailChangePhase | null>(null)
  const [busy, setBusy] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A not-yet-verified result is neutral information rather than an error.
  const [notice, setNotice] = useState<string | null>(null)
  // Keep the sent state for this waiting step to avoid repeated messages.
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const closeBlocked = restoring || busy || resendState === 'sending'

  // Hydrate once per opening without overwriting an active form.
  const seeded = useRef(false)
  useEffect(() => {
    if (!open) {
      seeded.current = false
      return
    }
    if (seeded.current || !userId) return
    seeded.current = true
    setStep('input')
    setEmail('')
    setChannelId(null)
    setChannelPhase(null)
    setBusy(false)
    setRestoring(true)
    setStorageReady(false)
    setError(null)
    setNotice(null)
    setResendState('idle')

    let cancelled = false
    void loadPendingEmailChange(userId)
      .then((pending) => {
        if (cancelled) return
        if (pending) {
          setEmail(pending.email)
          setChannelId(pending.channelId)
          setChannelPhase(pending.phase)
          setStep('waiting')
        }
        setStorageReady(true)
      })
      .catch(() => {
        if (cancelled) return
        setError('E-posta değişikliği şu anda açılamadı. Biraz sonra tekrar dene.')
      })
      .finally(() => {
        if (!cancelled) setRestoring(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, userId])

  const newEmail = email.trim()
  // Only guard empty and obviously incomplete input; Stack owns validation.
  const valid = newEmail.length > 0 && newEmail.includes('@')

  const submit = async () => {
    if (!valid || busy || !storageReady || !userId) return
    setBusy(true)
    setError(null)
    try {
      const id = await startEmailChange(newEmail)
      try {
        await savePendingEmailChange({
          userId,
          channelId: id,
          email: newEmail,
          phase: 'waiting',
        })
      } catch {
        await abortEmailChange(id).catch(() => undefined)
        setError('E-posta değişikliğini şu anda başlatamadık. Biraz sonra tekrar dene.')
        return
      }
      setChannelId(id)
      setChannelPhase('waiting')
      setStep('waiting')
      setNotice(null)
      setResendState('idle')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti.')
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!channelId || busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const verified = await isEmailChangeVerified(channelId)
      if (!verified) {
        setNotice(
          'Henüz doğrulanmamış görünüyor. Maildeki bağlantıya dokunduktan sonra tekrar dene.',
        )
        setBusy(false)
        return
      }
      try {
        if (!userId) throw new Error('missing session')
        await savePendingEmailChange({
          userId,
          channelId,
          email: newEmail,
          phase: 'finalizing',
        })
        setChannelPhase('finalizing')
      } catch {
        setError('E-posta değişikliğini şu anda tamamlayamadık. Biraz sonra tekrar dene.')
        setBusy(false)
        return
      }
      await finalizeEmailChange(channelId, newEmail)
      try {
        await clearPendingEmailChange()
      } catch (storageError) {
        console.warn('[auth] failed to clear completed email change', storageError)
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      // Reset before dismissal so the closing callback cannot cancel the new
      // primary channel after a successful finalization.
      setStep('input')
      setChannelId(null)
      setChannelPhase(null)
      onSuccess(newEmail)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti.')
      setBusy(false)
    }
  }

  const resend = async () => {
    if (!channelId || resendState === 'sending' || busy) return
    setResendState('sending')
    setError(null)
    try {
      await resendEmailChangeVerification(channelId)
      setResendState('sent')
    } catch (e) {
      setResendState('idle')
      setError(e instanceof Error ? e.message : 'Bir şeyler ters gitti.')
    }
  }

  // A waiting channel is removed remotely before its durable reference is
  // cleared. A finalizing channel stays persisted because the remote request
  // may have succeeded even when its response was interrupted.
  const handleClose = () => {
    if (closeBlocked) return
    if (step === 'waiting' && channelId && channelPhase === 'waiting') {
      void abortEmailChange(channelId)
        .then(() => clearPendingEmailChange())
        .catch((cleanupError) => {
          console.warn('[auth] failed to cancel pending email change', cleanupError)
        })
      setStep('input')
      setChannelId(null)
      setChannelPhase(null)
    }
    onClose()
  }

  const inputStyle: TextStyle = {
    borderWidth: 2,
    borderColor: t.line,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: t.ink,
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      enablePanDownToClose={!closeBlocked}
      title={
        <>
          <IconMail size={20} color={isDark ? '#34d399' : '#059669'} />
          <AppText weight="bold" className="text-lg text-ink">
            E-posta değiştir
          </AppText>
        </>
      }
    >
      {step === 'input' ? (
        <View className="gap-4">
          {currentEmail ? (
            <View className="rounded-xl bg-muted/60 px-3.5 py-2.5">
              <AppText className="text-xs text-faint">Şu anki adresin</AppText>
              <AppText numberOfLines={1} weight="semibold" className="mt-0.5 text-sm text-soft">
                {currentEmail}
              </AppText>
            </View>
          ) : null}

          <View>
            <AppText weight="semibold" className="mb-2 text-sm text-soft">
              Yeni e-posta
            </AppText>
            <BottomSheetTextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v)
                if (error) setError(null)
              }}
              placeholder="yeni@adresin.com"
              placeholderTextColor={t.faint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!busy && storageReady}
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
              style={inputStyle}
            />
            <AppText className="mt-2 text-xs text-faint">
              Yeni adresine bir doğrulama bağlantısı göndereceğiz.
            </AppText>
          </View>

          {error ? (
            <AppText weight="semibold" className="text-rose-500">
              {error}
            </AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => void submit()}
            disabled={!valid || busy || !storageReady}
            className={`mt-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 ${
              !valid || busy || !storageReady ? 'opacity-40' : ''
            }`}
          >
            {busy ? <ActivityIndicator color="white" /> : null}
            <AppText weight="semibold" className="text-white">
              {busy ? 'Gönderiliyor…' : 'Doğrulama bağlantısı gönder'}
            </AppText>
          </Pressable>
        </View>
      ) : (
        <View className="gap-4">
          <AppText className="text-sm text-soft">
            <AppText weight="semibold" className="text-sm text-ink">
              {newEmail}
            </AppText>
            {' adresine bir doğrulama bağlantısı gönderdik. Maildeki bağlantıya dokunduktan sonra buraya dön.'}
          </AppText>

          {notice ? (
            <View className="rounded-xl bg-muted/60 px-3.5 py-2.5">
              <AppText className="text-xs text-soft">{notice}</AppText>
            </View>
          ) : null}

          {error ? (
            <AppText weight="semibold" className="text-rose-500">
              {error}
            </AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => void confirm()}
            disabled={busy}
            className={`mt-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 ${
              busy ? 'opacity-40' : ''
            }`}
          >
            {busy ? <ActivityIndicator color="white" /> : null}
            <AppText weight="semibold" className="text-white">
              {busy ? 'Kontrol ediliyor…' : 'Doğruladım, devam et'}
            </AppText>
          </Pressable>

          {resendState === 'sent' ? (
            <AppText weight="semibold" className="text-center text-xs text-soft">
              Gönderildi ✓
            </AppText>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Doğrulama bağlantısını yeniden gönder"
              onPress={() => void resend()}
              disabled={resendState === 'sending' || busy}
              hitSlop={8}
              className="items-center py-1"
            >
              <AppText
                weight="semibold"
                className={`text-xs ${
                  resendState === 'sending' || busy
                    ? 'text-faint'
                    : 'text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {resendState === 'sending' ? 'Gönderiliyor…' : 'Bağlantıyı yeniden gönder'}
              </AppText>
            </Pressable>
          )}
        </View>
      )}
    </Sheet>
  )
}
