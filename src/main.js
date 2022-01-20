// Modules to control application life and create native browser window
var app = require('electron').app
var BrowserWindow = require('electron').BrowserWindow
var Menu = require('electron').Menu
var Tray = require('electron').Tray
var ipc = require('electron').ipcMain
var globalShortcut = require('electron').globalShortcut
var path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var tray = null
var mainWindow
var endWindow
var splashWindow
var debuggingWindow
var settings
var confData
var serverData
var isDevMode = process.execPath.match(/[\\/]electron/);
var isReload = false
var isWalletStarted = false

if (isDevMode || betaTest) 
{
  isFrame = false
  isShow = true
}
else
{
  isFrame = false
  isShow = false
}
function createEndWindow () {
  console.log("create end window")
  // Create the browser window.
  if (process.platform == 'linux') {
    endWindow = new BrowserWindow({
      width: 750,
      height: 400,
      minWidth: 750,
      minHeight: 400,
      frame: isFrame,
      show: isShow,
      icon: path.join(__dirname + '/../assets/icons/linux/icon.png')
    })
  }
  else
  {
    endWindow = new BrowserWindow({
      width: 750,
      height: 400,
      minWidth: 750,
      minHeight: 400,
      frame: isFrame,
      show: isShow
    })
  }
  if (isDevMode || betaTest) 
  {
    endWindow.webContents.openDevTools();
  }
  endWindow.loadFile('src/screens/endscreen.html', {"extraHeaders" : "pragma: no-cache\n"})

  endWindow.on('maximize', function () {
    endWindow.webContents.send('child-toggle-screen')
  })

  endWindow.on('unmaximize', function () {
    endWindow.webContents.send('child-toggle-screen')
  })

  endWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should devare the corresponding element.
    endWindow = null
    splashWindow = null
    app.quit()
  })
}

function createSplashWindow () {
  // Create the browser window.
  if (process.platform == 'linux') {
    splashWindow = new BrowserWindow({
      width: 750,
      height: 400,
      minWidth: 750,
      minHeight: 400,
      resizable: true,
      icon: path.join(__dirname + '/../assets/icons/linux/icon.png'),
      frame: isFrame,
      show: isShow
    })
  }
  else
  {
    splashWindow = new BrowserWindow({
      width: 750,
      height: 400,
      minWidth: 750,
      minHeight: 400,
      resizable: true,
      frame: isFrame,
      show: isShow
    })
  }

  splashWindow.loadFile('src/screens/splashscreen.html', {"extraHeaders" : "pragma: no-cache\n"})

  if (isDevMode || betaTest) 
  {
    splashWindow.webContents.openDevTools();
  }

  splashWindow.on('maximize', function () {
    splashWindow.webContents.send('child-toggle-screen')
  })

  splashWindow.on('unmaximize', function () {
    splashWindow.webContents.send('child-toggle-screen')
  })

  splashWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should devare the corresponding element.
    splashWindow = null
    if(isWalletStarted)
    {
      if(mainWindow)
      {
        mainWindow.close()
      }
    }
    else
    {
      console.log("quit app")
      splashWindow = null
      mainWindow = null
      endWindow = null
      app.quit()
    }
  })

  splashWindow.once('ready-to-show', function(){
    splashWindow.show()
  })

  createWindow()
}

