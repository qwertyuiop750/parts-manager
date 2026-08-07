import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.warehouse.partsmanager",
  appName: "配件仓位管家",
  webDir: "dist",
  backgroundColor: "#1e293b",
  android: {
    backgroundColor: "#1e293b",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#1e293b",
      showSpinner: false,
    },
    Camera: {
      // Android 13+ 需运行时申请相机权限（插件会自动弹出）
    },
  },
};

export default config;
