const DEFAULT_SETTINGS = {
  enabled: true,
  columns: 80,
  color: "#ff0000",
};

// Re-registering an already-registered compose script throws when the
// background page restarts; that's fine, it just means we're already set up.
browser.scripting.compose
  .registerScripts([
    {
      id: "text-ruler-compose-script",
      js: ["compose.js"],
      css: ["ruler.css"],
    },
  ])
  .catch(() => {});

async function getSettings(tabId) {
  const stored = await browser.storage.local.get(DEFAULT_SETTINGS);
  const details = await browser.compose.getComposeDetails(tabId);
  return {
    ...stored,
    isPlainText: details.isPlainText,
  };
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message || message.command !== "getSettings") {
    return;
  }
  return getSettings(sender.tab.id);
});

browser.composeAction.onClicked.addListener((tab) => {
  browser.tabs.sendMessage(tab.id, { command: "toggle" });
});
