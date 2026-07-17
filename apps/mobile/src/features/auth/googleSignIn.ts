/**
 * Google ile giriş: Stack Auth OAuth2 yetkilendirme kodu + PKCE akışı,
 * sistem tarayıcısında. Stack Auth'ta Google için native token exchange
 * YOK (Apple'daki /oauth/callback/apple/native ucunun karşılığı yok), bu
 * yüzden tarayıcı akışı zorunlu. Adımlar:
 *
 *   1. PKCE malzemesi üret (code_verifier / code_challenge / state).
 *   2. Stack'in authorize ucundan Google'ın gerçek authorize URL'ini al.
 *   3. URL'i sistem tarayıcısında aç; kullanıcı Google'da onaylar.
 *   4. Uygulamaya dönen callback URL'inden code + state'i ayıkla.
 *   5. code + code_verifier ile Stack'ten oturum token'larını al.
 *
 * Bilinen sınırlar: Expo Go'da iOS openAuthSessionAsync sabit şemayı
 * yakalayabilir (ASWebAuthenticationSession şema kaydı istemez) ama Android
 * Expo Go custom şemaya geri dönemez; Android'de gerçek test dev ya da
 * standalone build ister. Dashboard'da Google provider'ı kapalıysa authorize
 * adımı hata döner ve kullanıcı sakin genel mesajı görür.
 */
import * as Crypto from 'expo-crypto'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { config } from '@/config'
import { stackErrorMessage, userIdFromAccessToken, type AuthTokens } from './stackAuth'

/** Stack'in native uygulamalar için sabit kabul ettiği redirect şeması.
    afiet:// gibi projeye özgü şemalar Stack tarafında reddedilir; bu sabit
    şema app.json "scheme" dizisine eklidir ki OS, tarayıcıdan uygulamaya
    geri dönebilsin (mevcut afiet şeması ve deep link'ler değişmedi). */
const REDIRECT_URI = 'stack-auth-mobile-oauth-url://oauth-callback'

/** Uca özgü sakin mesaj: teknik ayrıntı yerine e-posta girişine yönlendirir
    (signInWithAppleToken'daki desenin aynısı). */
const GOOGLE_UNAVAILABLE = 'Google ile giriş şu anda kullanılamıyor. E-postanla giriş yapabilirsin.'

/** Standart base64'ü base64url'e çevirir (+ eksiye, / alt çizgiye, padding
    kırpılır); PKCE alanları RFC 7636 gereği base64url ister. */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Verilen bayt sayısında kriptografik rastgele değeri base64url döndürür
    (32 bayt = 43 karakterlik code_verifier). btoa Hermes'te yerleşiktir
    (stackAuth zaten atob kullanıyor). */
function randomBase64Url(byteCount: number): string {
  const bytes = Crypto.getRandomBytes(byteCount)
  return toBase64Url(btoa(String.fromCharCode(...bytes)))
}

/** RFC 7636: code_challenge = base64url(SHA-256(code_verifier)). */
async function challengeFromVerifier(verifier: string): Promise<string> {
  const base64 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  })
  return toBase64Url(base64)
}

/** Query string kurar. RN'in URLSearchParams polyfill'i eksik olabildiğinden
    kurulum tarafında ona yaslanılmaz; encodeURIComponent yeterli. */
