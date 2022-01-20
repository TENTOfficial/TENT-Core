// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var minimizeButton = document.getElementById('minimize-button')
var maxButton = document.getElementById('min-max-button')
var restoreButton = document.getElementById('restore-button')
var closeButton = document.getElementById('close-button')
var closeButtonDebugging = document.getElementById('close-button-debugging')
var switchCoinButton = document.getElementById('switch-coin-button')

var minimizeButtonEnd = document.getElementById('minimize-button-end')
var maxButtonEnd = document.getElementById('min-max-button-end')
var restoreButtonEnd = document.getElementById('restore-button-end')

if(minimizeButton)
{
  minimizeButton.addEventListener('click', function () {
    remote.getCurrentWindow().minimize()
  })
}

if(maxButton)
{
  maxButton.addEventListener('click', function () {
    var currentWindow = remote.getCurrentWindow()
    currentWindow.maximize()
  })
}

if(restoreButton)
{
  restoreButton.addEventListener('click', function () {
    var currentWindow = remote.getCurrentWindow()
    currentWindow.unmaximize()
  })
}

if(closeButton)
{
  closeButton.addEventListener('click', function () {
    electron.ipcRenderer.send('main-close-window')
  })
}

if(closeButtonDebugging)
{
  closeButtonDebugging.addEventListener('click', function () {
    electron.ipcRenderer.send('main-close-debugging')
  })
}

if(switchCoinButton)
{
  switchCoinButton.addEventListener('click', function () {
    var arg = {}
    arg.type = MsgType.SELECT_COIN_SETTINGS
    arg.title = 'Select Coin'
    electron.ipcRenderer.send('main-update-data-splash', {type: UpdateDataType.SELECTCOINSETTINGS, data: arg})
  })
}


if(minimizeButtonEnd)
{
  minimizeButtonEnd.addEventListener('click', function () {
    remote.getCurrentWindow().minimize()
  })
}

if(maxButtonEnd)
{
  maxButtonEnd.addEventListener('click', function () {
    var currentWindow = remote.getCurrentWindow()
    currentWindow.maximize()
  })
}

if(restoreButtonEnd)
{
  restoreButtonEnd.addEventListener('click', function () {
    var currentWindow = remote.getCurrentWindow()
    currentWindow.unmaximize()
  })
}

function toggleMaxRestoreButtons() {
  var window = remote.getCurrentWindow();
  if (window.isMaximized()) {
    maxButton ? maxButton.style.display = "none" : ""
    restoreButton ? restoreButton.style.display = "flex" : ""
    maxButtonEnd ? maxButtonEnd.style.display = "none" : ""
    restoreButtonEnd ? restoreButtonEnd.style.display = "flex" : ""
  } else {
    restoreButton ? restoreButton.style.display = "none" : ""
    maxButton ? maxButton.style.display = "flex" : ""
    restoreButtonEnd ? restoreButtonEnd.style.display = "none" : ""
    maxButtonEnd ? maxButtonEnd.style.display = "flex" : ""
  }
}

electron.ipcRenderer.on('child-toggle-screen', function(event, msgData) {
  toggleMaxRestoreButtons()
  console.log("toggle screen")
  ipc.send('main-update-chart', undefined)
})