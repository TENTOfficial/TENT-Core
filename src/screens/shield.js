app.controller('ShieldCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.publicAddresses = []
  $scope.privateAddresses = []
  $scope.shieldAddresses = []
  $scope.detail = {}
  $scope.detail.shieldAddress = undefined
  // $scope.shieldList = []
  $scope.detail.publicAddr = undefined
  $scope.detail.privateAddr = undefined
  $scope.detail.fee = 0.0001
  $scope.detail.remainingvalue = 0
  var isShieldAll = false
  var isAutoShield = false
  var isMultipleShield = false
  var continueShieldTimer = undefined
  $scope.detail.btnEnabled = true
  $scope.detail.bestTime = -1
  $scope.detail.lastBestTime = -1

  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess', function (event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations()
  })

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'global.alert',
        'global.confirmationTitle',
        'global.success2',
        'sendView.operations.selectSendAddress',
        'sendView.operations.putReceiverAddress',
        'sendView.operations.putTxFee',
        'sendView.operations.checkTxError',
        'shieldView.operations.walletNotSynced',
        'shieldView.operations.shieldAll',
        'shieldView.operations.noCoinToShield',
        'shieldView.operations.multipleShield',
        'shieldView.operations.shieldAllDone',
        'global.errors.NoCoinbaseFundsToShield'
      ]).then((o) => {
        $scope.ctrlTranslations = o
      })
    })
  }

  $scope.getControllerTranslations()

  function spawnMessage(type, text, title)
  {
    var arg = [ScreenType.SHIELD, true]
    electron.ipcRenderer.send('main-show-screen', arg)
    $timeout(function(){
      $scope.detail.title = title == undefined ? $scope.ctrlTranslations['global.alert'] + '!!!' : title
      $scope.detail.text = text
      if(type == MsgType.ALERT)
      {
        $('#modalShieldAlert').modal()
      }
      else if(type == MsgType.CONFIRMATION)
      {
        $('#shieldAllConfirmation').modal()
      }
    },0)
  }

  function populateAddress(data){
    var walletDic = data.from
    var keys = Object.keys(walletDic)
    $timeout(function(){
      $scope.publicAddresses = []
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
        else
        {
          var index = $scope.publicAddresses.findIndex(function(e){return e.text.split(' - ')[0] === temp.text.split(' - ')[0]})
          if (index == -1) {
            if(walletDic[element].amount > 0)
            {
              if(walletDic[element].ismine)
              {
                $scope.publicAddresses.push(temp)
              }
            }
          }
          else
          {
            if($scope.publicAddresses[index].text.split(' - ')[1] != temp.text.split(' - ')[1]
              && parseFloat(temp.text.split(' - ')[1]) > 0)
            {
              $scope.publicAddresses[index].text = temp.text
            }
            else if($scope.publicAddresses[index].text.split(' - ')[1] != temp.text.split(' - ')[1]
              && parseFloat(temp.text.split(' - ')[1]) == 0)
            {
              $scope.publicAddresses.splice(index, 1)
            }
          }
        }
      })
    },0)
  }

  function autoShield(threshold, addr)
  {
    writeLog("check auto shield, locked coin = " + $scope.detail.remainingvalue + ", threshold = " + threshold)
    if(!isShieldAll && isSynced && parseInt($scope.detail.remainingvalue) >= threshold)
    {
      $scope.detail.privateAddr = addr
      isAutoShield = true
      $scope.detail.btnEnabled = false
      isShieldAll = true
      exec_sendCoin('*', $scope.detail.privateAddr, 0, $scope.detail.fee, SendType.SHIELD)
    }
  }

  function multipleShield(addr)
  {
    if(!isShieldAll && isSynced)
    {
      $scope.detail.privateAddr = addr
      isMultipleShield = true
      $scope.detail.btnEnabled = false
      isShieldAll = false
      isAutoShield = false
      exec_sendCoin($scope.shieldAddresses[0], $scope.detail.privateAddr, 0, $scope.detail.fee, SendType.SHIELD)
    }
    else if(!isSynced)
    {
      spawnMessage(
        MsgType.ALERT,
        $scope.ctrlTranslations['shieldView.operations.walletNotSynced']
      )
    }
  }

  function continueShield(from, to, fee)
  {
    //if($scope.detail.lastBestTime != $scope.detail.bestTime)
    {
      clearInterval(continueShieldTimer)
      continueShieldTimer = undefined
      exec_sendCoin(from, to, 0, fee, SendType.SHIELD)
    }
    // else
    // {
    //   if(continueShieldTimer == undefined)
    //   {
    //     continueShieldTimer = setInterval(function(){
    //       continueShield(from, to, fee)
    //     },2000)
    //   }
    // }
  }
  $scope.selectPubAddress = function(addr){
    $scope.detail.publicAddr = addr
  }

  $scope.selectPrivAddress = function(addr){
    $scope.detail.privateAddr = addr
  }

  $scope.shieldClick = function(){
    isAutoShield = false
    if($scope.detail.publicAddr == undefined)
    {
      writeLog("send address = null")
      spawnMessage(
        MsgType.ALERT,
        $scope.ctrlTranslations['sendView.operations.selectSendAddress']
      )
      return undefined
    }

    if($scope.detail.privateAddr == undefined || $scope.detail.privateAddr == '')
    {
      writeLog("recipient address = null")
      spawnMessage(
        MsgType.ALERT,
        $scope.ctrlTranslations['sendView.operations.putReceiverAddress']
      )
      return undefined
    }

    if($scope.detail.fee == undefined || $scope.detail.fee == '')
    {
      writeLog("fee = null")
      spawnMessage(
        MsgType.ALERT,
        $scope.ctrlTranslations['sendView.operations.putTxFee']
      )
      return undefined
    }

    $scope.detail.btnEnabled = false
    isShieldAll = false
    exec_sendCoin($scope.detail.publicAddr, $scope.detail.privateAddr, 0, String($scope.detail.fee).replace(',','.'), SendType.SHIELD)
  }

  $scope.shieldAllClick = function()
  {
    isAutoShield = false
    if($scope.detail.privateAddr == undefined || $scope.detail.privateAddr == '')
    {
      writeLog("recipient address = null")
      spawnMessage(
        MsgType.ALERT,
        $scope.ctrlTranslations['sendView.operations.putReceiverAddress']
      )
      return undefined
    }

    if($scope.detail.fee == undefined || $scope.detail.fee == '')
    {
      writeLog("fee = null")
      spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['sendView.operations.putTxFee'])
      return undefined
    }

    spawnMessage(MsgType.CONFIRMATION, $scope.ctrlTranslations['shieldView.operations.shieldAll'] + ' ' + $scope.detail.privateAddr, $scope.ctrlTranslations['global.confirmationTitle'])
  }

  $scope.shieldAllAction = function(){
    if($scope.publicAddresses.length > 0)
    {
      $scope.detail.btnEnabled = false
      isShieldAll = true
      exec_sendCoin('*', $scope.detail.privateAddr, 0, String($scope.detail.fee).replace(',','.'), SendType.SHIELD)
    }
    else
    {
      spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['shieldView.operations.noCoinToShield'])
    }
  }

  $scope.faq = function(){
    shell.openExternal('https://docs.tent.app/wallets/snowgem-modern-wallet/frequently-asked-questions')
  }

  electron.ipcRenderer.on('child-update-shield', function(event, msgData){
    var data = msgData.msg
    // writeLog(data)
    populateAddress(data)
  })

  electron.ipcRenderer.on('child-shield-coin', function(event, msgData){
    var data = msgData.msg.value
    // writeLog(data)
    $timeout(function(){
      if(data.result == null)
      {
        if(!isShieldAll)
        {
          if(!isMultipleShield)
          {
            error_msg = data.error.message
            writeLog(error_msg)
            switch (true) {
              case error_msg.includes("Could not find any coinbase funds to shield."):
                msg = $scope.ctrlTranslations['global.errors.NoCoinbaseFundsToShield']
                break;
              default:
                msg = error_msg
            }
            spawnMessage(MsgType.ALERT, msg)
            $scope.detail.btnEnabled = true
          }
          else
          {
            if(data.error.code == -6 && $scope.shieldAddresses.length > 0)
            {
              $scope.shieldAddresses.splice(0, 1)
              if($scope.shieldAddresses.length == 0)
              {
                $scope.detail.btnEnabled = true
                shouldGetAll = true
                var msg = $scope.ctrlTranslations['shieldView.operations.multipleShield']
                spawnMessage(MsgType.ALERT, msg, "")
              }
              else
              {
                exec_sendCoin($scope.shieldAddresses[0], $scope.detail.privateAddr, 0, $scope.detail.fee, SendType.SHIELD)
              }
            }
          }
        }
        else
        {
          if(data.error.code == -6 || $scope.detail.remainingvalue < 8)
          {
            $scope.detail.btnEnabled = true
            shouldGetAll = true
            isShieldAll = false
            if(!isAutoShield)
            {
              var msg = $scope.ctrlTranslations['shieldView.operations.shieldAllDone']
              spawnMessage(MsgType.ALERT, msg, "")
            }
            else
            {
              var msg = $scope.ctrlTranslations['shieldView.operations.shieldAllDone']
              sendBotReplyMsg(msg)
              writeLog("Auto shield is done")
            }
          }
          else
          {
            console.log(data)
          }
        }
      }
      else
      {
        checkTransaction(data.result.opid, SendType.SHIELD)
      }
    },0)
  })

  electron.ipcRenderer.on('child-check-transaction-shield', function(event, msgData){
    writeLog(msgData.msg)
    var data = msgData.msg
    $timeout(function(){
      if(data.result == null)
      {
        if(!isShieldAll && !isMultipleShield)
        {
          $scope.detail.btnEnabled = true
          if(!isAutoShield)
          {
            spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['sendView.operations.checkTxError'])
          }
          else
          {
            var msg = $scope.ctrlTranslations['sendView.operations.checkTxError']
            sendBotReplyMsg(msg)
            writeLog(msg)
          }
        }
      }
      else
      {
        //send done, check status
        var element = data.result[0]
        var status = element.status
        writeLog(status)
        if(status == "executing")
        {
          setTimeout(function(){
            checkTransaction(element.id, SendType.SHIELD)
            //update sending process
          }, 2000);
        }
        else if(status == "success")
        {
          if(isShieldAll)
          {
            if($scope.detail.remainingvalue < 8)
            {
              $scope.detail.btnEnabled = true
              shouldGetAll = true
              isShieldAll = false
              if(!isAutoShield)
              {
                var msg = $scope.ctrlTranslations['shieldView.operations.shieldAllDone']
                spawnMessage(MsgType.ALERT, msg, "")
              }
              else
              {
                var msg = $scope.ctrlTranslations['shieldView.operations.shieldAllDone']
                sendBotReplyMsg(msg)
                writeLog("Auto shield is done")
              }
            }
            else
            {
              $scope.detail.lastBestTime = $scope.detail.bestTime
              continueShield('*', $scope.detail.privateAddr, String($scope.detail.fee).replace(',','.'))
            }
          }
          else
          {
            if(isMultipleShield)
            {
              if($scope.shieldAddresses.length > 0)
              {
                $scope.shieldAddresses.splice(0, 1)
                if($scope.shieldAddresses.length == 0)
                {
                  $scope.detail.btnEnabled = true
                  shouldGetAll = true
                  spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['shieldView.operations.multipleShield'], "")
                }
                else
                {
                  $scope.detail.lastBestTime = $scope.detail.bestTime
                  continueShield($scope.shieldAddresses[0], $scope.detail.privateAddr, String($scope.detail.fee).replace(',','.'))
                }
              }
            }
            else
            {
              $scope.detail.btnEnabled = true
              shouldGetAll = true
              spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['global.success2'], "")
            }
          }
          shouldGetAll = true
        }
        else
        {
          if(isShieldAll)
          {
            $scope.detail.lastBestTime = $scope.detail.bestTime
            continueShield('*', $scope.detail.privateAddr, String($scope.detail.fee).replace(',','.'))
          }
          else
          {
            $scope.detail.btnEnabled = true
            spawnMessage(MsgType.ALERT, element)
          }
        }
      }
    },0)
  })

  electron.ipcRenderer.on('child-execute-shield-all', function(event, msgData){
    writeLog(msgData.msg)
    if(msgData.msg.isBot == true)
    {
      $timeout(function(){
        autoShield(msgData.msg.shieldthreshold, msgData.msg.shieldaddress)
        //update sending process
      }, 0)
    }
    else
    {
      setInterval(function(){
        autoShield(msgData.msg.shieldthreshold, msgData.msg.shieldaddress)
        //update sending process
      }, 60000)
    }
  })

  electron.ipcRenderer.on('child-execute-multiple-shield', function(event, msgData){
    writeLog(msgData.msg)
    $scope.shieldAddresses = msgData.msg.shieldAddress
    multipleShield(msgData.msg.privateAddr)
      //update sending process
  })

  electron.ipcRenderer.on('child-update-locked-coin', function(event, msgData){
    $timeout(function(){
      $scope.detail.remainingvalue = msgData.msg
    })
  })

  electron.ipcRenderer.on('child-update-loading', function(event, msgData) {
    var data = msgData.msg
    $timeout(function(){
      $scope.detail.bestTime = data.besttime == undefined ? -1 : data.besttime
    },0)
  })
}])
