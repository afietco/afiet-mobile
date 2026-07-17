import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, View, type TextStyle } from 'react-native'
import { useAuth } from '@/features/auth/AuthContext'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconMail } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/**
 * E-posta değiştirme formu; iki adımlı sakin akış:
 * - 'input': üstte mevcut adres bilgi satırı, altında yeni adres alanı.
 *   Gönderim AuthContext.startEmailChange ile (yeni adrese kanal açılır ve
 *   doğrulama maili gider).
 * - 'waiting': kullanıcı maildeki bağlantıya dokunup uygulamaya döner;
 *   "Doğruladım, devam et" doğrulamayı kontrol eder ve doğrulanmışsa
 *   değişikliği tamamlar (finalizeEmailChange). Doğrulanmamışsa kırmızı hata
 *   değil sakin bir satır içi bilgi gösterilir; bağlantı yeniden gönderilebilir.
 * İstemci yalnız boş/@'siz girişi engeller; asıl adres doğrulaması Stack'e
 * bırakılır (çifte kural yazılmaz). Bekleme adımında sheet kapatılırsa
 * oluşturulan kanal best-effort geri alınır (abortEmailChange) ki tekrar
 * denemede yarım kanal çakışması kalmasın. Başarıda haptik onay verilir,
 * onSuccess(yeniEposta) tetiklenir ve sheet kapanır. Sheet içindeki alanlar
 * BottomSheetTextInput (kök CLAUDE.md kuralı).
 */

interface ChangeEmailSheetProps {
  open: boolean
  onClose: () => void
  /** Kullanıcının bugünkü e-postası; giriş adımında bilgi satırında gösterilir.
      null ise satır çizilmez (profil okunamamış olabilir). */
  currentEmail: string | null
  /** E-posta başarıyla değişince YENİ adresle çağrılır (parent satır altında
      onay gösterir ve Stack profilini tazeler). */
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
    startEmailChange,
    resendEmailChangeVerification,
    isEmailChangeVerified,
    finalizeEmailChange,
    abortEmailChange,
  } = useAuth()
  const [step, setStep] = useState<'input' | 'waiting'>('input')
  const [email, setEmail] = useState('')
  // Bekleme adımının kanalı: startEmailChange döndürür; doğrulama kontrolü,
  // yeniden gönderme, tamamlama ve yarıda kesilirse geri alma bunu kullanır.
  const [channelId, setChannelId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Sakin satır içi bilgi ("henüz doğrulanmamış görünüyor"): hata DEĞİL,
  // kırmızıya boyanmaz; kullanıcı maili açmadan dönmüş olabilir, telaş yok.
  const [notice, setNotice] = useState<string | null>(null)
  // Yeniden gönderme geri bildirimi (hesap ekranındaki Doğrula deseni):
  // 'sent' bu bekleme boyunca kalır, tekrar tekrar mail gönderilmesin.
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  // Her açılışta bir kez tohumla (açık formdaki girdiyi ezme; kapanınca sıfırla).
  const seeded = useRef(false)
  useEffect(() => {
    if (!open) {
      seeded.current = false
      return
    }
    if (seeded.current) return
    seeded.current = true
    setStep('input')
    setEmail('')
    setChannelId(null)
    setBusy(false)
    setError(null)
    setNotice(null)
    setResendState('idle')
  }, [open])

  const newEmail = email.trim()
  // İstemci yalnız boş ve @'siz girişi engeller; gerisini Stack doğrular.
  const valid = newEmail.length > 0 && newEmail.includes('@')

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      const id = await startEmailChange(newEmail)
      setChannelId(id)
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
      await finalizeEmailChange(channelId, newEmail)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      // Kanal artık asıl e-posta: kapanış onu geri almasın diye durum ÖNCE
      // sıfırlanır (sheet'in onClose'u kapanma animasyonu bitince bir kez
      // daha çalışabilir; handleClose o anda 'input' adımını görür).
      setStep('input')
      setChannelId(null)
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

  // Bekleme adımında kapatmak akışı yarıda bırakır: oluşturulan kanal
  // best-effort geri alınır ve adım sıfırlanır. Başarıyla biten akış confirm()
  // içinde durumu zaten sıfırladığından buraya 'input' adımıyla gelir ve yeni
  // e-postaya dokunulmaz.
  const handleClose = () => {
    if (step === 'waiting' && channelId) {
      void abortEmailChange(channelId)
      setStep('input')
      setChannelId(null)
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
              editable={!busy}
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
            disabled={!valid || busy}
            className={`mt-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 ${
              !valid || busy ? 'opacity-40' : ''
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
