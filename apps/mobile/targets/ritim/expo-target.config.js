/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  // Bosluklu isim EAS'in hedef-kimlik eslemesini kiriyor (credential tarafi
  // bosluklari silip 'afiyetritim' ariyor, pbxproj'da 'afiyet ritim' kaliyor).
  name: 'afiyetritim',
  deploymentTarget: '17.0',
  entitlements: {
    'com.apple.security.application-groups': ['group.co.afiet.app'],
  },
}
