import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",
  main() {
    const appearance = window.matchMedia("(prefers-color-scheme: dark)");

    const reportAppearance = () => {
      if (document.visibilityState !== "visible") return;

      void browser.runtime.sendMessage({
        type: "cookieater:appearance",
        dark: appearance.matches,
      });
    };

    appearance.addEventListener("change", reportAppearance);
    document.addEventListener("visibilitychange", reportAppearance);
    reportAppearance();
  },
});
