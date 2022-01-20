// Translations config
let setLanguage;
app.config(['$translateProvider', function ($translateProvider) {
  getTranslations.then(function() {
    // Translations are loaded successfully
    return new Promise((resolve) => {
      validTranslations.forEach((t, i) => {
        $translateProvider.translations(t, translations[t]);
        if(validTranslations.length === i+1) resolve();
      })
    })
  }).then(() => {
    $translateProvider.preferredLanguage(getLanguage());
    $translateProvider.fallbackLanguage(LanguageType.EN);
    setLanguage();
  })
}]);

app.run(['$translate', function($translate) {
  setLanguage = () => {
    $translate.use(getLanguage());
    console.log('Language is set');
  }
}]);

app.controller('MenuBarCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.ScreenType = {"LOADING":0, "OVERVIEW": 1, "SEND":2, "SHIELD":3, "ADDRESSES": 4, "TRANSACTIONS": 5, "MASTERNODES": 6, "MASTERNODES_CONFIG": 7, "APPS": 8, "EXCHANGES": 9, "SETTINGS": 10, 'MASTERNODES_MAP': 11, 'ADDRESSBOOK': 13, 'VOTING': 14}
  $scope.detail = {hideMasternode: true, hideCoinList: true, coins: {}, title: "", text: "", btn: "", hideShield: true}
  $scope.detail.activeMasternode = 'site-menu-item has-sub'
  $scope.detail.activeApps = 'site-menu-item has-sub'
  $scope.detail.activeExchanges = 'site-menu-item has-sub'
  $scope.detail.coinSelect = undefined

  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess', function(event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations();
  });

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'menubar.titleBtn',
        'menubar.text1',
        'menubar.text2'
      ]).then((o) => {
          $scope.ctrlTranslations = o;
        })
    })
  }

  $scope.getControllerTranslations();

  $scope.menubarClick = function(data, url, isCheck){
    if(isCheck == undefined)
    {
      isCheck = true
    }
    showTab(data, isCheck)
    $(window).scrollTop(0);

    if(data == $scope.ScreenType.MASTERNODES || data == $scope.ScreenType.MASTERNODES_CONFIG || data == $scope.ScreenType.MASTERNODES_MAP)
    {
      if($scope.detail.activeMasternode != 'site-menu-item has-sub active')
      {
        var tabcontent = document.getElementsByClassName("site-menu-item")
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].className = tabcontent[i].className.replace(" active", "");
            tabcontent[i].style.backgroundColor = "";
        }
        $scope.detail.activeMasternode =  'site-menu-item has-sub active'
      }
    }
    else
    {
      $scope.detail.activeMasternode =  'site-menu-item has-sub'
    }
    if(data == $scope.ScreenType.SNOWMINE)
    {
      if($scope.detail.activeApps != 'site-menu-item has-sub active')
      {
        var tabcontent = document.getElementsByClassName("site-menu-item")
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].className = tabcontent[i].className.replace(" active", "");
            tabcontent[i].style.backgroundColor = "";
        }
        $scope.detail.activeApps =  'site-menu-item has-sub active'
      }
    }
    else
    {
      $scope.detail.activeApps =  'site-menu-item has-sub'
    }
    if(data == $scope.ScreenType.EXCHANGES)
    {
      shell.openExternal(url)
    }
    else
    {
      $scope.detail.activeExchanges =  'site-menu-item has-sub'
    }

  }

  $scope.openExternal = function(url)
  {
    shell.openExternal(url)
  }

  $scope.coinSelect = function(coin)
  {
    $scope.detail.title = $scope.ctrlTranslations['menubar.titleBtn']
    $scope.detail.text = $scope.ctrlTranslations['menubar.text1'] + ' ' + coin + '? ' + $scope.ctrlTranslations['menubar.text2']
    $scope.detail.btn = $scope.ctrlTranslations['menubar.titleBtn']
    $scope.detail.coinSelect = coin
    $('#restartWalletMenubar').modal()
  }

  $scope.restartAction = function(){
    //check wallet status
    var currData = {}
    writeLog($scope.detail.coinSelect)
    currData["coinname"] = $scope.detail.coinSelect
    saveCurrentCoin($scope.detail.coinSelect)
    helpData = undefined
    setTimeout(walletStatusTimerFunction, 500)
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
        setTimeout(walletStatusTimerFunction, 2000)
      }
    }
    else
    {
      setTimeout(walletStatusTimerFunction, 500)
    }
  }

  electron.ipcRenderer.on('child-show-screen', function(event, msgData){
    var scrn = msgData.msg[0]
    var isCheck = msgData.msg[1]
    $scope.menubarClick(scrn, undefined, isCheck)
  })

  electron.ipcRenderer.on('child-update-settings', function(event, msgData){
    $timeout(function(){
      if(msgData.msg[2] != null && msgData.msg[2] != undefined)
      {
        $scope.detail.hideMasternode = !msgData.msg[2].masternode
        $scope.detail.hideShield = !msgData.msg[2].shield || false
        $scope.detail.currentCoin = currentCoin
      }
      if(coinList.coins != undefined && coinList.coins.length > 0)
      {
        $scope.detail.coins = coinList.coins
        $scope.detail.hideCoinList = false
      }
    },0)
  })
}])