function createWindow () {
  // Create the browser window.
  if (isDevMode || betaTest) 
  {

  }
  if (process.platform == 'linux') {
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 620,
      minWidth: 1000,
      minHeight: 620,
      enableLargerThanScreen: true,
      show: isShow,
      icon: path.join(__dirname + '/../assets/icons/linux/icon.png'),
      frame: isFrame
    })
  }
  else
  {
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 620,
      minWidth: 1000,
      minHeight: 620,
      enableLargerThanScreen: true,
      show: isShow,
      frame: isFrame
    })
  }
  // mainWindow.$ = mainWindow.jQuery = require('jquery');
  // and load the index.html of the app.

  mainWindow.loadFile('src/screens/index.html', {"extraHeaders" : "pragma: no-cache\n"})

  // Open the DevTools.
  if (isDevMode || betaTest) 
  {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function (event) {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should devare the corresponding element.
    mainWindow = null
    console.log('mainWindow close')
    var arg = [settings, confData, serverData]
    endWindow ? endWindow.show() : ""
    endWindow ? endWindow.webContents.send('child-stop-daemon' , {msg: arg}) : ""
    splashWindow ? splashWindow.hide() : ""
  })

  mainWindow.webContents.on('new-window', function (event, url) {
      // stop Electron from opening another BrowserWindow
      event.preventDefault()
      // open the url in the default system browser
      shell.openExternal(url)
  })

  mainWindow.on('resize', function () {
    mainWindow.webContents.send('child-resize-screen')
  })

  mainWindow.on('restore', function () {
    mainWindow.setSkipTaskbar(false)
  })

  mainWindow.on('maximize', function () {
    mainWindow.webContents.send('child-toggle-screen')
  })

  mainWindow.on('unmaximize', function () {
    mainWindow.webContents.send('child-toggle-screen')
  })
  
  mainWindow.on('minimize', function () {
    if(settings != null && settings != undefined && settings.closeminimize)
    {
      mainWindow.setSkipTaskbar(true)
    }
  })

  mainWindow.on('show', function(){
    var trayMenu = Menu.buildFromTemplate([
      {
        label: 'Show',
        click: function () {
          if(mainWindow != null && mainWindow != undefined)
          {
            mainWindow.restore()
          }
        }
      },
      {
        label: 'Quit',
        click: function () {
          if(mainWindow != null && mainWindow != undefined)
          {
            mainWindow.close()
          }
        }
      }
    ])

    if (process.platform != 'darwin')
    {
      tray.setToolTip('TENT Core')
      tray.setContextMenu(trayMenu)
      tray.on('double-click', function () {
        mainWindow ? mainWindow.show() : ""
      })
    }
  })

  var template = [{
      label: "Application",
      submenu: [
          { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]}, {
      label: "Edit",
      submenu: [
          { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]}
  ]
  if (process.platform == 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  }

  createEndWindow()
}


function createDebuggingWindow () {
  if(!debuggingWindow)
  {
    var widthScrn = 750
    var heightScrn = 400
    if (isDevMode || betaTest) 
    {
      widthScrn = 1280
      heightScrn = 720
    }
    // Create the browser window.
    if (process.platform == 'linux') {
      debuggingWindow = new BrowserWindow({
        width: widthScrn,
        height: heightScrn,
        minWidth: 750,
        minHeight: 400,
        resizable: false,
        icon: path.join(__dirname + '/../assets/icons/linux/icon.png'),
        frame: isFrame,
        show: false
      })
    }
    else
    {
      debuggingWindow = new BrowserWindow({
        width: widthScrn,
        height: heightScrn,
        minWidth: 750,
        minHeight: 400,
        resizable: false,
        frame: isFrame,
        show: false
      })
    }

    debuggingWindow.loadFile('src/screens/debuggingscreen.html', {"extraHeaders" : "pragma: no-cache\n"})

    if (isDevMode || betaTest) 
    {
      debuggingWindow.webContents.openDevTools();
    }

    debuggingWindow.once('ready-to-show', function(){
      console.log("ready-to-show")
      debuggingWindow.show()
      var arg = []
      arg.push(settings)
      arg.push(confData)
      arg.push(serverData)
      console.log("update settings")
      debuggingWindow ? debuggingWindow.webContents.send('debugging-update-settings' , {msg: arg}) : ""

    })
    
    debuggingWindow.on('closed', function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should devare the corresponding element.
      debuggingWindow = null
    })
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (splashWindow === null) {
    createSplashWindow()
  }
})

app.on('ready', function () {
  createSplashWindow()
  
  if (process.platform == 'win32') {
    tray = new Tray(path.join(__dirname, "../assets/icons/win/icon.ico"))
  }
  else if (process.platform == 'linux') {
    tray = new Tray(path.join(__dirname, "../assets/icons/linux/icon.png"))
  }
  else if (process.platform == 'darwin') {
    return
  }
})


ipc.on('main-reload', function (event, arg) {
  //close main screen
  isReload = true
  mainWindow.close()
})

ipc.on('main-show-debuggingscreen', function (event, arg) {
  console.log("show debugging screen")
  createDebuggingWindow()
})

ipc.on('main-start-wallet', function (event, arg) {
  console.log("show main screen")
  if(splashWindow)
  {
    splashWindow.webContents.send('child-start-wallet' , {})
  }
})

ipc.on('main-close-splashscreen', function (event, arg) {
  console.log("show main screen")
  if(splashWindow)
  {
    splashWindow.webContents.send('child-close-splashscreen' , {})
    splashWindow.hide()
  }
  mainWindow ? mainWindow.show() : ""
})

ipc.on('main-close-debugging', function (event, arg) {
  if(debuggingWindow)
  {
    debuggingWindow.close()
  }
})

ipc.on('main-start-wallet', function (event, arg) {
  console.log("show main screen")
  if(splashWindow)
  {
    splashWindow.webContents.send('child-start-wallet' , {})
  }
})

ipc.on('main-self-close', function (event, arg) {
  mainWindow.close()
})

