import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'xyz.enoki.blog.caramelos',
  appName: 'エノキ電気ニュース',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    },
    // BackgroundRunner: {
    //   label: 'xyz.enoki.blog.caramelos.background',
    //   src: 'runners/background-runner.js',
    //   event: 'CapacitorTemplateBackgroundRunner',
    //   repeat: true,
    //   /** OSの制約で15分間隔 */
    //   interval: 15,
    //   autoStart: true,
    // },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
  server: {
    hostname: 'blog.caramelos.xyz',
    androidScheme: 'https',
  },
  // deepLinks: {
  //   enabled: true,
  //   prefixes: ['capacitor://', 'https://blog.caramelos.xyz'],
  // },
  android: {
    // useLegacyBridge: true,
    // notificationIcon: 'ic_location_status',
  },
}

export default config