app.controller('NavBarCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.detail = {}
  $scope.detail.progress = 0
  $scope.detail.hideBar = true
  $scope.detail.connections = 0
  $scope.detail.currentblock = ''
  $scope.detail.hideprice = true
  $scope.detail.banners = undefined
  $scope.detail.showNoti = false
  $scope.LanguageType = {"AE": "ae", "CN": "cn", "CZ": "cz", "DE": "de", "EN": "en", "ES": "es", "FR": "fr", "HU": "hu", "IT": "it", "KR": "kr", "NL": "nl", "PL": "pl", "RO": "ro", "RU": "ru", "TR": "tr"}

  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess',function(event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations();
  });

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'global.version',
        'navbar.unlocked',
        'navbar.locked',
        'navbar.autoLock',
        'navbar.currentBlock',
        'global.alert'
      ]).then((o) => {
          $scope.ctrlTranslations = o;
        })
    })
  }

  $scope.getControllerTranslations();

  $scope.refreshWallet = function(){
    stopWallet()
    setTimeout(walletStatusTimerFunction, 500)
  }

  $scope.openNotification = function(url){
    url ? shell.openExternal(url) : ""
  }

  function walletStatusTimerFunction(){
    // writeLog(helpData)

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
        setTimeout(walletStatusTimerFunction, 2000)
      }
    }
    else
    {
      setTimeout(walletStatusTimerFunction, 500)
    }
  }

  $scope.getFlag = function()
  {
    var current = $translate.use();
    if (current === LanguageType.EN) {
      current = 'us';
    }
    return 'flag-icon-' + current;
  }

  $scope.changeLanguage = function(lang)
  {
    console.log('Change language -->', lang);
    saveLanguage(lang)
    electron.ipcRenderer.send('main-change-language', lang)
    $translate.use(lang);
  }

  $scope.lockUnlock = function () {
    if (!$scope.detail.islocked)
    {
      $scope.detail.islocked = true
      $scope.detail.lockstate = $scope.ctrlTranslations['navbar.locked']
      // call lock rpc call
      lockWallet()
    }
    else
    {
      // call unlock modal
      electron.ipcRenderer.send('main-unlock-modal', [])
    }
  }

  $scope.aboutClick = function()
  {
    shell.openExternal('https://docs.tent.app/wallets/snowgem-modern-wallet/frequently-asked-questions')
    //alert($scope.ctrlTranslations['global.version'] + ': ' + appVersion)
  }

  electron.ipcRenderer.on('child-update-loading', function(event, msgData) {
    var data = msgData.msg
    var bestTime = data.besttime
    var currTime = Math.floor(Date.now() / 1000)
    var startTime = serverData.starttime == undefined ? 1511111234 : serverData.starttime
    $timeout(function(){
      $scope.detail.progress = parseInt(bestTime - startTime) / (currTime - startTime) * 100
      $scope.detail.width = $scope.detail.progress.toFixed(2) + '%'
      $scope.detail.synctitle = $scope.detail.width + " (" + timeConverter(bestTime) + ')'
      $scope.detail.connections = data.connections
      $scope.detail.currentblock = data.block == undefined ? "" : ", " + $scope.ctrlTranslations['navbar.currentBlock'] + ": " + data.block
      $scope.detail.lockstate = data.islocked ? $scope.ctrlTranslations['navbar.locked'] : $scope.ctrlTranslations['navbar.unlocked']
      $scope.detail.islocked = data.islocked
      $scope.detail.isencrypted = data.isencrypted
      
      if(currTime - bestTime < 1000)
      {
        $scope.detail.hideBar = true
        isSynced = true
      }
      else
      {
        $scope.detail.hideBar = false
        isSynced = false
      }
    },0)
  })

  electron.ipcRenderer.on('child-notification-data', function(event, msgData) {
    var data = msgData.msg
    data = data.banner
    if(data)
    {
      $timeout(function(){
        $scope.detail.notificationCounter = data.length
        $scope.detail.banners = data
        if($scope.detail.notificationCounter > 0)
        {
          $scope.detail.showNoti = true
        }
        else
        {
          $scope.detail.showNoti = false
        }
      },0)
    }
  })

  electron.ipcRenderer.on('child-update-price', function(event, msgData) {
    $timeout(function(){
      if($scope.detail.hideprice == true)
      {
        if(serverData != undefined && serverData.price_field == true)
        {
          $scope.detail.hideprice = false
        }
      }
      if(settings.currency == undefined)
      {
        settings.currency = 'USD'
        settings.symbol = '$'
      }
      try
      {
        var data = JSON.parse(msgData.msg)

        var indexTENT = data.findIndex(function(e){return e.code.toLowerCase() == 'tent'})
        var indexVDL = data.findIndex(function(e){return e.code.toLowerCase() == 'vdl'})
        var indexZEC = data.findIndex(function(e){return e.code.toLowerCase() == 'zec'})
        var indexZER = data.findIndex(function(e){return e.code.toLowerCase() == 'zer'})
        var indexCurrency = data.findIndex(function(e){return e.code.toLowerCase() == settings.currency.toLowerCase()})

        if(serverData != undefined && serverData.coinname == "TENT")
        {
          $scope.detail.pricechange = data[indexTENT].pricechange
          $scope.detail.price = data[indexTENT].price / data[indexCurrency].price
        }
        if(serverData != undefined && serverData.coinname == "Vidulum")
        {
          $scope.detail.pricechange = data[indexVDL].pricechange
          $scope.detail.price = data[indexVDL].price / data[indexCurrency].price
        }
        if(serverData != undefined && serverData.coinname == "Zero")
        {
          $scope.detail.pricechange = data[indexZER].pricechange
          $scope.detail.price = data[indexZER].price / data[indexCurrency].price
        }
        if(serverData != undefined && serverData.coinname == "Zcash")
        {
          $scope.detail.pricechange = data[indexZEC].pricechange
          $scope.detail.price = data[indexZEC].price / data[indexCurrency].price
        }

        if(settings.currency.toLowerCase() == 'btc'){
          $scope.detail.price = parseFloat($scope.detail.price.toFixed(8))
        }
        else{
          $scope.detail.price = parseFloat($scope.detail.price.toFixed(3))
        }
        PageTransitionEvent
        priceandsymbol = $scope.detail.priceandsymbol = settings.symbol + $scope.detail.price

        setTimeout(getPrice, 60000)
      }
      catch(ex)
      {
        setTimeout(getPrice, 60000)
      }
    },0)
  })

  electron.ipcRenderer.on('child-walletpassphrase', function(event, msgData) {
    $timeout(function(){
      var data = msgData.msg
      console.log("walletpassphrase data", data)
      if (data.error == null || data.error == undefined)
      {
        $scope.detail.islocked = false
        $scope.detail.lockstate = $scope.ctrlTranslations['navbar.unlocked']
        var count = 300;
        setInterval(function(){
            $scope.detail.lockstate = $scope.ctrlTranslations['navbar.unlocked'] + ", " + $scope.ctrlTranslations['navbar.autoLock'] + " " + (count--) + "s"
        }, 1000);
      }
      else
      {
        var msg = data.error.message
        // show error message
        spawnMessage(MsgType.ALERT, msg)
      }
    },0)
  })

  $scope.changeLanguage(getLanguage())
}])

