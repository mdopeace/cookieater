import lightIcon from "../assets/icon.png?no-inline";
import darkIcon from "../assets/icon-dark.png?no-inline";
import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

const iconSizes = [16, 24, 32, 48] as const;
const iconDataCache = new Map<string, Promise<Record<string, ImageData>>>();

function loadIconData(path: string): Promise<Record<string, ImageData>> {
  const cached = iconDataCache.get(path);
  if (cached) return cached;

  const iconData = (async () => {
    const response = await fetch(new URL(path, import.meta.url));
    if (!response.ok) throw new Error(`Unable to load toolbar icon: ${path}`);

    const bitmap = await createImageBitmap(await response.blob());
    try {
      return Object.fromEntries(
        iconSizes.map((size) => {
          const canvas = new OffscreenCanvas(size, size);
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Unable to create icon canvas context");

          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(bitmap, 0, 0, size, size);
          return [size, context.getImageData(0, 0, size, size)];
        }),
      );
    } finally {
      bitmap.close();
    }
  })();

  iconDataCache.set(path, iconData);
  void iconData.catch(() => iconDataCache.delete(path));
  return iconData;
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender) => {
    if (
      message?.type !== "cookieater:appearance" ||
      typeof message.dark !== "boolean" ||
      !sender.tab?.active
    ) {
      return;
    }

    // Use dark artwork against Chrome's light appearance and light artwork against dark.
    const iconPath = message.dark ? lightIcon : darkIcon;
    void loadIconData(iconPath)
      .then((imageData) => browser.action.setIcon({ imageData }))
      .catch((error) => console.error("Failed to update Cookieater icon:", error));
  });
});
