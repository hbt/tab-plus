
if (window == top) {
  window.addEventListener("keyup", keyListener, false);
}


function keyListener(e) {
  // Ctrl + shift and the action

  if (e.ctrlKey)
  {

    chrome.extension.sendRequest({
      keyCode: "" + e.which,
      shiftPressed: e.shiftKey == true,
      altPressed: e.altKey == true,
    });
  }
}
