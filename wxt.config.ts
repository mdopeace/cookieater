import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: ".",
  modules: ["@wxt-dev/auto-icons"],
  manifest: {
    name: "cookieater",
    description: "A friendly cookie editor",
    permissions: ["cookies", "activeTab", "storage"],
    host_permissions: ["<all_urls>"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
