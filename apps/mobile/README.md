# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Production error reporting

Release builds report crashes to the `afiet/afiet-mobile` Sentry project. The
organization and project slugs live in the `@sentry/react-native/expo` plugin
config in `app.json`, and each EAS build profile sets its own
`EXPO_PUBLIC_SENTRY_DSN` plus `EXPO_PUBLIC_SENTRY_ENV` (`development`,
`staging`, `production`) so the three environments stay separable in Sentry.
The SDK stays disabled in dev bundles (`enabled: !__DEV__`), so only release
builds report.

The `preview` and `production` profiles also upload source maps, so staging and
production crash reports symbolicate back to readable stack traces. That upload
authenticates with `SENTRY_AUTH_TOKEN`, an organization auth token stored as a
secret in the matching EAS environment:

```sh
eas env:create --scope project --environment production \
  --name SENTRY_AUTH_TOKEN --type string --visibility secret --value <token>
eas env:create --scope project --environment preview \
  --name SENTRY_AUTH_TOKEN --type string --visibility secret --value <token>
```

The token can only be minted from the Sentry dashboard (Settings → Auth Tokens
→ Create New Token); the API rejects token-based auth for that endpoint.
`--visibility secret` keeps the value readable only by the EAS builder, never
by the CLI or the dashboard, and it must never be committed. A secret cannot be
read back, so setting up a second environment means minting a second token.

Only `development` keeps `SENTRY_DISABLE_AUTO_UPLOAD`: it declares no EAS
environment, so no token reaches it. If a token is ever rotated away, restore
that flag on the affected profile — without a token the native release build
fails on the upload step.

### Local native builds

**Use the npm scripts, not `npx expo run:*` directly:**

```sh
npm run ios      # or: npm run android
```

The scripts set `SENTRY_DISABLE_AUTO_UPLOAD=true` for you. Calling
`npx expo run:ios` by hand runs the release upload step, and because a local
shell holds no `SENTRY_AUTH_TOKEN` the build dies at "Bundle React Native code
and images" with `An organization ID or slug is required`. The flag lives in
the script precisely so nobody has to remember it; EAS builds are unaffected
because they never invoke these scripts.

`npm run ios` also fills in `LANG` when the shell leaves it empty. CocoaPods
runs the project path through `unicode_normalize`, which raises
`Encoding::CompatibilityError: Unicode Normalization not appropriate for
ASCII-8BIT` under a `C`/empty locale. An explicitly non-UTF-8 `LANG` (such as
`LANG=C`) still breaks; export a UTF-8 locale in that case.

Supply the environment through `apps/mobile/.env.local`:

```sh
EXPO_PUBLIC_API_URL=<api>
EXPO_PUBLIC_STACK_PROJECT_ID=<stack-project>
```

Keep the API URL and the Stack project id from the *same* environment, or the
app authenticates against one backend while calling another.

If pod install fails after dependency changes, the lockfile snapshot is stale:
`rm apps/mobile/ios/Podfile.lock && (cd apps/mobile/ios && pod install)`. The
`ios/` directory is generated and gitignored, so this is always safe.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
