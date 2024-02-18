//* Setup
const hotkeyInputs = document.querySelectorAll("input[type='text']");
const hotkeysFieldset = document.getElementById("hotkeysFieldset");
const restoreButton = document.getElementById("restoreButton");
const saveButton = document.getElementById("saveButton");
const form = document.querySelector("form");

let scrollWheelDirection = "";
let wheelEventEndTimeout = null;
let savedTimeout = null;

const HOTKEYS = {
  increaseSpeed: { currentlyPressed: [], updatable: true, hotkey: [], id: "1" },
  decreaseSpeed: { currentlyPressed: [], updatable: true, hotkey: [], id: "2" },
  resetSpeed: { currentlyPressed: [], updatable: true, hotkey: [], id: "3" },
  openSettingsPage: {
    currentlyPressed: [],
    updatable: true,
    hotkey: [],
    id: "4",
  },
};

const defaultSettings = {
  defaultSpeed: 1.0,
  stepChange: 0.25,
  increaseSpeed: ["Shift", "WheelUp"],
  decreaseSpeed: ["Shift", "WheelDown"],
  resetSpeed: ["Shift", "R"],
  openSettingsPage: ["Shift", "S"],
  overlayStyle: "normal",
  overlayVisibility: "show/hide",
  overlayPosition: "topLeft",
  overlaySize: "medium",
};

//* Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["userSettings"]).then((response) => {
    if (response.userSettings === undefined) {
      applySettings(defaultSettings);
    } else {
      applySettings(response.userSettings);
    }
  });
});

hotkeysFieldset.addEventListener("keydown", down);
hotkeysFieldset.addEventListener("keyup", up);

for (input of hotkeyInputs) {
  input.addEventListener("focusout", clearCurrentlyPressed);
}

document.addEventListener("wheel", function r(e) {
  let element = document.activeElement;
  const isHotkeyInputEl =
    element.parentElement &&
    element.parentElement.classList.contains("hotkeysLabel");

  if (!isHotkeyInputEl) {
    return;
  }

  if (e.deltaY < 0) {
    scrollWheelDirection = "WheelUp";
  } else if (e.deltaY > 0) {
    scrollWheelDirection = "WheelDown";
  }

  clearTimeout(wheelEventEndTimeout);

  wheelEventEndTimeout = setTimeout(() => {
    down(element, scrollWheelDirection);
    if (scrollWheelDirection) {
      up(scrollWheelDirection, element);
      scrollWheelDirection = null;
    }
  }, 0);
});

restoreButton.addEventListener("click", () => {
  applySettings(defaultSettings);
});

form.addEventListener("submit", (e) => {
  const userSettings = {
    defaultSpeed: Number(getFieldValue("defaultSpeed")),
    stepChange: Number(getFieldValue("stepChange")),
    increaseSpeed: HOTKEYS.increaseSpeed.hotkey,
    decreaseSpeed: HOTKEYS.decreaseSpeed.hotkey,
    resetSpeed: HOTKEYS.resetSpeed.hotkey,
    openSettingsPage: HOTKEYS.openSettingsPage.hotkey,
    overlayStyle: getFieldValue("overlayStyle"),
    overlayVisibility: getFieldValue("overlayVisibility"),
    overlayPosition: getFieldValue("overlayPosition"),
    overlaySize: getFieldValue("overlaySize"),
  };

  chrome.storage.local.set({ userSettings: userSettings });

  saveButton.textContent = "Saved";
  saveButton.classList.add("saved");

  clearTimeout(savedTimeout);

  savedTimeout = setTimeout(() => {
    saveButton.textContent = "Save";
    saveButton.classList.remove("saved");
  }, 1250);

  e.preventDefault();
});

//* Event Handlers
function applySettings(settings) {
  document.getElementById("defaultSpeed").value =
    settings.defaultSpeed.toFixed(2);
  document.getElementById("stepChange").value = settings.stepChange.toFixed(2);

  HOTKEYS.increaseSpeed.hotkey = settings.increaseSpeed;
  displayHotkeySetting(settings.increaseSpeed, "1");

  HOTKEYS.decreaseSpeed.hotkey = settings.decreaseSpeed;
  displayHotkeySetting(settings.decreaseSpeed, "2");

  HOTKEYS.resetSpeed.hotkey = settings.resetSpeed;
  displayHotkeySetting(settings.resetSpeed, "3");

  HOTKEYS.openSettingsPage.hotkey = settings.openSettingsPage;
  displayHotkeySetting(settings.openSettingsPage, "4");

  displayOverlaySetting(settings.overlayStyle, "overlayStyle");
  displayOverlaySetting(settings.overlayVisibility, "overlayVisibility");
  displayOverlaySetting(settings.overlayPosition, "overlayPosition");
  displayOverlaySetting(settings.overlaySize, "overlaySize");
}

