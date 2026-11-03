import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: ".",
  modules: ["@wxt-dev/auto-icons"],
  manifest: {
    name: "Cookieater: Cookie Manager",
    description: "Inspect, search, and manage cookies for the website you’re viewing.",
    incognito: "split",
    permissions: ["cookies"],
    host_permissions: ["<all_urls>"],
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Ctrl+Shift+Y",
          mac: "Command+Shift+Y",
        },
        description: "Open Cookieater",
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