function toQuery(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

/** Callback URL'inden tek query paramı okur. Önce global URL/URLSearchParams
    denenir (Hermes'te var); RN'in eksik polyfill'i fırlatırsa expo-linking
    parse'ına düşülür. Elle string parçalama yapılmaz. */
function queryParam(url: string, name: string): string | null {
  try {
    return new URL(url).searchParams.get(name)
  } catch {
    const value = Linking.parse(url).queryParams?.[name]
    return typeof value === 'string' ? value : null
  }
}

/** readError'ın (stackAuth) bu akışa özgü hali: gövde Stack biçiminde
    ({ code, error }) ya da düz OAuth biçiminde ({ error, error_description })
    gelebilir. Bilinen Stack kodları okunur mesajına çevrilir; code alanı
    olmayan OAuth gövdesi dahil gerisi sakin Google mesajına düşer
    (kod adı uydurulmaz, yalnız genel mesaj özelleştirilir). */
async function readOAuthError(res: Response): Promise<string> {
  let body: { code?: string; error?: string } = {}
  try {
    body = (await res.json()) as { code?: string; error?: string }
  } catch {
    // gövde okunamadı, genel mesaja düşülür
  }
  const message = stackErrorMessage(body)
  return message === 'Bir şeyler ters gitti.' ? GOOGLE_UNAVAILABLE : message
}

/**
 * Google ile giriş akışını uçtan uca yürütür. Kullanıcı tarayıcıyı kapatıp
 * vazgeçerse null döner (hata DEĞİL; çağıran sessizce yutar), diğer her
 * sorunda okunur Türkçe mesajla throw eder. Kullanıcı Stack'te yoksa
 * oluşturulur (is_new_user true döner). Görünen adı Google verir ve Stack
 * OAuth callback'te kendisi kaydeder; Apple'daki gibi elle PATCH gerekmez.
 */
export async function signInWithGoogleFlow(): Promise<
  (AuthTokens & { isNewUser: boolean }) | null
> {
  // 1) PKCE malzemesi: verifier yalnız bu cihazda kalır, Stack'e önce sadece
  //    SHA-256 özeti (challenge) gider. state, callback'in bizim başlattığımız
  //    akışa ait olduğunu doğrular (CSRF koruması).
  const verifier = randomBase64Url(32)
  const challenge = await challengeFromVerifier(verifier)
  const state = randomBase64Url(16)

  // 2) Google'ın authorize URL'ini Stack'ten JSON modunda al:
  //    stack_response_mode=json ile Stack 302 yerine 200 { location } döner.
  //    JSON modu şart, çünkü fetch 302'yi kendisi sessizce izler ve elimize
  //    tarayıcıda açılacak URL yerine Google'ın HTML'i geçerdi. Özel header
  //    gerekmez; parametreler yeter.
  const authorizeParams: Record<string, string> = {
    client_id: config.stackProjectId,
    redirect_uri: REDIRECT_URI,
    // Stack'in kabul ettiği tek scope değeri kelimenin tam anlamıyla "legacy".
    scope: 'legacy',
    state,
    grant_type: 'authorization_code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    response_type: 'code',
    stack_response_mode: 'json',
  }
  // client_secret koşullu: projede publishable key zorunlu değil (boş) ve
  // boşken parametre HİÇ gönderilmez. Stack ileride yine de isterse
  // dashboard'dan anahtar üretilip EXPO_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
  // ortam değişkenine konur; kod değişmeden parametre eklenmiş olur.
  if (config.stackPublishableClientKey) {
    authorizeParams.client_secret = config.stackPublishableClientKey
  }
  const authorizeRes = await fetch(
    `${config.stackBaseUrl}/api/v1/auth/oauth/authorize/google?${toQuery(authorizeParams)}`,
  )
  if (!authorizeRes.ok) throw new Error(await readOAuthError(authorizeRes))
  const { location } = (await authorizeRes.json()) as { location?: string }
  if (!location) throw new Error(GOOGLE_UNAVAILABLE)

  // 3) Sistem tarayıcısını aç; kullanıcı Google'da onaylayınca Stack,
  //    REDIRECT_URI'ye code + state query paramlarıyla geri döndürür ve OS
  //    uygulamayı öne getirir.
  const result = await WebBrowser.openAuthSessionAsync(location, REDIRECT_URI)
  // 'cancel' / 'dismiss': kullanıcı vazgeçti; hata değil, sessizce çıkılır.
  if (result.type !== 'success') return null

  // 4) Callback'ten state + code'u ayıkla. state uyuşmazlığı callback'in bu
  //    akışa ait olmadığı anlamına gelir; giriş sürdürülmez.
  const returnedState = queryParam(result.url, 'state')
  if (returnedState !== state) throw new Error('Giriş doğrulanamadı. Lütfen tekrar dene.')
  const code = queryParam(result.url, 'code')
  if (!code) throw new Error(GOOGLE_UNAVAILABLE)

  // 5) Token exchange: code + verifier ile Stack'ten oturum token'ları.
  //    redirect_uri, authorize adımındaki değerle birebir aynı olmak zorunda.
  const tokenBody: Record<string, string> = {
    grant_type: 'authorization_code',
    client_id: config.stackProjectId,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  }
  if (config.stackPublishableClientKey) {
    tokenBody.client_secret = config.stackPublishableClientKey
  }
  const tokenRes = await fetch(`${config.stackBaseUrl}/api/v1/auth/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tokenBody),
  })
  if (!tokenRes.ok) throw new Error(await readOAuthError(tokenRes))
  const data = (await tokenRes.json()) as {
    access_token: string
    refresh_token: string
    is_new_user?: boolean
  }
  // userId bu uçta ayrı alan olarak dönmez; access token'ın sub'ından çözülür.
  const userId = userIdFromAccessToken(data.access_token)
  if (!userId) throw new Error(GOOGLE_UNAVAILABLE)
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    userId,
    isNewUser: Boolean(data.is_new_user),
  }
}
