/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'afiyet ritim',
  deploymentTarget: '17.0',
  entitlements: {
    'com.apple.security.application-groups': ['group.co.afiet.app'],
  },
}
