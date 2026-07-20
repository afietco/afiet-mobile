const { getSentryExpoConfig } = require('@sentry/react-native/metro')
const { withNativeWind } = require('nativewind/metro')

// Expo SDK 52+ resolves the workspace root and monorepo watch folders automatically.
const config = getSentryExpoConfig(__dirname, { includeWebReplay: false })

module.exports = withNativeWind(config, { input: './src/global.css' })
