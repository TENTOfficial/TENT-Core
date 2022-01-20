app.controller('TransactionsCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.transactions = []
  $scope.detail = {}
  $scope.visible = false
  $scope.transactionData

  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess', function (event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations()
  })

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'shieldView.privateAddr'
      ]).then((o) => {
        $scope.ctrlTranslations = o
      })
    })
  }

  $scope.getControllerTranslations()

  function updateTransactions(arg){
    var data = arg.data
    var count = 1
    // writeLog(JSON.stringify(data))
    $timeout(function(){
      if($scope.transactions.length == 0 || $scope.transactions[0].key != data[0].txid || $scope.transactions[0].confirmations != data[0].confirmations)
      {
        ipc.send('main-update-transactions-time', arg)
        $scope.transactions = []

        data.some(function(element){
          var temp = {}
          temp['no'] = count
          temp['direction'] = $scope.directionClass = element.category
          temp['date'] = timeConverter(element.time)
          temp['address'] = element.address != undefined ? element.address : $scope.ctrlTranslations['shieldView.privateAddr']
          temp['amount'] = Math.abs(element.amount)
          if(element.category != "generate")
          {
            temp['validated'] = element.confirmations >= 5 ? 'Yes' : 'No (' + element.confirmations + ')'
          }
          else
          {
            temp['validated'] = element.confirmations >= 100 ? 'Yes' : 'Immature (' + element.confirmations + ')'
          }
          temp['confirmations'] = element.confirmations
          temp['value'] = element
          temp['key'] = element.txid

          $scope.transactions.push(temp)
          count += 1
          if(count > 100)
            return true
        })
      }
      transactions = $scope.transactions
    },0)
  }

  $scope.viewDetail = function(data)
  {
    $scope.transactionData = JSON.stringify(data, null, 2)
    var txhash = data.txid
    $scope.detail.txurl = (serverData.explorer.endsWith('/') ? serverData.explorer : serverData.explorer + '/') + txhash
    $("#txModal").modal()
  }

  $scope.faq = function(){
    shell.openExternal('https://docs.tent.app/wallets/snowgem-modern-wallet/frequently-asked-questions')
  }

  electron.ipcRenderer.on('child-update-transactions', function(event, msgData){
    updateTransactions(msgData.msg)
  })

}])