app.controller('SiteGridMenuCtrl', ["$scope", "$http", "$timeout", function($scope, $http, $timeout) {
  $scope.ScreenType = {"LOADING":0, "OVERVIEW": 1, "SEND":2, "SHIELD":3, "ADDRESSES": 4, "TRANSACTIONS": 5, "MASTERNODES": 6, "MASTERNODES_CONFIG": 7, "APPS": 8, "EXCHANGES": 9, "SETTINGS": 10, 'MASTERNODES_MAP': 11, 'ADDRESSBOOK': 13, 'VOTING': 14}
  $scope.menubarClick = function(data){
    showTab(data, true)
  }
}])

app.controller('MenuBarFooterCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.ScreenType = {"LOADING":0, "OVERVIEW": 1, "SEND":2, "SHIELD":3, "ADDRESSES": 4, "TRANSACTIONS": 5, "MASTERNODES": 6, "MASTERNODES_CONFIG": 7, "APPS": 8, "EXCHANGES": 9, "SETTINGS": 10, 'MASTERNODES_MAP': 11, 'ADDRESSBOOK': 13, 'VOTING': 14}

  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess', function(event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations();
  });

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'global.version'
      ]).then((o) => {
          $scope.ctrlTranslations = o;
        })
    })
  }

  $scope.getControllerTranslations();


  $scope.menubarClick = function(data){
    if(settings == undefined || serverData == undefined || confData == undefined)
    {
      showTab(data, true)
    }
    else
    {
      showTab(data, false)
    }
  }

  $scope.aboutClick = function()
  {
    alert($scope.ctrlTranslations['global.version']+': ' + appVersion)
  }
}])

