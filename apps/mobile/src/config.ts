/**
 * Ortam yapılandırması — EXPO_PUBLIC_* değişkenleri build'e gömülür.
 * Varsayılanlar development katmanına işaret eder (dev Cloud Run + dev Stack
 * Auth projesi). staging/prod build'leri EAS profillerinde bu değişkenleri
 * geçer. Bkz. afiet-backend docs/BRANCHING.md.
 */
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://app-api-dev-f7cnieuuza-ew.a.run.app',
  stackProjectId:
    process.env.EXPO_PUBLIC_STACK_PROJECT_ID ?? 'df8401ea-a019-4316-9cbd-4192a5ab22a0',
  stackBaseUrl: process.env.EXPO_PUBLIC_STACK_BASE_URL ?? 'https://api.stack-auth.com',
}
