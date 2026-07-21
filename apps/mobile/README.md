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

Source map upload is a separate, still-pending step. It needs an organization
auth token, which can only be created from the Sentry dashboard
(Settings → Auth Tokens → Create New Token — the API rejects token-based auth
for that endpoint). Once created, store it as an EAS secret:

```sh
eas env:create --scope project --environment production \
  --name SENTRY_AUTH_TOKEN --type secret --value <token>
```

Then drop `SENTRY_DISABLE_AUTO_UPLOAD` from the `production` and `development`
profiles in `eas.json`. Until the token exists that flag must stay, otherwise
the native release build fails on the upload step. The token must never be
committed.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
