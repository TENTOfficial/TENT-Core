app.controller('OverviewCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.balances = {
    totalCoins: -1,
    transparentCoins: -1,
    privateCoins: -1,
    unconfirmedCoins: -1,
    lockedCoins: -1,
    immatureCoins: -1
  }
  var count = 0
  isInit = true
  $scope.bestHeight = undefined
  $scope.visible = false
  $scope.startingText = 'Good morning!'
  $scope.detail = {}
  $scope.detail.sticker = "XSG"
  $scope.detail.transactionschart = false
  $scope.detail.transactionTime = 1
  $scope.rawData = {}
  $scope.walletData = {}
  $scope.dataChange = {}
  $scope.detail.banner = {}
  $scope.detail.chartText = ""
  var addressList
  var chart = undefined
  var donut = undefined
  $scope.detail.price = undefined
  $scope.detail.symbol = undefined
  $scope.detail.showFiat = false
  var oldBalance = 0

  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess', function (event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations()
  })

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'global.alert',
        'dashboardView.table.incoming',
        'dashboardView.table.outgoing',
        'dashboardView.operations.goodMorning',
        'dashboardView.operations.goodAfternoon',
        'dashboardView.operations.goodEvening',
        'dashboardView.operations.txsLast24Hours',
        'dashboardView.operations.txsLast7Days',
        'dashboardView.operations.txsLastMonth',
        'dashboardView.operations.txsLastQuarter',
        'dashboardView.operations.txsLastYear'
      ]).then((o) => {
        $scope.startingText = o['dashboardView.operations.goodMorning']
        $scope.ctrlTranslations = o
      })
    })
  }

  $scope.getControllerTranslations()

  updateText()
  setInterval(updateText, 60000)

  function spawnMessage(type, text, title)
  {
    $scope.detail.title = title == undefined ? $scope.ctrlTranslations['global.alert'] + '!!!' : title
    $scope.detail.text = text
    if(type == MsgType.ALERT)
    {
      $('#modalOverviewAlert').modal()
    }
  }

  function updateText () {
    var d = new Date();
    var n = parseInt(d.getHours());
    if (n >= 0 && n < 12)
    {
      $scope.startingText = $scope.ctrlTranslations['dashboardView.operations.goodMorning']
    }
    else if (n >= 12 && n < 18)
    {
      $scope.startingText = $scope.ctrlTranslations['dashboardView.operations.goodAfternoon']
    }
    else
    {
      $scope.startingText = $scope.ctrlTranslations['dashboardView.operations.goodEvening']
    }
  }
  function getDataTimerFunction(){
    writeLog('get wallet data')
    getNetworkHeight()

    if(apiStatus == undefined || apiStatus['getalldata'] == undefined || apiStatus['getalldata'] == false)
    {
      if(getinfoData != undefined)
      {
        if (count == 15)
        {
            shouldGetWallet = true; // should get wallet at least 1 time per 120 sec
        }

        var height = getinfoData.result.blocks
        if(shouldGetAll == true || $scope.bestHeight + 1 <= height)
        {
          if($scope.detail.transactionschart)
          {
            getAllData(GetAllDataType.ALL, parseInt($scope.detail.transactionTime))
          }
          else
          {
            getAllData(GetAllDataType.ALL)
          }
          shouldGetAll = false
          shouldGetWallet = false
          shouldGetTransaction = false
        }
        else if(shouldGetTransaction)
        {
          if($scope.detail.transactionschart)
          {
            getAllData(GetAllDataType.WITH_TRANSACTIONS, parseInt($scope.detail.transactionTime))
          }
          else
          {
            getAllData(GetAllDataType.WITH_TRANSACTIONS)
          }
        }
        else if(shouldGetWallet == true)
        {
          getAllData(GetAllDataType.WITH_BALANCE)
          shouldGetWallet = false
          count = 0
        }
        else
        {
          getAllData(GetAllDataType.NONE)
        }
        $scope.bestHeight = height
        writeLog('$scope.bestHeight = ' + $scope.bestHeight + ', height = ' + height)
      }
      else
      {
        if($scope.detail.transactionschart)
        {
          getAllData(GetAllDataType.ALL, parseInt($scope.detail.transactionTime))
        }
        else
        {
          getAllData(GetAllDataType.ALL)
        }
      }
      count += 1
    }
  }

  function getDataTimerFunctionZcash(){
    writeLog('get wallet data')
    $scope.dataChange.getinfo = undefined
    $scope.dataChange.getwalletinfo = undefined
    $scope.dataChange.z_gettotalbalance = undefined
    getNetworkHeight(serverData.cointype)
    getWalletInfo(serverData.cointype)
    zGetTotalBalance(serverData.cointype)
  }

  function getWalletData(){
    if(apiStatus['getwalletdata'] == undefined || apiStatus['getwalletdata'] == false)
    {
      apiStatus['getwalletdata'] = true
      getBestBlockhash(serverData.cointype)
    }
  }

  function updateTransactionsTime(arg)
  {
    var data = arg.data
    var days = 1
    $timeout(function(){
      $scope.detail.chartText = $scope.ctrlTranslations['dashboardView.operations.txsLast24Hours']
      if(arg.time == 2)
      {
        days = 7
        $scope.detail.chartText = $scope.ctrlTranslations['dashboardView.operations.txsLast7Days']
      }
      else if(arg.time == 3)
      {
        days = 30
        $scope.detail.chartText = $scope.ctrlTranslations['dashboardView.operations.txsLastMonth']
      }
      else if(arg.time == 4)
      {
        days = 90
        $scope.detail.chartText = $scope.ctrlTranslations['dashboardView.operations.txsLastQuarter']
      }
      else if(arg.time == 5)
      {
        days = 365
        $scope.detail.chartText = $scope.ctrlTranslations['dashboardView.operations.txsLastYear']
      }
      if(data != undefined && $scope.detail.transactionschart)
      {
        $scope.detail.dataChart = []
        var endTime = Math.round((new Date()).getTime() / 1000)
        var startTime = endTime - days * 24 * 60 * 60
        startTime = (parseInt(startTime / 3600 / days) + 1) * 3600 * days
        endTime = (parseInt(endTime / 3600 / days) + 1) * 3600 * days

        for (i = startTime; i < endTime; i += 3600 * days) {
          var temp = {}
          temp['time'] = i * 1000
          temp['in'] = 0
          temp['out'] = 0
          $scope.detail.dataChart.push(temp)
        }

        $scope.detail.dataChart['totalIn'] = 0
        $scope.detail.dataChart['totalOut'] = 0

        data.forEach(function(element){
          var time = parseInt(element.time / 3600 / days) * 3600 * days
          var index = $scope.detail.dataChart.findIndex(function(e){return e.time == time * 1000})
          if(index > -1)
          {
            if(element.amount > 0)
            {
              $scope.detail.dataChart[index].in += element.amount
              $scope.detail.dataChart[index].in = parseFloat($scope.detail.dataChart[index].in.toFixed(8))
              $scope.detail.dataChart['totalIn'] += element.amount
            }
            else
            {
              $scope.detail.dataChart[index].out += Math.abs(element.amount)
              $scope.detail.dataChart[index].out = parseFloat($scope.detail.dataChart[index].out.toFixed(8))
              $scope.detail.dataChart['totalOut'] += element.amount
            }
          }
        })

        $scope.detail.dataChart['totalIn'] = parseFloat($scope.detail.dataChart['totalIn'].toFixed(8))
        $scope.detail.dataChart['totalOut'] = parseFloat($scope.detail.dataChart['totalOut'].toFixed(8))

        if(chart == undefined)
        {
          chart = Morris.Area({
            element: 'chartLines',
            data: [],
            xkey: 'time',
            ykeys: ['in', 'out'],
            labels: ['vIn', 'vOut'],
            resize: true,
            pointSize: 3,
            smooth: false,
            fillOpacity: 1,
            gridTextColor: '#474e54',
            gridLineColor: '#eef0f2',
            goalLineColors: '#e3e6ea',
            gridTextFamily: "Roboto",
            gridTextWeight: '300',
            numLines: 9,
            gridtextSize: 14,
            lineWidth: 1,
            lineColors: [Config.colors("green", 500), Config.colors("red", 500)]
          })
        }
        chart.setData($scope.detail.dataChart)

        if(donut == undefined)
        {
          donut = Morris.Donut({
            element: 'chartDonut',
            data: [{
              label: $scope.ctrlTranslations['dashboardView.table.incoming'],
              value: $scope.detail.dataChart.totalIn
            }, {
              label: $scope.ctrlTranslations['dashboardView.table.outgoing'],
              value: Math.abs($scope.detail.dataChart.totalOut)
            }],
            // barSizeRatio: 0.35,
            resize: true,
            colors: [Config.colors("green", 500), Config.colors("red", 500)]
          })
        }

        var donutData = [
          {label: $scope.ctrlTranslations['dashboardView.table.incoming'], value: $scope.detail.dataChart.totalIn },
          {label: $scope.ctrlTranslations['dashboardView.table.outgoing'], value: Math.abs($scope.detail.dataChart.totalOut) }
        ]
        donut.setData(donutData)
        donut.select(0);
      }
    },0)
  }

  electron.ipcRenderer.on('child-execute-timer', function(event, msgData){
    writeLog('execute screen summary timer')
    if(msgData.msg[1].cointype == 'snowgem')
    {
      setTimeout(getDataTimerFunction, 3000)
    }
    else if(msgData.msg[1].cointype == 'zcash')
    {
      setTimeout(getDataTimerFunctionZcash, 3000)
    }
  })

  electron.ipcRenderer.on('child-summary-data', function(event, msgData){
    var data = msgData.msg
    // writeLog(data.value)
    if(data.key == 'getalldata')
    {
      if(data.value.result == null && !isRestarting)
      {
        spawnMessage(MsgType.ALERT, data.value.error.message)
      }
      else if(!isRestarting)
      {
        allData = data.value.result
        var allData
        var arg
        var walletDic
        if(allData != undefined)
        {
          allData = allData
          arg = data.arg

          if(arg[1] == GetAllDataType.WITH_TRANSACTIONS)
          {
            listtransactions = allData.listtransactions

            listtransactions.reverse()

            var data = {}
            data['data'] = listtransactions
            data['time'] = $scope.detail.transactionTime
            electron.ipcRenderer.send('main-update-transactions', data)
          }
          else if(arg[1] == GetAllDataType.WITH_BALANCE)
          {
            walletDic = allData.addressbalance[0]

            walletDic = updateWalletDic(walletDic)

            // writeLog(JSON.stringify(walletDic))

            var addr = {}
            addr['from'] = walletDic
            addr['book'] = readAddressBook(true, serverData, currentCoin)

            //@TODO populate addresses
            electron.ipcRenderer.send('main-update-address', addr)

            //@TODO populate send
            electron.ipcRenderer.send('main-update-send', addr)

            //@TODO update send coin from, shield coin from
            electron.ipcRenderer.send('main-update-shield', addr)
          }
          else if(arg[1] == GetAllDataType.ALL)
          {
            listtransactions = allData.listtransactions

            listtransactions.reverse()

            walletDic = allData.addressbalance[0]

            walletDic = updateWalletDic(walletDic)

            // writeLog(JSON.stringify(walletDic))

            var addr = {}
            addr['from'] = walletDic
            addr['book'] = readAddressBook(true, serverData, currentCoin)

            //@TODO populate addresses
            electron.ipcRenderer.send('main-update-address', addr)

            //@TODO populate send
            electron.ipcRenderer.send('main-update-send', addr)

            //@TODO update send coin from, shield coin from
            electron.ipcRenderer.send('main-update-shield', addr)

            var data = {}
            data['data'] = listtransactions
            data['time'] = $scope.detail.transactionTime
            electron.ipcRenderer.send('main-update-transactions', data)
          }

          //@TODO update best block hash

          //@TODO update best block time
          var bestTime = allData.besttime

          var connections = allData.connectionCount
          var block = allData.blocks
          var loadingData = {}
          loadingData['besttime'] = bestTime
          loadingData['connections'] = connections
          loadingData['block'] = block
          loadingData['isencrypted'] = allData.isencrypted
          loadingData['islocked'] = allData.islocked
          electron.ipcRenderer.send('main-update-loading', loadingData)

          //@TODO update sync bar

          //@TODO update connection

          //@TODO update all balances
          $timeout(function(){
            $scope.balances.totalCoins = allData.totalbalance
            $scope.balances.remainingvalue = allData.remainingValue
            $scope.balances.transparentCoins = allData.transparentbalance
            $scope.balances.privateCoins = allData.privatebalance
            $scope.balances.unconfirmedCoins = allData.unconfirmedbalance
            $scope.balances.lockedCoins = allData.lockedbalance
            $scope.balances.immatureCoins = allData.immaturebalance
            if($scope.detail.price)
            {
              $scope.balances.totalFiat = (allData.totalbalance * $scope.detail.price).toFixed(2)
              $scope.balances.transparentFiat = (allData.transparentbalance * $scope.detail.price).toFixed(2)
              $scope.balances.privateFiat = (allData.privatebalance * $scope.detail.price).toFixed(2)
              $scope.balances.unconfirmedFiat = (allData.unconfirmedbalance * $scope.detail.price).toFixed(2)
              $scope.balances.lockedFiat = (allData.lockedbalance * $scope.detail.price).toFixed(2)
              $scope.balances.immatureFiat = (allData.immaturebalance * $scope.detail.price).toFixed(2)
            }
            balance = $scope.balances
            if(lastBalance == undefined || lastBalance.totalCoins != $scope.balances.totalCoins || lastBalance.transparentCoins != $scope.balances.transparentCoins ||
              lastBalance.privateCoins != $scope.balances.privateCoins || lastBalance.unconfirmedCoins != $scope.balances.unconfirmedCoins ||
              lastBalance.lockedCoins != $scope.balances.lockedCoins || lastBalance.immatureCoins != $scope.balances.immatureCoins)
            {
              lastBalance = $scope.balances
              //get all data again if balance change
              if(arg[1] != GetAllDataType.ALL)
              {
                shouldGetAll = true
              }
            }
            electron.ipcRenderer.send('main-update-locked-coin', allData.remainingValue)
            electron.ipcRenderer.send('main-transparent-balance', allData.transparentbalance)
          }, 0);


          if(isInit)
          {
            var arg = [ScreenType.OVERVIEW, true]
            $timeout(function(){
              ipc.send('main-close-splashscreen', null)
            }, 1500)
            electron.ipcRenderer.send('main-show-screen', arg)
            isInit = false
          }
          //show overview screen
        }
        apiStatus['getalldata'] = false
        setTimeout(getDataTimerFunction, 10000)
      }
    }
  })

  electron.ipcRenderer.on('child-update-price', function(event, msgData) {
    $timeout(function(){
      if($scope.detail.hideprice == true)
      {
        if(serverData != undefined && (serverData.coinname == "TENT" || serverData.coinname == "Vidulum"))
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

        var indexCoin = data.findIndex(function(e){return e.code.toLowerCase() == serverData.sticker.toLowerCase()})
        var indexUsd = data.findIndex(function(e){return e.code.toLowerCase() == 'usd'})
        var indexCurrency = data.findIndex(function(e){return e.code.toLowerCase() == settings.currency.toLowerCase()})

        $scope.detail.price = data[indexCoin].price * data[indexCurrency].rate / data[indexUsd].rate
        $scope.detail.fiatSymbol = settings.symbol
        $scope.detail.showFiat = settings.showfiatbalance && indexCoin > -1 ? settings.showfiatbalance : true
      }
      catch(ex)
      {
        //do nothing
      }
    },0)
  })
  function processRawData(rawData, shouldGetWallet, shouldGetTransaction)
  {
    writeLog('processRawData')

    $scope.balances.totalCoins = rawData.totalbalance
    $scope.balances.transparentCoins = rawData.transparentbalance
    $scope.balances.remainingvalue = rawData.remainingValue == undefined ? 0 : rawData.remainingValue
    $scope.balances.privateCoins = rawData.privatebalance == undefined ? 0 : rawData.privatebalance
    $scope.balances.unconfirmedCoins = rawData.unconfirmedbalance
    $scope.balances.lockedCoins = rawData.lockedbalance == undefined ? 0 : rawData.lockedbalance
    $scope.balances.immatureCoins = rawData.immaturebalance
    balance = $scope.balances
    var loadingData = {}
    loadingData['besttime'] = rawData.besttime
    loadingData['connections'] = rawData.connectionCount
    loadingData['block'] = rawData.blocks
    electron.ipcRenderer.send('main-update-loading', loadingData)
    electron.ipcRenderer.send('main-update-locked-coin', rawData.remainingValue)
    electron.ipcRenderer.send('main-transparent-balance', rawData.transparentbalance)
    // if(shouldGetWallet)
    {
      var addressData = updateWalletDic(rawData.addressbalance)

      var addr = {}
      addr['from'] = addressData
      addr['book'] = readAddressBook(true, serverData, currentCoin)

      //@TODO populate addresses
      electron.ipcRenderer.send('main-update-address', addr)

      //@TODO populate send
      electron.ipcRenderer.send('main-update-send', addr)

      //@TODO update send coin from, shield coin from
      electron.ipcRenderer.send('main-update-shield', addr)
    }

    // if(shouldGetTransaction)
    {
      listtransactions = rawData.listtransactions

      listtransactions.reverse()

      var data = {}
      data['data'] = listtransactions
      data['time'] = 1 //only 1 day for other coins
      electron.ipcRenderer.send('main-update-transactions', data)
    }

    if(isInit)
    {
      var arg = [ScreenType.OVERVIEW, true]
      $timeout(function(){
        ipc.send('main-close-splashscreen', null)
      }, 1500)
      electron.ipcRenderer.send('main-show-screen', arg)
      isInit = false
    }
    apiStatus['getwalletdata'] = false
    shouldGetAll = false
    setTimeout(getDataTimerFunctionZcash, 10000)
  }

  function processAddress(addressData)
  {
    writeLog(addressData)
    addressList = Object.keys(addressData)
    $scope.rawData.addressbalance = addressData
    verifyAllAddress()
    // apiStatus['addressbalance'] = false
    // var temp = apiStatus['bestblock'] | apiStatus['addressbalance'] | apiStatus['listtransactions']
    // if(temp == false)
    // {
    //   processRawData($scope.rawData, shouldGetWallet, shouldGetTransaction)
    // }
  }

  function verifyAllAddress()
  {
    if(addressList.length > 0)
    {
      verifyAddress(addressList[0], undefined, serverData.cointype)
      addressList.splice(0,1)
    }
    else
    {
      addressList = Object.keys($scope.rawData.addressbalance)
      getBalaceAllAddress()
    }
  }

  function getBalaceAllAddress()
  {
    if(addressList.length > 0)
    {
      getAddressBalance(addressList[0], serverData.cointype)
      addressList.splice(0,1)
    }
    else
    {
      processRawData($scope.rawData, shouldGetWallet, shouldGetTransaction)
    }
  }

  $scope.closeOverviewBanner = function(url) {
    $scope.detail.showBanner = false
    url ? shell.openExternal(url) : ""
  }

  electron.ipcRenderer.on('child-update-settings', function(event, msgData){
    $timeout(function(){
      if(msgData.msg[2] != null && msgData.msg[2] != undefined)
      {
        $scope.detail.sticker = msgData.msg[2].sticker
        $scope.detail.coin = msgData.msg[2].coinname
        $scope.detail.transactionschart = msgData.msg[0].transactionschart == undefined ? true : msgData.msg[0].transactionschart
        $scope.detail.hideLockedCard = !(msgData.msg[2].lockedcoin == undefined ? false : msgData.msg[2].lockedcoin)
      }
      if(msgData.msg[0] != null && msgData.msg[0] != undefined)
      {
        $scope.detail.transactionTime = msgData.msg[0].transactionstime == undefined ? 1 : msgData.msg[0].transactionstime
      }

    }, 0)
  })

  electron.ipcRenderer.on('child-update-transactions-time', function(event, msgData){
    updateTransactionsTime(msgData.msg)
  })

  electron.ipcRenderer.on('child-update-chart', function(event, msgData){
    $timeout(function(){
      if(chart != undefined)
      {
        chart.setData($scope.detail.dataChart)

        var donutData = [
          {label: $scope.ctrlTranslations['dashboardView.table.incoming'], value: $scope.detail.dataChart.totalIn },
          {label: $scope.ctrlTranslations['dashboardView.table.outgoing'], value: Math.abs($scope.detail.dataChart.totalOut) }
        ]
        donut.setData(donutData)
        donut.select(0);
      }
    }, 0)
  })

  electron.ipcRenderer.on('child-get-data-zcash', function(event, msgData){
    // writeLog('child-get-data-zcash')
    $timeout(function(){
      var data = msgData.msg
      console.log(data)
      if(data.key == 'getinfo')
      {
        if(lastBlock != data.value.result.blocks)
        {
          lastBlock = data.value.result.blocks
          $scope.rawData.connectionCount = data.value.result.connections
          $scope.dataChange.getinfo = true
        }
        else
        {
          $scope.dataChange.getinfo = false
        }
      }
      else if(data.key == 'getwalletinfo')
      {
        if(lastBalance == undefined || lastBalance.balance != data.value.result.balance ||
          lastBalance.unconfirmed_balance != data.value.result.unconfirmed_balance || lastBalance.immature_balance != data.value.result.immature_balance)
        {
          lastBalance = data.value.result
          $scope.rawData.unconfirmedbalance = data.value.result.unconfirmed_balance
          $scope.rawData.immaturebalance = data.value.result.immature_balance
          $scope.dataChange.getwalletinfo = true
        }
        else
        {
          $scope.dataChange.getwalletinfo = false
        }
      }
      else if(data.key == 'z_gettotalbalance')
      {
        if(lastTotalBalance == undefined || lastTotalBalance.transparent != data.value.result.transparent ||
          lastTotalBalance.private != data.value.result.private)
        {
          lastTotalBalance = data.value.result
          $scope.rawData.totalbalance = data.value.result.total
          $scope.rawData.privatebalance = data.value.result.private
          $scope.rawData.transparentbalance = data.value.result.transparent
          $scope.dataChange.z_gettotalbalance = true
        }
        else
        {
          $scope.dataChange.z_gettotalbalance = false
        }
      }
      if((($scope.dataChange.z_gettotalbalance != undefined && $scope.dataChange.getwalletinfo != undefined && $scope.dataChange.getinfo != undefined) &&
        ($scope.dataChange.z_gettotalbalance || $scope.dataChange.getwalletinfo || $scope.dataChange.getinfo)) || shouldGetAll)
      {
        $scope.dataChange.getinfo = undefined
        $scope.dataChange.getwalletinfo = undefined
        $scope.dataChange.z_gettotalbalance = undefined
        getWalletData()
      }
      else if($scope.dataChange.z_gettotalbalance == false && $scope.dataChange.getwalletinfo == false && $scope.dataChange.getinfo == false)
      {
        writeLog("set time out 2")
        setTimeout(getDataTimerFunctionZcash, 10000)
      }
    }, 0)
  })

  electron.ipcRenderer.on('child-get-blockchain-info-zcash', function(event, msgData){
    writeLog('child-get-blockchain-info-zcash')
    $timeout(function(){
      $scope.rawData.bestblockhash = msgData.msg.value.result.bestblockhash
      getBestTime($scope.rawData.bestblockhash, serverData.cointype)
    }, 0)
  })

  electron.ipcRenderer.on('child-get-block-header-zcash', function(event, msgData){
    writeLog('child-get-block-header-zcash')
    $timeout(function(){
      $scope.rawData.besttime = msgData.msg.value.result.time
      listTransactions(200, serverData.cointype)
    }, 0)
  })

  electron.ipcRenderer.on('child-list-transactions-zcash', function(event, msgData){
    writeLog('child-list-transactions-zcash')
    $timeout(function(){
      $scope.rawData.listtransactions = msgData.msg.value.result
      listReceivedByAddress(serverData.cointype)
    }, 0)
  })

  electron.ipcRenderer.on('child-list-received-by-address-zcash', function(event, msgData){
    writeLog('child-list-received-by-address-zcash')
    $timeout(function(){
      if(msgData.msg.value.result != undefined)
      {
        msgData.msg.value.result.forEach(function(element){
          var temp = {'amount': 0, 'ismine': false}
          $scope.walletData[element.address] = temp
        })
        listAddressGroupings(serverData.cointype)
      }
      else
      {
        apiStatus['getwalletdata'] = false
        shouldGetAll = false
        setTimeout(getDataTimerFunctionZcash, 10000)
      }
    }, 0)
  })

  electron.ipcRenderer.on('child-list-address-groupings-zcash', function(event, msgData){
    $timeout(function(){
      var key = Object.keys($scope.walletData)
      if(msgData.msg.value.result != undefined)
      {
        msgData.msg.value.result.forEach(function(element){
          element.forEach(function(e){
            var index = key.findIndex(function(k){return k == e[0]})
            if(index == -1)
            {
              var temp = {'amount': 0, 'ismine': false}
              $scope.walletData[e[0]] = temp
            }
          })
        })
        zListAddress(serverData.cointype)
      }
      else
      {
        apiStatus['getwalletdata'] = false
        shouldGetAll = false
        setTimeout(getDataTimerFunctionZcash, 10000)
      }
    }, 0)
  })

  electron.ipcRenderer.on('child-z-list-address-zcash', function(event, msgData){
    writeLog('child-z-list-address-zcash')
    $timeout(function(){
      if(msgData.msg.value.result != undefined)
      {
        msgData.msg.value.result.forEach(function(element){
          var temp = {'amount': 0, 'ismine': false}
          $scope.walletData[element] = temp
        });
        processAddress($scope.walletData)
      }
      else
      {
        apiStatus['getwalletdata'] = false
        shouldGetAll = false
        setTimeout(getDataTimerFunctionZcash, 10000)
      }
    }, 0)
  })

  electron.ipcRenderer.on('child-validate-address-zcash', function(event, msgData){
    // writeLog('child-validate-address-zcash')
    $timeout(function(){
      if(msgData.msg.value.result.isvalid == false)
      {
        verifyZAddress(msgData.msg.arg[1], undefined, serverData.cointype)
      }
      else
      {
        $scope.rawData.addressbalance[msgData.msg.arg[1]].ismine = msgData.msg.value.result.ismine
        verifyAllAddress()
      }
    }, 0)
  })

  electron.ipcRenderer.on('child-z-validate-address-zcash', function(event, msgData){
    // writeLog('child-z-validate-address-zcash')
    $timeout(function(){
      $scope.rawData.addressbalance[msgData.msg.arg[1]].ismine = msgData.msg.value.result.ismine
      verifyAllAddress()
    }, 0)
  })

  electron.ipcRenderer.on('child-z-get-balance-zcash', function(event, msgData){
    // writeLog('child-z-get-balance-zcash')
    $timeout(function(){
      $scope.rawData.addressbalance[msgData.msg.arg[1]].amount = msgData.msg.value.result
      getBalaceAllAddress()
    }, 0)
  })

  electron.ipcRenderer.on('child-notification-data', function(event, msgData) {
    var data = msgData.msg.banner
    $timeout(function(){
      if(data != undefined && data.length > 0)
      {
        var random = Math.floor(Math.random() * data.length)
        if(checkNoticeDisplay(serverData, data[random].type, data[random].name))
        {
          $scope.detail.banner = data[random]
          $scope.detail.showBanner = true
          saveNoticeDisplay(data[random].type, data[random].name)
        }
        else
        {
          $scope.detail.showBanner = false
        }
      }
    },0)
  })

  electron.ipcRenderer.on('child-resize-screen', function(event, msgData){
    $timeout(function(){
      if(chart != undefined)
      {
        chart.setData($scope.detail.dataChart)

        var donutData = [
          {label: $scope.ctrlTranslations['dashboardView.table.incoming'], value: $scope.detail.dataChart.totalIn },
          {label: $scope.ctrlTranslations['dashboardView.table.outgoing'], value: Math.abs($scope.detail.dataChart.totalOut) }
        ]
        donut.setData(donutData)
        donut.select(0);
      }
    },0)
  })
}]);
