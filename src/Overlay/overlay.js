//* App Setup
let currentKeysPressed = [];
let scrollWheelDirection = null;
let wheelEventEndTimeout = null;

const settings = {
  defaultSpeed: 1.0,
  stepChange: 0.25,
  defaultHotkey: "ShiftE",
  incrementHotkey: "ShiftWheelUp",
  decrementHotkey: "ShiftWheelDown",
  overlayStyle: "full",
  overlayType: "show/hide",
  overlayPosition: "topLeft",
  overlaySize: "medium",
};

//* Bezel Setup
const bezel =
  document.querySelector(".ytp-bezel-text").parentElement.parentElement;
const bezelIcon = document.querySelector(".ytp-bezel-icon");
const bezelText = document.querySelector(".ytp-bezel-text");
let bezelTimeout;
const bezelLeftArrow = `
<svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%"><use class="ytp-svg-shadow" xlink:href="#ytp-id-62"></use><path class="ytp-svg-fill" d="M 17,24 V 12 l -8.5,6 8.5,6 z m .5,-6 8.5,6 V 12 l -8.5,6 z" id="ytp-id-62"></path></svg>`;
const bezelRightArrow = `
<svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%"><use class="ytp-svg-shadow" xlink:href="#ytp-id-59"></use><path class="ytp-svg-fill" d="M 10,24 18.5,18 10,12 V 24 z M 19,12 V 24 L 27.5,18 19,12 z" id="ytp-id-59"></path></svg>
`;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}

