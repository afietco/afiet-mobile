/**
 * Ortam yapılandırması — EXPO_PUBLIC_* değişkenleri build'e gömülür.
 * Varsayılanlar development katmanına işaret eder (dev Cloud Run + dev Stack
 * Auth projesi). staging/prod build'leri EAS profillerinde bu değişkenleri
 * geçer. Bkz. afiet-backend docs/BRANCHING.md.
 */
const stackProjectId =
  process.env.EXPO_PUBLIC_STACK_PROJECT_ID ?? 'df8401ea-a019-4316-9cbd-4192a5ab22a0'

/** Stack Auth proje id'si → ortam adı. afiet.co'daki auth callback sayfaları
    (sifre-yenile, e-posta-dogrula) ortamı yolun son parçasından okur; bu eşleme
    web tarafıyla ortak sözleşmedir. */
const stackProjectEnv: Record<string, 'dev' | 'staging' | 'prod'> = {
  'df8401ea-a019-4316-9cbd-4192a5ab22a0': 'dev',
  '4aefb05e-eecb-4fb4-931f-dd28cdcd5171': 'staging',
  '474c5335-1b01-446e-962d-5eac1786e293': 'prod',
}

export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://app-api-dev-f7cnieuuza-ew.a.run.app',
  stackProjectId,
  stackBaseUrl: process.env.EXPO_PUBLIC_STACK_BASE_URL ?? 'https://api.stack-auth.com',
  /** Ortam adı (dev | staging | prod), Stack proje id'sinden türetilir.
      Bilinmeyen id dev'e düşer: varsayılan yapılandırma zaten dev katmanıdır,
      yeni bir ortam eklenirse eşlemeye satır eklenir. */
  env: stackProjectEnv[stackProjectId] ?? 'dev',
  /** Opsiyonel publishable client key. Doluysa tüm Stack Auth isteklerine
      X-Stack-Publishable-Client-Key başlığı eklenir; boşken (şu anki proje
      ayarı) anahtarsız çalışılır. Gerçek değerler: dev burada varsayılan,
      staging/prod eas.json profillerinde. */
  stackPublishableClientKey: process.env.EXPO_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ?? '',
}
