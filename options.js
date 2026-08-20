const DEFAULTS = { enabled: true, columns: 80, color: "#ff0000" };

const enabledEl = document.getElementById("enabled");
const columnsEl = document.getElementById("columns");
const colorEl = document.getElementById("color");

async function load() {
  const settings = await browser.storage.local.get(DEFAULTS);
  enabledEl.checked = settings.enabled;
  columnsEl.value = settings.columns;
  colorEl.value = settings.color;
}

function save() {
  browser.storage.local.set({
    enabled: enabledEl.checked,
    columns: Number(columnsEl.value) || DEFAULTS.columns,
    color: colorEl.value,
  });
}

enabledEl.addEventListener("change", save);
columnsEl.addEventListener("change", save);
colorEl.addEventListener("change", save);

load();

// mailnews.send_plaintext_flowed and mailnews.wraplength have no normal
// preferences UI, but Thunderbird exposes read-only access to them (plus a
// change notification) through the standard messengerSettings permission -
// no privileged Experiment API needed. There's no set() for these, so the
// UI can only flag problems and point at the Config Editor.
const flowedStatusEl = document.getElementById("flowedStatus");
const flowedBadgeEl = document.getElementById("flowedBadge");
const wrapStatusEl = document.getElementById("wrapStatus");
const wrapBadgeEl = document.getElementById("wrapBadge");

function setBadge(el, isGood, shouldBe, badExplanation) {
  el.textContent = isGood ? "✓ good" : `⚠ should be ${shouldBe}`;
  el.className = "badge " + (isGood ? "good" : "bad");
  el.title = isGood ? "Matches kernel.org's recommendation." : badExplanation;
}

async function loadMailnewsSettings() {
  const [flowed, wrapLimit] = await Promise.all([
    browser.messengerSettings.messagePlainTextFlowedOutputEnabled.get({}),
    browser.messengerSettings.messageLineLengthLimit.get({}),
  ]);

  flowedStatusEl.textContent = flowed.value ? "enabled" : "disabled";
  setBadge(
    flowedBadgeEl,
    !flowed.value,
    "disabled",
    "Kernel.org recommends this be disabled (mailnews.send_plaintext_flowed = false): flowed formatting lets the recipient's mail client re-wrap your text, which can corrupt patches and other content that must keep its exact line breaks.",
  );

  wrapStatusEl.textContent = wrapLimit.value;
  setBadge(
    wrapBadgeEl,
    wrapLimit.value === 0,
    "0 (no limit)",
    "Kernel.org recommends 0/no limit (mailnews.wraplength = 0): a forced wrap column can break patches and other content that must keep its exact line breaks.",
  );
}

browser.messengerSettings.messagePlainTextFlowedOutputEnabled.onChange.addListener(loadMailnewsSettings);
browser.messengerSettings.messageLineLengthLimit.onChange.addListener(loadMailnewsSettings);

// onChange isn't confirmed to fire for edits made directly in the Config
// Editor (only for changes going through this same API), so also refresh
// whenever this page becomes visible again - e.g. after switching away to
// the Config Editor and back within Thunderbird.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    loadMailnewsSettings();
  }
});

loadMailnewsSettings();

for (const button of document.querySelectorAll("button.copy")) {
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(button.dataset.pref);
    const original = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = original;
    }, 1500);
  });
}
