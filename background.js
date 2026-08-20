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

// Registered compose scripts only apply to compose tabs opened after
// registration, so any compose window already open when the extension
// (re)starts needs the script injected by hand. compose.js guards against
// running twice in the same window in case this races with a registered
// injection.
async function injectExistingComposeTabs() {
  const tabs = await browser.tabs.query({ type: "messageCompose" });
  for (const tab of tabs) {
    browser.scripting.insertCSS({ target: { tabId: tab.id }, files: ["ruler.css"] }).catch(() => {});
    browser.scripting.executeScript({ target: { tabId: tab.id }, files: ["compose.js"] }).catch(() => {});
  }
}

injectExistingComposeTabs();

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
