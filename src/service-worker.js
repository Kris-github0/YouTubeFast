chrome.runtime.onMessage.addListener((message) => {
  if (message === "openSettingsPage") {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("./options/options.html"));
    }
  }
});
