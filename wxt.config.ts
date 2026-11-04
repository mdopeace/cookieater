import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: ".",
  modules: ["@wxt-dev/auto-icons"],
  manifest: (env) => ({
    name: "Cookieater: Cookie Manager",
    description: "Inspect, search, and manage cookies for the website you’re viewing.",
    incognito: env.browser === "firefox" ? undefined : "split",
    permissions: ["cookies"],
    host_permissions: ["<all_urls>"],
    ...(env.browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "cookieater@mdopeace.github.io",
              strict_min_version: "142.0",
              data_collection_permissions: {
                required: ["none"],
              },
            },
          },
        }
      : {}),
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Ctrl+Shift+Y",
          mac: "Command+Shift+Y",
        },
        description: "Open Cookieater",
      },
    },
  }),
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
