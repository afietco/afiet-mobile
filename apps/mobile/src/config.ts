import { requireMobileEnvironment } from './configValidation'

/**
 * Expo inlines EXPO_PUBLIC_* values at build time. EAS profiles or a local
 * .env file must provide the environment-specific API and Stack Auth pair.
 */
const { apiUrl, stackProjectId } = requireMobileEnvironment({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  stackProjectId: process.env.EXPO_PUBLIC_STACK_PROJECT_ID,
})

/** Maps Stack Auth projects to the callback suffix shared with afiet.co. */
const stackProjectEnv: Record<string, 'dev' | 'staging' | 'prod'> = {
  'df8401ea-a019-4316-9cbd-4192a5ab22a0': 'dev',
  '4aefb05e-eecb-4fb4-931f-dd28cdcd5171': 'staging',
  '474c5335-1b01-446e-962d-5eac1786e293': 'prod',
}

export const config = {
  apiUrl,
  stackProjectId,
  stackBaseUrl: process.env.EXPO_PUBLIC_STACK_BASE_URL ?? 'https://api.stack-auth.com',
  /** Callback environment derived from the configured Stack Auth project. */
  env: stackProjectEnv[stackProjectId] ?? 'dev',
  /** Optional client-side key; omitted from headers when it is not configured. */
  stackPublishableClientKey: process.env.EXPO_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ?? '',
  /**
   * RevenueCat public SDK keys, per platform, or '' when this build has no
   * billing configured. Empty is a supported state, not a misconfiguration:
   * it is what every build looks like until that store is wired up, and the
   * paywall reads it as "no offer to show" rather than crashing.
   *
   * Deliberately not validated by requireMobileEnvironment: a missing API URL
   * makes the app useless, a missing billing key only makes it free.
   *
   * Development and preview profiles carry the RevenueCat Test Store key,
   * which simulates purchases without any App Store or Play product. That key
   * must never reach a store build, so the production profile carries the real
   * platform keys and nothing else.
   *
   * Kept as a pair rather than resolved here: picking one would mean importing
   * react-native's Platform, and this module is reached by tests that run in
   * plain node, where that import cannot be parsed.
   */
  revenueCatKeys: {
    ios: (process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '').trim(),
    android: (process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '').trim(),
  },
}
