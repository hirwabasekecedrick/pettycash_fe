import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pettycash.app",
  appName: "PettyCash",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;