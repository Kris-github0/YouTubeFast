//* Setup
const hotkeyInputs = document.querySelectorAll("input[type='text']");
const hotkeysFieldset = document.getElementById("hotkeysFieldset");
const restoreButton = document.getElementById("restoreButton");
const form = document.querySelector("form");

let scrollWheelDirection = "";
let wheelEventEndTimeout = null;

const HOTKEYS = {
  increaseSpeed: { currentlyPressed: [], updatable: true, hotkey: "", id: "1" },
  decreaseSpeed: { currentlyPressed: [], updatable: true, hotkey: "", id: "2" },
  resetSpeed: { currentlyPressed: [], updatable: true, hotkey: "", id: "3" },
  openSettingsPage: {
    currentlyPressed: [],
    updatable: true,
    hotkey: "",
    id: "4",
  },
};

const defaultSettings = {
  defaultSpeed: 1.0,
  stepChange: 0.25,
  incrementHotkey: "ShiftWheelUp",
  decrementHotkey: "ShiftWheelDown",
  resetSpeed: "ShiftR",
  openSettingsPage: "ShiftS",
  overlayStyle: "normal",
  overlayVisibility: "show/hide",
  overlayPosition: "topLeft",
  overlaySize: "medium",
};

//* Event Listeners
document.addEventListener("DOMContentLoaded", setDefaults);

restoreButton.addEventListener("click", setDefaults);
form.addEventListener("submit", (e) => e.preventDefault());

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

//* Event Handlers
function setDefaults() {
  document.getElementById("defaultSpeed").value =
    defaultSettings.defaultSpeed.toFixed(2);
  document.getElementById("stepChange").value = defaultSettings.stepChange;
  HOTKEYS.increaseSpeed.hotkey = defaultSettings.incrementHotkey;
  document.getElementById("1").textContent = "Shift + WheelUp";
  document.getElementById("1").title = "Shift + WheelUp";
  HOTKEYS.decreaseSpeed.hotkey = defaultSettings.decrementHotkey;
  document.getElementById("2").textContent = "Shift + WheelDown";
  document.getElementById("2").title = "Shift + WheelDown";
  HOTKEYS.resetSpeed.hotkey = defaultSettings.resetSpeed;
  document.getElementById("3").textContent = "Shift + R";
  document.getElementById("3").title = "Shift + R";
  HOTKEYS.openSettingsPage.hotkey = defaultSettings.openSettingsPage;
  document.getElementById("4").textContent = "Shift + S";
  document.getElementById("4").title = "Shift + S";
  document.getElementById("overlayStyle").options[0].selected = true;
  document.getElementById("overlayVisibility").options[1].selected = true;
  document.getElementById("overlayPosition").options[0].selected = true;
  document.getElementById("overlaySize").options[1].selected = true;
}

function clearCurrentlyPressed(e) {
  HOTKEYS[e.target.id]["currentlyPressed"] = [];
  HOTKEYS[e.target.id]["updatable"] = true;
}

function down(e, scrollWheelDirection) {
  let element;
  const keyCall = e.target;
  const IGNORE_KEY = e.key === "Tab" || e.key === "CapsLock";

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
    clearCurrentlyPressed(e);
    HOTKEYS[element.id]["hotkey"] = "";
    document.getElementById(HOTKEYS[element.id]["id"]).textContent = "";
    return;
  }

  if (!HOTKEYS[element.id]["updatable"]) {
    return;
  }

  // Keyboard handler
  if (
    e.key &&
    !HOTKEYS[element.id]["currentlyPressed"].includes(convert(e.key))
  ) {
    HOTKEYS[element.id]["currentlyPressed"].push(convert(e.key));
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

  // Update visual and obj
  if (HOTKEYS[element.id]["currentlyPressed"].length === 1) {
    document.getElementById(HOTKEYS[element.id]["id"]).textContent =
      HOTKEYS[element.id]["currentlyPressed"].join("");
    document.getElementById(HOTKEYS[element.id]["id"]).title =
      HOTKEYS[element.id]["currentlyPressed"].join("");

    HOTKEYS[element.id]["hotkey"] =
      HOTKEYS[element.id]["currentlyPressed"].join("");
  }
  if (HOTKEYS[element.id]["currentlyPressed"].length === 2) {
    HOTKEYS[element.id]["updatable"] = false;
    document.getElementById(HOTKEYS[element.id]["id"]).textContent =
      HOTKEYS[element.id]["currentlyPressed"].join(" + ");
    document.getElementById(HOTKEYS[element.id]["id"]).title =
      HOTKEYS[element.id]["currentlyPressed"].join(" + ");

    HOTKEYS[element.id]["hotkey"] =
      HOTKEYS[element.id]["currentlyPressed"].join("");
  }

  // Disallow 3 or more
  if (HOTKEYS[element.id]["currentlyPressed"].length > 2) {
    HOTKEYS[element.id]["currentlyPressed"].pop();
    return;
  }

  removeDuplicates(element);
}

function up(e, el) {
  // Keyboard handler
  if (
    e.key &&
    HOTKEYS[e.target.id]["currentlyPressed"].includes(convert(e.key))
  ) {
    HOTKEYS[e.target.id]["currentlyPressed"] = HOTKEYS[e.target.id][
      "currentlyPressed"
    ].filter((i) => i !== convert(e.key));
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
function removeDuplicates(inputEl) {
  for (const hotkey in HOTKEYS) {
    if (
      HOTKEYS[hotkey]["hotkey"].toLowerCase() ===
        HOTKEYS[inputEl.id]["hotkey"].toLowerCase() &&
      HOTKEYS[hotkey]["id"] !== HOTKEYS[inputEl.id]["id"]
    ) {
      document.getElementById(HOTKEYS[hotkey]["id"]).textContent = "";
      HOTKEYS[hotkey]["hotkey"] = "";
    }
  }
}

function convert(key) {
  if (key === "Control") {
    return "Ctrl";
  }

  if (key === " ") {
    return "Spacebar";
  }

  return key;
}
