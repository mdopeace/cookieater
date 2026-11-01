import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: ".",
  modules: ["@wxt-dev/auto-icons"],
  manifest: {
    name: "Cookieater: Cookie Manager",
    description: "Inspect, search, and manage cookies for the website you’re viewing.",
    permissions: ["cookies"],
    host_permissions: ["<all_urls>"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