function start() {
  //* Overlay Setup
  const overlay = createOverlay();
  injectOverlay(overlay);

  const decrementButton = document.getElementById("decrement");
  const incrementButton = document.getElementById("increment");
  const playBackDisplay = document.getElementById("displayedRate");
  const videoPlayer = document.getElementsByTagName("video")[0];

  //* Speed Setup
  let initialSpeed = settings.defaultSpeed;
  let finalSpeed = initialSpeed;
  videoPlayer.playbackRate = finalSpeed;

  //* Event Listeners
  decrementButton.addEventListener("click", () => {
    finalSpeed = sanitiseSpeed(finalSpeed - settings.stepChange);
    videoPlayer.playbackRate = finalSpeed;
  });

  incrementButton.addEventListener("click", () => {
    finalSpeed = sanitiseSpeed(finalSpeed + settings.stepChange);
    videoPlayer.playbackRate = finalSpeed;
  });

  videoPlayer.addEventListener("ratechange", () => {
    if (document.querySelector(".ad-showing")) {
      // Prevent ad from breaking overlay speed
      playBackDisplay.textContent = `${finalSpeed.toFixed(2)}`;
    } else {
      // Insurance
      playBackDisplay.textContent = `${videoPlayer.playbackRate.toFixed(2)}`;
      finalSpeed = videoPlayer.playbackRate;
    }
  });

  videoPlayer.addEventListener("play", () => {
    // Insurance
    videoPlayer.playbackRate = Number(playBackDisplay.textContent);

    playBackDisplay.textContent = `${videoPlayer.playbackRate.toFixed(2)}`;
    finalSpeed = videoPlayer.playbackRate;
  });

  // On video change, reset speed to settings default.
  const observer = new MutationObserver((changes) => {
    changes.forEach((change) => {
      if (change.attributeName.includes("src")) {
        videoPlayer.playbackRate = initialSpeed;
      }
    });
  });
  observer.observe(videoPlayer, { attributes: true });

  document.addEventListener("keydown", down);
  document.addEventListener("keyup", up);
  document.addEventListener("focusout", clearCurrentKeysPressed);
  document.addEventListener("wheel", wheel);

  //* Event Handlers
  function wheel(e) {
    if (e.deltaY < 0) {
      scrollWheelDirection = "WheelUp";
    } else if (e.deltaY > 0) {
      scrollWheelDirection = "WheelDown";
    }

    clearTimeout(wheelEventEndTimeout);

    wheelEventEndTimeout = setTimeout(() => {
      down(scrollWheelDirection);

      if (scrollWheelDirection) {
        up(scrollWheelDirection);
        scrollWheelDirection = null;
      }
    }, 0);
  }

  function clearCurrentKeysPressed() {
    currentKeysPressed = [];
  }

  // Add latest unique key pressed to currentKeysPressed
  // Case 1: Auto invocation via keydown EventListener
  // Case 2: Intentional invocation via WheelEventEndTimeout

  // Ignore 3 or more simultaneaous key presses.

  // if currentKeysPressed matches a hotkey, perform hotkey action
  // otherwise, do nothing
  function down(e) {
    if (e.key && !currentKeysPressed.includes(e.key)) {
      currentKeysPressed.push(e.key);
    }

    if (e === "WheelUp" || e === "WheelDown") {
      if (!currentKeysPressed.includes(e)) {
        currentKeysPressed.push(e);
      }
    }

    if (currentKeysPressed.length > 2) {
      currentKeysPressed.pop();
      return;
    }

    const userPressed = currentKeysPressed.join("");

    if (userPressed === settings.incrementHotkey) {
      finalSpeed = sanitiseSpeed(finalSpeed + settings.stepChange);
      videoPlayer.playbackRate = finalSpeed;

      updateBezelText();
      updateBezelIcon(bezelRightArrow);
      showBezel();
    }

    if (userPressed === settings.decrementHotkey) {
      finalSpeed = sanitiseSpeed(finalSpeed - settings.stepChange);
      videoPlayer.playbackRate = finalSpeed;

      updateBezelText();
      updateBezelIcon(bezelLeftArrow);
      showBezel();
    }

    if (userPressed === settings.defaultHotkey) {
      if (settings.defaultSpeed < finalSpeed) {
        updateBezelIcon(bezelLeftArrow);
      } else if (settings.defaultSpeed > finalSpeed) {
        updateBezelIcon(bezelRightArrow);
      }

      finalSpeed = sanitiseSpeed(settings.defaultSpeed);
      videoPlayer.playbackRate = finalSpeed;

      updateBezelText();
      showBezel();
    }

    document
      .querySelector(".ytp-bezel")
      .setAttribute("aria-label", `Speed is ${finalSpeed.toFixed(2)}x`);
  }

  // Removes latest released key from currentKeysPressed
  // Case 1: Auto invocation via keyup EventListener
  // Case 2: Intentional invocation via WheelEventEndTimeout
  function up(e) {
    if (e.key && currentKeysPressed.includes(e.key)) {
      currentKeysPressed = currentKeysPressed.filter((i) => i !== e.key);
    }

    if (e === "WheelUp" || e === "WheelDown") {
      if (currentKeysPressed.includes(e)) {
        currentKeysPressed = currentKeysPressed.filter((i) => i !== e);
      }
    }
  }

  //* Utility functions
  function updateBezelIcon(arrow) {
    bezelIcon.innerHTML = arrow;
  }

  function updateBezelText() {
    bezelText.textContent = `${finalSpeed.toFixed(2)}x`;
  }

  function showBezel() {
    bezel.style.display = "block";
    bezel.classList.remove("ytp-bezel-text-hide");
    clearTimeout(bezelTimeout);
    bezelTimeout = setTimeout(hideBezel, 500);
  }

  function hideBezel() {
    bezel.style.display = "none";
    bezel.classList.add("ytp-bezel-text-hide");
  }
}

function createOverlay() {
  const overlay = document.createElement("div");
  overlay.classList = "overlay";
  overlay.setAttribute("size", settings.overlaySize);
  overlay.setAttribute("custom-style", settings.overlayStyle);
  overlay.setAttribute("type", settings.overlayType);
  overlay.setAttribute("position", settings.overlayPosition);

  overlay.innerHTML = `
    <button class="minus" id="decrement"><span>-</span></button>
    <span class="playbackRateDisplay"><span id="displayedRate">1.00</span><span class="x">x</span></span>
    <button id="increment"><span>+</span></button>
  `;

  return overlay;
}

function injectOverlay(overlay) {
  document.getElementById("movie_player").prepend(overlay);
}

function sanitiseSpeed(speed) {
  if (speed < 0.1) {
    return 0.1;
  } else if (speed > 16.0) {
    return 16.0;
  }

  return speed;
}
