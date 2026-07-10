const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

// Expo SDK 52+ monorepo'yu (watchFolders, workspace kökü) kendisi çözer
const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './src/global.css' })