app.controller('BottomCtrl', ["$scope", "$http", "$timeout", function($scope, $http, $timeout) {
  $scope.detail = {}
  setInterval(function(){
    $timeout(function(){
      var currentdate = Date.now() / 1000;
      $scope.detail.currenttime = timeConverter(currentdate);
    },0)
  }, 250);
}])

app.controller('ModalCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.detail = {}

  $scope.LanguageType = {"AE": "ae", "CN": "cn", "CZ": "cz", "DE": "de", "EN": "en", "ES": "es", "FR": "fr", "HU": "hu", "IT": "it", "KR": "kr", "NL": "nl", "PL": "pl", "RO": "ro", "RU": "ru", "TR": "tr"}

  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess',function(event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations();
  });

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'global.alert'
      ]).then((o) => {
          $scope.ctrlTranslations = o;
        })
    })
  }

  function spawnMessage(type, text, title) {
    $timeout(function () {
      $scope.detail.title = title == undefined ? $scope.ctrlTranslations['global.alert'] + '!!!' : title
      $scope.detail.text = text
      if (type == MsgType.ALERT) {
        $('#modalNavbarAlert').modal()
      }
      else if (type == MsgType.UNLOCK) {
        $('#modalNavbarUnlock').modal()
      }
      else if (type == MsgType.CHANGE_PASS) {
        $('#modalNavbarChangePass').modal()
      }
    }, 0)
  }

  $scope.unlock = function (){
    unlockWallet($scope.detail.unlockPassword)
    $scope.detail.unlockPassword = ""
  }


  electron.ipcRenderer.on('child-walletlock', function(event, msgData) {
    $timeout(function(){
      var data = msgData.msg
      console.log("walletlock data", data)
    },0)
  })

  electron.ipcRenderer.on('child-unlock-modal', function (event, msgData) {
    spawnMessage(MsgType.UNLOCK, "", "Unlock wallet")
  })
}])