function clearCurrentlyPressed(e) {
  HOTKEYS[e.target.id]["currentlyPressed"] = [];
  HOTKEYS[e.target.id]["updatable"] = true;
}

function down(e, scrollWheelDirection) {
  let element;
  const keyCall = e.target;
  const IGNORE_KEY =
    e.key === "Tab" || e.key === "CapsLock" || e.key === "Enter";

  if (keyCall) {
    element = e.target;
  } else {
    // scrollWheel call
    element = e;
  }

  if (IGNORE_KEY) {
    return;
  }

  if (e.key === "Backspace") {
    clearField(e);
    return;
  }

  if (!HOTKEYS[element.id]["updatable"]) {
    return;
  }

  // Keyboard handler
  if (
    e.key &&
    !HOTKEYS[element.id]["currentlyPressed"].includes(convertKey(e.key))
  ) {
    HOTKEYS[element.id]["currentlyPressed"].push(convertKey(e.key));
  }

  // Scroll wheel handler
  if (
    scrollWheelDirection === "WheelUp" ||
    scrollWheelDirection === "WheelDown"
  ) {
    if (
      !HOTKEYS[element.id]["currentlyPressed"].includes(scrollWheelDirection)
    ) {
      HOTKEYS[element.id]["currentlyPressed"].push(scrollWheelDirection);
    }
  }

  if (HOTKEYS[element.id]["currentlyPressed"].length > 2) {
    HOTKEYS[element.id]["currentlyPressed"].pop();
    return;
  }

  HOTKEYS[element.id]["hotkey"] = HOTKEYS[element.id]["currentlyPressed"];
  displayHotkeySetting(
    HOTKEYS[element.id]["currentlyPressed"],
    HOTKEYS[element.id]["id"]
  );

  if (HOTKEYS[element.id]["currentlyPressed"].length === 2) {
    HOTKEYS[element.id]["updatable"] = false;
  }

  removeDuplicates(element);
}

function up(e, el) {
  // Keyboard handler
  if (
    e.key &&
    HOTKEYS[e.target.id]["currentlyPressed"].includes(convertKey(e.key))
  ) {
    HOTKEYS[e.target.id]["currentlyPressed"] = HOTKEYS[e.target.id][
      "currentlyPressed"
    ].filter((i) => i !== convertKey(e.key));
  }

  // Scroll wheel handler
  if (e === "WheelUp" || e === "WheelDown") {
    if (HOTKEYS[el.id]["currentlyPressed"].includes(e)) {
      HOTKEYS[el.id]["currentlyPressed"] = HOTKEYS[el.id][
        "currentlyPressed"
      ].filter((i) => i !== e);
    }
  }
}

//* Utility Functions
function displayOverlaySetting(value, id) {
  const el = document.getElementById(id);

  for (const option of el.options) {
    if (option.value === value) {
      option.selected = true;
      return;
    }
  }
}

function displayHotkeySetting(hotkey, id) {
  const el = document.getElementById(id);
  el.textContent = formatHotkey(hotkey);
  el.title = formatHotkey(hotkey);
}

function removeDuplicates(inputEl) {
  for (const hotkey in HOTKEYS) {
    if (
      HOTKEYS[hotkey]["hotkey"].join("").toLowerCase() ===
        HOTKEYS[inputEl.id]["hotkey"].join("").toLowerCase() &&
      HOTKEYS[hotkey]["id"] !== HOTKEYS[inputEl.id]["id"]
    ) {
      document.getElementById(HOTKEYS[hotkey]["id"]).textContent = "";
      HOTKEYS[hotkey]["hotkey"] = [];
    }
  }
}

function convertKey(key) {
  if (key === "Control") {
    return "Ctrl";
  }

  if (key === " ") {
    return "Spacebar";
  }

  return key;
}

function formatHotkey(hotkey) {
  if (hotkey.length === 2) {
    return hotkey.join(" + ");
  }

  if (hotkey.length === 1) {
    return hotkey.join("");
  }

  return "";
}

function getFieldValue(id) {
  return document.getElementById(id).value;
}

function clearField(e) {
  clearCurrentlyPressed(e);
  HOTKEYS[e.target.id]["hotkey"] = [];
  document.getElementById(HOTKEYS[e.target.id]["id"]).textContent = "";
}