ipc.on('main-close-app', function (event, arg) {
  if(!isReload)
  {
    app.quit()
  }
  else
  {
    isReload = false
    endWindow ? endWindow.hide() : ""
    splashWindow ? splashWindow.reload() : ""
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipc.on('main-app-version', function (event, arg) {
  if(splashWindow)
  {
    splashWindow.webContents.send('child-app-version' , {msg: arg})
  }
})

ipc.on('main-update-scope', function (event, arg) {
  if(splashWindow)
  {
    splashWindow.webContents.send('child-update-scope' , {msg: arg})
  }
})

ipc.on('main-start-wallet', function (event, arg) {
  isWalletStarted = true
})

ipc.on('main-close-window', function (event, arg) {
  splashWindow.close()
})

ipc.on('main-show-popup', function (event, arg) {
  if(splashWindow)
  {
    splashWindow.webContents.send('child-show-popup' , {msg: arg})
  }
})

ipc.on('main-update-data', function (event, arg) {
  if(splashWindow)
  {
    splashWindow.webContents.send('child-show-popup' , {msg: arg})
  }
  else
  {
    console.log("No splash")
  }
})

ipc.on('main-update-data-splash', function (event, arg) {
  if(splashWindow)
  {
    splashWindow.webContents.send('child-update-data-splash' , {msg: arg})
  }
  else
  {
    console.log("No splash")
  }
})

ipc.on('main-update-data-loading', function (event, arg) {
  if(mainWindow)
  {
    mainWindow.webContents.send('child-update-data-loading' , {msg: arg})
  }
  else
  {
    console.log("No main")
  }
})

ipc.on('main-show-splash', function (event, arg) {
  splashWindow ? splashWindow.show() : console.log("No main")
})

ipc.on('main-update-data', function (event, arg) {
  event.sender.send('child-process-data' , {msg: arg});
})

ipc.on('main-get-data-zcash', function (event, arg) {
  event.sender.send('child-get-data-zcash' , {msg: arg});
})

ipc.on('main-update-address', function (event, arg) {
  event.sender.send('child-update-address' , {msg: arg});
})

ipc.on('main-update-send', function (event, arg) {
  event.sender.send('child-update-send' , {msg: arg});
})

ipc.on('main-update-shield', function (event, arg) {
  event.sender.send('child-update-shield' , {msg: arg});
})

ipc.on('main-verify-address', function (event, arg) {
  event.sender.send('child-verify-address' , {msg: arg});
})

ipc.on('main-verify-zaddress', function (event, arg) {
  event.sender.send('child-verify-zaddress' , {msg: arg});
})

ipc.on('main-send-coin', function (event, arg) {
  event.sender.send('child-send-coin' , {msg: arg});
})
ipc.on('main-send-to-address', function (event, arg) {
  event.sender.send('child-send-to-address' , {msg: arg});
})
ipc.on('main-set-tx-fee', function (event, arg) {
  event.sender.send('child-set-tx-fee' , {msg: arg});
})
ipc.on('main-check-transaction', function (event, arg) {
  event.sender.send('child-check-transaction' , {msg: arg});
})

ipc.on('main-shield-coin', function (event, arg) {
  event.sender.send('child-shield-coin' , {msg: arg});
})

ipc.on('main-check-transaction-shield', function (event, arg) {
  event.sender.send('child-check-transaction-shield' , {msg: arg});
})

ipc.on('main-update-transactions', function (event, arg) {
  event.sender.send('child-update-transactions' , {msg: arg});
})

ipc.on('main-update-transactions-time', function (event, arg) {
  event.sender.send('child-update-transactions-time' , {msg: arg});
})

ipc.on('main-masternode-list', function (event, arg) {
  event.sender.send('child-masternode-list' , {msg: arg});
})

ipc.on('main-loading-screen', function (event, arg) {
  event.sender.send('child-loading-screen' , {msg: arg});
})

ipc.on('main-summary-data', function (event, arg) {
  event.sender.send('child-summary-data' , {msg: arg});
})

ipc.on('main-execute-timer', function (event, arg) {
  event.sender.send('child-execute-timer' , {msg: arg});
})

ipc.on('main-show-screen', function (event, arg) {
  event.sender.send('child-show-screen' , {msg: arg});
})

ipc.on('main-dump-priv-key', function (event, arg) {
  event.sender.send('child-dump-priv-key' , {msg: arg});
})

ipc.on('main-import-priv-key', function (event, arg) {
  event.sender.send('child-import-priv-key' , {msg: arg});
})

ipc.on('main-update-loading', function (event, arg) {
  event.sender.send('child-update-loading' , {msg: arg});
})

ipc.on('main-masternode-outputs', function (event, arg) {
  event.sender.send('child-masternode-outputs' , {msg: arg});
})

ipc.on('main-masternode-genkey', function (event, arg) {
  event.sender.send('child-masternode-genkey' , {msg: arg});
})

ipc.on('main-start-masternode', function (event, arg) {
  event.sender.send('child-start-masternode' , {msg: arg});
})

ipc.on('main-start-alias', function (event, arg) {
  event.sender.send('child-start-alias' , {msg: arg});
})

ipc.on('main-encryptwallet', function (event, arg) {
  event.sender.send('child-encryptwallet' , {msg: arg});
})

ipc.on('main-walletpassphrasechange', function (event, arg) {
  event.sender.send('child-walletpassphrasechange' , {msg: arg});
})

ipc.on('main-walletlock', function (event, arg) {
  event.sender.send('child-walletlock' , {msg: arg});
})

ipc.on('main-walletpassphrase', function (event, arg) {
  event.sender.send('child-walletpassphrase' , {msg: arg});
})

ipc.on('main-update-settings', function (event, arg) {
  settings = arg[0]
  confData = arg[1]
  serverData = arg[2]
  event.sender.send('child-update-settings' , {msg: arg});
  splashWindow ? splashWindow.webContents.send('child-update-settings' , {msg: arg}) : ""
})

ipc.on('main-update-price', function (event, arg) {
  event.sender.send('child-update-price' , {msg: arg});
})

ipc.on('main-get-peer-info', function (event, arg) {
  event.sender.send('child-get-peer-info' , {msg: arg});
})

ipc.on('main-get-debug', function (event, arg) {
  event.sender.send('child-get-debug' , {msg: arg});
})

ipc.on('main-spawn-error', function (event, arg) {
  event.sender.send('child-spawn-error' , {msg: arg});
})

ipc.on('main-update-chart', function (event, arg) {
  event.sender.send('child-update-chart' , {msg: arg});
})

ipc.on('main-get-blockchain-info-zcash', function (event, arg) {
  event.sender.send('child-get-blockchain-info-zcash' , {msg: arg});
})

ipc.on('main-get-block-header-zcash', function (event, arg) {
  event.sender.send('child-get-block-header-zcash' , {msg: arg});
})

ipc.on('main-list-transactions-zcash', function (event, arg) {
  event.sender.send('child-list-transactions-zcash' , {msg: arg});
})

ipc.on('main-get-address-by-account-zcash', function (event, arg) {
  event.sender.send('child-get-address-by-account-zcash' , {msg: arg});
})

ipc.on('main-list-address-groupings-zcash', function (event, arg) {
  event.sender.send('child-list-address-groupings-zcash' , {msg: arg});
})

ipc.on('main-z-list-address-zcash', function (event, arg) {
  event.sender.send('child-z-list-address-zcash' , {msg: arg});
})

ipc.on('main-validate-address-zcash', function (event, arg) {
  event.sender.send('child-validate-address-zcash' , {msg: arg});
})

ipc.on('main-z-validate-address-zcash', function (event, arg) {
  event.sender.send('child-z-validate-address-zcash' , {msg: arg});
})

ipc.on('main-get-new-address', function (event, arg) {
  event.sender.send('child-get-new-address' , {msg: arg});
})


ipc.on('main-z-get-balance-zcash', function (event, arg) {
  event.sender.send('child-z-get-balance-zcash' , {msg: arg});
})

ipc.on('main-list-received-by-address-zcash', function (event, arg) {
  event.sender.send('child-list-received-by-address-zcash' , {msg: arg});
})

ipc.on('main-execute-shield-all', function (event, arg) {
  event.sender.send('child-execute-shield-all' , {msg: arg});
})

ipc.on('main-execute-multiple-shield', function (event, arg) {
  event.sender.send('child-execute-multiple-shield' , {msg: arg});
})

ipc.on('main-update-locked-coin', function (event, arg) {
  event.sender.send('child-update-locked-coin' , {msg: arg});
})
ipc.on('main-transparent-balance', function (event, arg) {
  event.sender.send('child-transparent-balance' , {msg: arg});
})

ipc.on('main-notification-data', function (event, arg) {
  event.sender.send('child-notification-data' , {msg: arg});
})

ipc.on('main-execute-send-coin', function (event, arg) {
  event.sender.send('child-execute-send-coin' , {msg: arg});
})

ipc.on('main-mnbudget-show', function (event, arg) {
  event.sender.send('child-mnbudget-show' , {msg: arg});
})

ipc.on('main-mnbudget-vote', function (event, arg) {
  event.sender.send('child-mnbudget-vote' , {msg: arg});
})

ipc.on('main-localmn-status', function (event, arg) {
  event.sender.send('child-localmn-status' , {msg: arg});
})

ipc.on('main-exportwallet', function (event, arg) {
  event.sender.send('child-exportwallet' , {msg: arg});
})

ipc.on('main-unlock-modal', function (event, arg) {
  event.sender.send('child-unlock-modal' , {msg: arg});
})

// end screen
ipc.on('main-change-language', function (event, arg) {
  endWindow.webContents.send('child-change-language' , {msg: arg});
})

