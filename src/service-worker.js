chrome.runtime.onMessage.addListener((message) => {
  if (message === "openSettingsPage") {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("./options/options.html"));
    }
  }
});

chrome.action.onClicked.addListener(async () => {
  const tab = await getCurrentTab();
  const regex =
    /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)?([\w\-]+)?(\S+)?$/gm;

  if (regex.test(tab.url)) {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("./options/options.html"));
    }
  } else {
  }
});

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);

  return tab;
}
