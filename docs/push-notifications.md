# Push notification native setup

The JavaScript integration uses `expo-notifications` and the Expo Push Service.
No provider secret is bundled into the application.

## Android

1. Create the Android app `co.afiet.app` in the Firebase project used by Afiet.
2. Add `google-services.json` to every EAS environment as a file secret named
   `GOOGLE_SERVICES_JSON`. `app.config.ts` passes the temporary file path to
   Expo during prebuild.
3. Upload the Firebase service-account JSON as the Android FCM V1 credential in
   EAS Credentials. Do not expose it as an `EXPO_PUBLIC_` variable or commit it.

## iOS

Manage the APNs key for `co.afiet.app` through EAS Credentials. Expo uses the
same key for development and production signing contexts.

## Expo Push Service security

Enable enhanced push security in the Expo project, then store the generated
access token in Google Secret Manager as
`app-<env>-expo-push-access-token`. The backend sends it only in the server-side
`Authorization` header.

Keep the backend GitHub environment variable `PUSH_ENABLED` set to `false`
until credentials and a native development build have been verified. The
current implementation intentionally does not run an EAS build or submission.
