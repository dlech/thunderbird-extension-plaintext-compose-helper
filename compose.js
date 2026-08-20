(async () => {
  // Guards against running twice in the same window: the registered compose
  // script and the manual executeScript fallback in background.js can both
  // fire for a tab that was already open when the extension (re)started.
  if (window.__textRulerInjected) {
    return;
  }
  window.__textRulerInjected = true;

  const settings = await browser.runtime.sendMessage({ command: "getSettings" });
  if (!settings || !settings.isPlainText) {
    return;
  }

  let visible = settings.enabled;
  const root = document.documentElement.style;

  // The ruler itself is a body::after rule in ruler.css, driven by these
  // custom properties. Rendering it via a registered stylesheet (rather
  // than a JS-created DOM node) means Thunderbird removes it automatically
  // the moment the addon is disabled, the same way tabs.insertCSS is torn
  // down - no cleanup code needed on our end.

  function updateOffset() {
    const bodyStyle = getComputedStyle(document.body);
    const leftInset =
      (parseFloat(bodyStyle.marginLeft) || 0) + (parseFloat(bodyStyle.paddingLeft) || 0);
    root.setProperty("--text-ruler-offset", `calc(${leftInset}px + ${settings.columns}ch)`);
  }

  function updateColor() {
    root.setProperty("--text-ruler-color", settings.color);
  }

  function updateVisibility() {
    root.setProperty("--text-ruler-display", visible ? "block" : "none");
    browser.runtime.sendMessage({ command: "setTitle", visible });
  }

  updateOffset();
  updateColor();
  updateVisibility();

  window.addEventListener("resize", updateOffset);

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") {
      return;
    }
    if (changes.columns) {
      settings.columns = changes.columns.newValue;
      updateOffset();
    }
    if (changes.color) {
      settings.color = changes.color.newValue;
      updateColor();
    }
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message && message.command === "toggle") {
      visible = !visible;
      updateVisibility();
    }
  });
})();
