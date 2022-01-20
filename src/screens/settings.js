app.controller('SettingsCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.detail = {}
  $scope.privateAddresses = []
  $scope.privateAddressesTemp = []
  $scope.detail.btnEnabled = false
  var debugList = []
  $scope.detail.debugdata = ''
  $scope.detail.datetime = 0
  $scope.detail.transactionstime = 0
  $scope.detail.showTransactionTime = false
  $scope.detail.datetimeType = [
    {
      "key": "YYYY/MM/DD",
      "value": 1
    },
    {
      "key": "DD/MM/YYYY",
      "value": 2
    }
  ]

  $scope.detail.transactionsType = [
    {
      "key": "Day",
      "value": 1
    },
    {
      "key": "Week",
      "value": 2
    },
    {
      "key": "Month",
      "value": 3
    },
    {
      "key": "Quarter",
      "value": 4
    },
    {
      "key": "Year",
      "value": 5
    }
  ]

  $scope.detail.bottype = [
    "Do not use",
    "Discord"
  ]

  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess', function(event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations();
  });

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'global.alert',
        'global.fail',
        'global.restart',
        'global.ok',
        'global.confirmationTitle',
        'global.close',
        'global.success2',
        'settingsView.operations.datetimeType1',
        'settingsView.operations.datetimeType2',
        'settingsView.operations.day',
        'settingsView.operations.week',
        'settingsView.operations.month',
        'settingsView.operations.quarter',
        'settingsView.operations.year',
        'settingsView.operations.doNotUse',
        'settingsView.operations.emptyBotName',
        'settingsView.operations.emptyApiKey',
        'settingsView.operations.restartWallet',
        'settingsView.operations.restartWallet1',
        'settingsView.operations.restartWallet2',
        'settingsView.operations.revertDefault',
        'settingsView.operations.addPeers',
        'settingsView.operations.walletBackup',
        'settingsView.operations.cannotBackupWallet',
        'settingsView.operations.backingUpWallet',
        'settingsView.operations.restartWallet3',
        'settingsView.operations.restartWallet4',
        'settingsView.operations.peersList',
        'settingsView.encrypt',
        'settingsView.encryptWlt',
        'settingsView.changePassword',
        'settingsView.operations.restartWallet5'
      ]).then((o) => {
        $scope.detail.datetimeType = [
          {
            'key': o['settingsView.operations.datetimeType1'],
            'value': 1
          },
          {
            'key': o['settingsView.operations.datetimeType2'],
            'value': 2
          }
        ]
        $scope.detail.transactionsType = [
          {
            'key': o['settingsView.operations.day'],
            'value': 1
          },
          {
            'key': o['settingsView.operations.week'],
            'value': 2
          },
          {
            'key': o['settingsView.operations.month'],
            'value': 3
          },
          {
            'key': o['settingsView.operations.quarter'],
            'value': 4
          },
          {
            'key': o['settingsView.operations.year'],
            'value': 5
          }
        ]
        $scope.detail.bottype[0] = o['settingsView.operations.doNotUse']
        $scope.ctrlTranslations = o
      })
    })
  }

  $scope.getControllerTranslations();

  function spawnMessage(type, text, btn, title)
  {
    var arg = [ScreenType.SETTINGS, false]
    electron.ipcRenderer.send('main-show-screen', arg)
    $timeout(function(){
      $scope.detail.title = title == undefined ? $scope.ctrlTranslations['global.alert'] + '!!!' : title
      $scope.detail.text = text
      $scope.detail.btn = btn
      if(type == MsgType.CONFIRMATION)
      {
        $('#restartWallet').modal()
      }
      else if(type == MsgType.CONFIRMATION2)
      {
        $('#restartWallet2').modal()
      }
      else if(type == MsgType.DEFAULT_SETTINGS)
      {
        $('#defaultSettings').modal()
      }
      else if(type == MsgType.ALERT)
      {
        $('#alertSettings').modal()
      }
      else if(type == MsgType.ADD_PEERS)
      {
        $('#addPeersSettings').modal()
      }
      else if(type == MsgType.DEBUG)
      {
        $('#debugSettings').modal()
      }
      else if(type == MsgType.GET_PEERS)
      {
        $('#getPeersSettings').modal()
      }
      else if(type == MsgType.ENCRYPT)
      {
        $('#modalEncrypt').modal()
      }
      else if(type == MsgType.CHANGE_PASS)
      {
        $('#modalChangePass').modal()
      }
    },0)
  }

  function readSettingsLocal()
  {
    var temp = {}
    temp['daemon'] = $scope.detail.daemon
    temp['autoupdatedaemon'] = $scope.detail.autoupdatedaemon
    temp['background'] = $scope.detail.backgroundLocation
    temp['autostart'] = $scope.detail.autostart
    temp['enablelog'] = $scope.detail.enablelog
    temp['currency'] = $scope.detail.currency
    temp['symbol'] = $scope.detail.symbol
    temp['transactionschart'] = $scope.detail.transactionschart
    temp['datafolder'] = $scope.detail.dataLocation
    temp['closeminimize'] = $scope.detail.closeminimize
    temp['autoshield'] = $scope.detail.autoshield
    temp['shieldthreshold'] = $scope.detail.shieldthreshold
    temp['shieldaddress'] = $scope.detail.shieldaddress
    temp['hidezeroaddress'] = false
    temp['datetime'] = $scope.detail.datetime
    temp['transactionstime'] = $scope.detail.transactionstime
    temp['showfiatbalance'] = $scope.detail.showFiatBalance
    if($scope.detail.bot == "Discord" || $scope.detail.bot == "Telegram")
    {
      temp['bot'] = $scope.detail.bot
      temp['apikey'] = $scope.detail.apikey
      temp['botname'] = $scope.detail.botname
    }
    return temp
  }

  function populateSettings(settings)
  {
    $timeout(function(){
      $scope.detail.daemon = settings.daemon
      $scope.detail.autoupdatedaemon = settings.autoupdatedaemon
      $scope.detail.dataLocation = settings.datafolder
      $scope.detail.backgroundLocation = settings.background
      $scope.detail.autostart = settings.autostart
      $scope.detail.enablelog = settings.enablelog
      $scope.detail.transactionschart = settings.transactionschart
      $scope.detail.closeminimize = settings.closeminimize
      if(settings.currency == undefined)
      {
        $scope.detail.currency = 'USD'
        $scope.detail.symbol = '$'
      }
      else
      {
        $scope.detail.currency = settings.currency
        $scope.detail.symbol = settings.symbol
      }
      $scope.detail.coins = coinList.coins
      $scope.detail.autoshield = settings.autoshield && $scope.detail.shield
      $scope.detail.showFiatBalance = settings.showfiatbalance ? settings.showfiatbalance : true

      if(settings.shieldaddress != undefined)
      {
        var index = $scope.privateAddresses.findIndex(function(e){return e.text == settings.shieldaddress})
        if(index == -1)
        {
          var temp = {}
          temp['text'] = settings.shieldaddress
          temp['value'] = settings.shieldaddress
          $scope.privateAddresses.push(temp)
        }
      }
      $scope.detail.shieldaddress = settings.shieldaddress
      $scope.detail.shieldthreshold = settings.shieldthreshold
      $scope.detail.hidezeroaddress = false /*settings.hidezeroaddress*/
      if(settings.datetime != undefined)
      {
        $scope.detail.datetime = settings.datetime
      }
      else
      {
        $scope.detail.datetime = "1"
      }
      if(settings.transactionstime != undefined)
      {
        $scope.detail.transactionstime = settings.transactionstime
      }
      else
      {
        $scope.detail.transactionstime = "1"
      }
      if(settings.bot != undefined)
      {
        $scope.detail.bot = settings['bot']
        $scope.detail.apikey = settings['apikey']
        $scope.detail.botname = settings['botname']
      }
    },0)
  }

  $scope.openDaemon = function(){
    var dialogOptions;
    if(process.platform == 'win32')
    {
        dialogOptions= {
            filters: [
                { name: serverData.daemon, extensions: ["exe"] },
            ],
            properties: ["openFile"]
        }
    }
    else if(process.platform == 'linux' || process.platform == 'darwin')
    {
        dialogOptions= {
          filters: [
            { name: serverData.daemon},
          ],
            properties: ["openFile"]
        }
    }
    dialog.showOpenDialog(dialogOptions, function (fileNames) {
        if(fileNames === undefined){
          writeLog("No file selected");
        }else{
          $timeout(function(){
            $scope.detail.daemon = fileNames[0].replace(/\\/g, "/");
          },0)
        }
    })
  }


  $scope.openCli = function(){
    var dialogOptions;
    if(process.platform == 'win32')
    {
        dialogOptions= {
            filters: [
                { name: serverData.cli, extensions: ["exe"] },
            ],
            properties: ["openFile"]
        }
    }
    else if(process.platform == 'linux' || process.platform == 'darwin')
    {
        dialogOptions= {
          filters: [
            { name: serverData.cli },
            ],
            properties: ["openFile"]
        }
    }
    dialog.showOpenDialog(dialogOptions, function (fileNames) {
        if(fileNames === undefined){
          writeLog("No file selected");
        }else{
          $timeout(function(){
            $scope.detail.cli = fileNames[0].replace(/\\/g, "/");
          },0)
        }
    })
  }

  $scope.openDataLocation = function(){
    $scope.detail.disableSelectDirectory = true
    var dialogOptions = {
      properties: ["openDirectory"]
    }
    dialog.showOpenDialog(dialogOptions, function (folder) {
      $timeout(function(){
        $scope.detail.disableSelectDirectory = false
        if(folder === undefined){
          writeLog("No folder selected");
        }else{
          document.getElementById("data-dir").value = $scope.detail.dataLocation = folder[0];
        }
      }, 0)
    })
  }

  $scope.openBackground = function(){
    var dialogOptions = {
        filters: [
          {name: 'Images', extensions: ['jpg', 'png', 'gif']},
        ],
        properties: ["openFile"]
    }
    dialog.showOpenDialog(dialogOptions, function (fileNames) {
        if(fileNames === undefined){
          writeLog("No file selected");
        }else{
          $timeout(function(){
            $scope.detail.backgroundLocation = fileNames[0].replace(/\\/g, "/");
          },0)
        }
    })
  }

  $scope.faq = function(){
    shell.openExternal('https://docs.tent.app/wallets/snowgem-modern-wallet/frequently-asked-questions')
  }

  $scope.valueChange = function(value){
    $scope.detail.currency = value

    var index = $scope.detail.price.findIndex(function(e){return e.code == value})
    if(index > -1)
    {
      $scope.detail.symbol = $scope.detail.price[index].symbol
      writeLog($scope.detail.symbol)
    }
    else
    {
      $scope.detail.symbol = '*'
    }
  }

  $scope.botTypeChange = function(){
    //$scope.detail.currency = value
    if($scope.detail.bot == "Discord" || $scope.detail.bot == "Telegram")
    {
      $scope.detail.apiKey = settings[$scope.detail.bot] == undefined ? "" : settings[$scope.detail.bot]
    }
  }

  $scope.botNamePress = function(event){
    if (event.keyCode === 32)
    {
      alert('No space for bot name');
      event.preventDefault()
    }
  }

  $scope.applyClick = function(){
    var data = readSettingsLocal()
    if(data.bot != undefined)
    {
      if(data.botname == undefined || data.botname == "")
      {
        spawnMessage(
          MsgType.ALERT,
          $scope.ctrlTranslations['settingsView.operations.emptyBotName'],
          $scope.ctrlTranslations['global.fail'] + '!!'
        )
        return
      }
      else if(data.apikey == undefined || data.apikey == "")
      {
        spawnMessage(
          MsgType.ALERT,
          $scope.ctrlTranslations['settingsView.operations.emptyApiKey'],
          $scope.ctrlTranslations['global.fail'] + '!!'
        )
        return
      }
    }
    saveSettings(data, $scope.detail.currentCoin)
    var currData = {}
    writeLog($scope.detail.currentCoin)
    saveCurrentCoin($scope.detail.currentCoin)
    //restart wallet
    if(currentCoin != $scope.detail.currentCoin)
    {
      spawnMessage(
        MsgType.CONFIRMATION2,
        $scope.ctrlTranslations['settingsView.operations.restartWallet1'],
        $scope.ctrlTranslations['global.restart'],
        ""
      )
    }
    else
    {
      spawnMessage(
        MsgType.CONFIRMATION,
        $scope.ctrlTranslations['settingsView.operations.restartWallet2'],
        $scope.ctrlTranslations['global.restart'],
        $scope.ctrlTranslations['settingsView.operations.restartWallet']
      )
    }
  }

  $scope.cancelClick = function(){
    writeLog('populateSettings')
    $scope.privateAddresses = $scope.privateAddressesTemp
    $scope.detail.currentCoin = currentCoin
    populateSettings(settings)

    // var arg = ["help"]
    // startCli(arg)
  }

  $scope.defaultClick = function(){
    spawnMessage(
      MsgType.DEFAULT_SETTINGS,
      $scope.ctrlTranslations['settingsView.operations.revertDefault'],
      $scope.ctrlTranslations['global.ok'],
      $scope.ctrlTranslations['global.confirmationTitle']
    )
  }

  $scope.restartAction = function(){
    //check wallet status
    helpData = undefined
    setTimeout(walletStatusTimerFunction, 500)
  }

  $scope.defaultAction = function(){
    var loc = getWalletHome(false, currentCoin) + "/settings.json"
    writeLog("remove old settings " + loc)
    if(fs.existsSync(loc))
    {
      writeLog("remove old settings")
      fs.unlinkSync(loc);
    }
    spawnMessage(
      MsgType.CONFIRMATION,
      $scope.ctrlTranslations['settingsView.operations.restartWallet2'],
      $scope.ctrlTranslations['global.restart'],
      $scope.ctrlTranslations['settingsView.operations.restartWallet']
    )
  }

  function walletStatusTimerFunction(){
    // writeLog(helpData)
    stopWallet()
    checkWallet()
    if(helpData != null  && helpData != undefined)
    {
      if (helpData.result == null && helpData.errno != undefined)
      {
        //refresh wallet
        var arg = []
        electron.ipcRenderer.send('main-reload', arg)
      }
      else
      {
        setTimeout(walletStatusTimerFunction, 500)
      }
    }
    else
    {
      setTimeout(walletStatusTimerFunction, 500)
    }
  }


  function backupWalletTimerFunction(fileName){
    // writeLog(helpData)
    stopWallet()
    checkWallet()
    if(helpData != null  && helpData != undefined)
    {
      if (helpData.result == null && helpData.errno != undefined)
      {
        //refresh wallet
        var walletLocation = getUserHome(serverData, settings);
        if(fs.existsSync(walletLocation + '/wallet.dat'))
          {
            fsextra.copySync(walletLocation + '/wallet.dat', fileName);
            spawnMessage(
              MsgType.ALERT,
              $scope.ctrlTranslations['settingsView.operations.walletBackup'] + " " + fileName,
              $scope.ctrlTranslations['global.success2'] + "!!!"
            )
          }
          else
          {
            spawnMessage(
              MsgType.ALERT,
              $scope.ctrlTranslations['settingsView.operations.cannotBackupWallet'],
              $scope.ctrlTranslations['global.fail'] + "!!"
            )
          }
          setTimeout(reload, 3000)
          function reload(){
            var arg = []
            electron.ipcRenderer.send('main-reload', arg)
          }
      }
      else
      {
        setTimeout(backupWalletTimerFunction, 500, fileName)
      }
    }
    else
    {
      setTimeout(backupWalletTimerFunction, 500, fileName)
    }
  }

  function restoreWalletStatusTimerFunction(file){
    // writeLog(helpData)
    stopWallet()
    checkWallet()
    if(helpData != null  && helpData != undefined)
    {
      if (helpData.result == null && helpData.errno != undefined)
      {
        //refresh wallet
        var walletLocation = getUserHome(serverData, settings);
        if(fs.existsSync(walletLocation + '/wallet.dat'))
        {
          fsextra.move(walletLocation + '/wallet.dat', walletLocation  + '/wallet.dat.' + Math.round((new Date()).getTime() / 1000), function (err) {
            if (err) return console.error(err)
            moveWallet(file)
          })
        }
        else
        {
          moveWallet(file)
        }

        function moveWallet(dir)
        {
          fsextra.copySync(dir, walletLocation + '/wallet.dat');
          var arg = []
          electron.ipcRenderer.send('main-reload', arg)
        }
      }
      else
      {
        setTimeout(restoreWalletStatusTimerFunction, 500, file)
      }
    }
    else
    {
      setTimeout(restoreWalletStatusTimerFunction, 500, file)
    }
  }

  function populateAddress(data){
    var walletDic = data.from
    var keys = Object.keys(walletDic)
    $timeout(function(){
      $scope.privateAddresses = []
      keys.forEach(function(element){
        var temp = {}
        temp['text'] = element + " - " + walletDic[element].amount
        temp['value'] = element.split(' (')[0]
        if(element.startsWith('z'))
        {
          var index = $scope.privateAddresses.findIndex(function(e){return e.text.split(' - ')[0] === temp.text.split(' - ')[0]})
          if (index == -1) {
            $scope.privateAddresses.push(temp)
          }
          else
          {
            if($scope.privateAddresses[index].text.split(' - ')[1] != temp.text.split(' - ')[1])
            {
              $scope.privateAddresses[index].text = temp.text
            }
          }
        }
      })
      $scope.detail.btnEnabled = true
    },0)
  }

  $scope.getPeers = function(){
    getPeerInfo()
  }

  $scope.addPeers = function(){
    spawnMessage(MsgType.ADD_PEERS, '', '', $scope.ctrlTranslations['settingsView.operations.addPeers'])
  }

  $scope.backupClick = function(){
    var dialogOptions;

    {
        dialogOptions= {
            filters: [
                { name: '', extensions: ["dat"] },
            ],
            properties: ["openFile"]
        }
    }
    dialog.showSaveDialog(dialogOptions, function (fileName) {
      setTimeout(backupWalletTimerFunction, 500, fileName)
    })
  }

  $scope.restoreClick = function(){
    var dialogOptions;

    {
        dialogOptions= {
            filters: [
                { name: serverData.daemon, extensions: ["dat"] },
            ],
            properties: ["openFile"]
        }
    }

    dialog.showOpenDialog(dialogOptions, function (fileNames) {
        if(fileNames === undefined){
          writeLog("No file selected");
        }else{
          spawnMessage(
            MsgType.ALERT,
            $scope.ctrlTranslations['settingsView.operations.backingUpWallet']
          )
          setTimeout(restoreWalletStatusTimerFunction, 500, fileNames[0].replace(/\\/g, "/"))
        }
    })
  }

  $scope.rescanClick = function(){
    var walletHome = getWalletHome(true)
    fs.writeFileSync(walletHome + "/commands.txt", '-rescan')
    spawnMessage(
      MsgType.CONFIRMATION,
      $scope.ctrlTranslations['settingsView.operations.restartWallet3'],
      $scope.ctrlTranslations['global.restart'],
      $scope.ctrlTranslations['settingsView.operations.restartWallet']
    )
  }

  $scope.reindexClick = function(){
    var walletHome = getWalletHome(true)
    fs.writeFileSync(walletHome + "/commands.txt", '-reindex')
    spawnMessage(
      MsgType.CONFIRMATION,
      $scope.ctrlTranslations['settingsView.operations.restartWallet4'],
      $scope.ctrlTranslations['global.restart'],
      $scope.ctrlTranslations['settingsView.operations.restartWallet']
    )
  }

  $scope.encrypt = function () {
    spawnMessage(
      MsgType.ENCRYPT,
      "",
      $scope.ctrlTranslations['settingsView.encrypt'],
      $scope.ctrlTranslations['settingsView.encryptWlt']
    )
  }

  $scope.encryptWallet = function () {
    console.log("Encrypt wallet", $scope.detail.password)
    encryptWallet($scope.detail.password, serverData.cointype)
    $scope.detail.password = ""
  }

  $scope.addPeersAction = function(data){
    var file = getUserHome(serverData, settings) + "/" + serverData.conf_file
    fs.appendFileSync(file, data)
    spawnMessage(
      MsgType.CONFIRMATION,
      $scope.ctrlTranslations['settingsView.operations.restartWallet2'],
      $scope.ctrlTranslations['global.restart'],
      $scope.ctrlTranslations['settingsView.operations.restartWallet']
    )
  }

  $scope.debug = function(){
    spawnMessage(MsgType.DEBUG, '', '', '')
  }

  $scope.selectCoin = function(coin){
    var settings = readSettings(coin)
    if(settings.enablelog == undefined)
    {
      settings.enablelog = true
    }
    if(settings.showTransactionTime == undefined)
    {
      settings.showTransactionTime = false
    }
    if(coin != currentCoin)
    {
      $scope.privateAddressesTemp = $scope.privateAddresses
      $scope.privateAddresses = []
    }
    else
    {
      $scope.privateAddresses = $scope.privateAddressesTemp
    }
    populateSettings(settings)
    $scope.detail.currentCoin = coin
  }

  $scope.startDebugging = function(event){
    event.preventDefault()
    if (event.keyCode === 13) {
      $scope.detail.debugdata += $scope.detail.debugcommand + '\n'
      getDebug($scope.detail.debugcommand)
      debugList.push($scope.detail.debugcommand)
      $scope.detail.debugcommand = undefined
    }
  }

  $scope.dateChange = function(date){
    console.log(date)
  }

  $scope.changePhrase = function () {
    spawnMessage(
      MsgType.CHANGE_PASS,
      "",
      $scope.ctrlTranslations['settingsView.change'],
      $scope.ctrlTranslations['settingsView.changePassword']
    )
  }

  $scope.changePass = function (){
    changePass($scope.detail.oldPassword, $scope.detail.newPassword, serverData.cointype)
    $scope.detail.oldPassword = ""
    $scope.detail.newPassword = ""
  }

  electron.ipcRenderer.on('child-walletpassphrasechange', function(event, msgData) {
    $timeout(function(){
      var data = msgData.msg
      console.log("walletpassphrasechange data", data)
      if (data.error == null || data.error == undefined)
      {
        // show error message
        spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['global.success2'], $scope.ctrlTranslations['global.close'], $scope.ctrlTranslations['global.changePassword'])
      }
      else
      {
        var msg = data.error.message
        // show error message
        spawnMessage(MsgType.ALERT, msg)
      }
    },0)
  })

  electron.ipcRenderer.on('child-get-peer-info', function(event, msgData){
    var data = msgData.msg.result
    var peers = '\n'
    data.forEach(function(element){
      peers += "addnode=" + element.addr + '\n'
    })

    spawnMessage(MsgType.GET_PEERS, peers, '', $scope.ctrlTranslations['settingsView.operations.peersList'])
  })

  electron.ipcRenderer.on('child-encryptwallet', function(event, msgData) {
    $timeout(function(){
      var data = msgData.msg
      console.log("Encrypt data", data)
      if (data.error == null || data.error == undefined)
      {
        spawnMessage(
          MsgType.CONFIRMATION2,
          $scope.ctrlTranslations['settingsView.operations.restartWallet5'],
          $scope.ctrlTranslations['global.restart'],
          ""
        )
      }
      else
      {
        var msg = data.error.message
        // show error message
        spawnMessage(MsgType.ALERT, msg)
      }
    },0)
  })

  electron.ipcRenderer.on('child-update-settings', function(event, msgData){
    writeLog('populateSettings')
    $timeout(function(){
      if(msgData.msg[2] != null && msgData.msg[2] != undefined)
      {
        $scope.detail.currentCoin = currentCoin
        $scope.detail.shield = msgData.msg[2].shield
        $scope.detail.showencryption = msgData.msg[2].showencryption
      }
      if(settings != null && settings != undefined)
      {
        populateSettings(settings)
      }
    },0)
  })

  electron.ipcRenderer.on('child-get-debug', function(event, msgData){
    $timeout(function(){
      if(msgData.msg.result != null)
      {
        $scope.detail.debugdata += (typeof msgData.msg.result === 'string' ? msgData.msg.result : JSON.stringify(msgData.msg.result, null, 2)) + '\n\n'
      }
      else
      {
        $scope.detail.debugdata += msgData.msg.error.message + '\n\n'
      }
    },0)
  })

  electron.ipcRenderer.on('child-update-price', function(event, msgData) {
    $timeout(function(){
      $scope.detail.price = []
      var data = JSON.parse(msgData.msg)

      var indexUsd = data.findIndex(function(e){return e.code.toLowerCase() == 'usd'})
      var indexBtc = data.findIndex(function(e){return e.code.toLowerCase() == 'btc'})
      var indexEur = data.findIndex(function(e){return e.code.toLowerCase() == 'eur'})
      var indexRub = data.findIndex(function(e){return e.code.toLowerCase() == 'rub'})
      var indexGbp = data.findIndex(function(e){return e.code.toLowerCase() == 'gbp'})
      $scope.detail.price.push(data[indexUsd])
      $scope.detail.price.push(data[indexBtc])
      $scope.detail.price.push(data[indexEur])
      $scope.detail.price.push(data[indexRub])
      $scope.detail.price.push(data[indexGbp])
    },0)
  })

  electron.ipcRenderer.on('child-update-shield', function(event, msgData){
    var data = msgData.msg
    // writeLog(data)
    if($scope.detail.currentCoin == currentCoin)
    {
      populateAddress(data)
    }
  })

  var PositionTextAreaToBottom = function() {
      textArea.scrollTop = textArea.scrollHeight;
  }

  electron.ipcRenderer.on('child-update-settings', function(event, msgData){
    $timeout(function(){
      if(msgData.msg[2] != null && msgData.msg[2] != undefined)
      {
        $scope.detail.showTransactionTime = msgData.msg[2].cointype == "snowgem" ? true : false
      }
    },0)
  })
}])
