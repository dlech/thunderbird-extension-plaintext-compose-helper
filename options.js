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
