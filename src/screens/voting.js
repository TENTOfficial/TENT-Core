app.controller('VotingCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.detail = {}

  var sample = '[\
    {\
      "Name": "test2",\
      "URL": "https://tent.app",\
      "Hash": "4ed246e40976aa24b758a95bb09f0b5ec7f3e305e4ab966039e6777c1d86a4a8",\
      "FeeHash": "a6c2ba3c9a2f34c88cc74cdc0e5729001bcfefd0229826f37085590e92700a8e",\
      "BlockStart": 11808,\
      "BlockEnd": 12097,\
      "TotalPaymentCount": 2,\
      "RemainingPaymentCount": 1,\
      "PaymentAddress": "tmPrkiawJJSgupDiza2aGnnA1AQh1c3mFEU",\
      "Ratio": 0,\
      "Yeas": 0,\
      "Nays": 0,\
      "Abstains": 0,\
      "TotalPayment": 20.00000000,\
      "MonthlyPayment": 10.00000000,\
      "IsEstablished": true,\
      "IsValid": true,\
      "IsValidReason": "",\
      "fValid": true\
    }\
  ]'
  // $scope.detail.book = readAddressBook(false, serverData, currentCoin)
  // $scope.detail.bookKeys = Object.keys($scope.detail.book)

  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess', function(event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations();
  });

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
      ]).then((o) => {
         $scope.ctrlTranslations = o;
        })
    })
  }

  $scope.getControllerTranslations();

  function spawnMessage(type, proposal)
  {
    $timeout(function() {
      if(proposal)
      {
        $scope.detail.proposal = proposal
      }
      if(type == MsgType.BUDGET_VOTE)
      {
        $('#modalMasternodeVote').modal()
      }
      else if(type == MsgType.ALERT)
      {
        $('#votingResult').modal()
      }
    }, 200)
  }

  $scope.votingAction = function(proposal){
    spawnMessage(MsgType.BUDGET_VOTE, proposal)
  }

  $scope.openUrl = function(url){
    shell.openExternal(url)
  }

  $scope.votingResult = function(proposal, result){
    var choice
    if(result == true){
      choice = "yes"
    }
    else
    {
      choice = "no"
    }
    voteProposal("many", proposal, choice)
  }

  electron.ipcRenderer.on('child-update-settings', function(event, msgData){
    $timeout(function(){
      if(msgData.msg[0] != null && msgData.msg[0] != undefined)
      {
        $scope.detail.hideAddress = msgData.msg[0].hideAddress
        $scope.detail.shieldAddress = msgData.msg[0].shieldaddress
      }
      if(msgData.msg[1] != null && msgData.msg[1] != undefined)
      {
        $scope.detail.sapling = msgData.msg[2].sapling
      }
      $scope.detail.currentCoin = currentCoin
    },0)
  })

  electron.ipcRenderer.on('child-localmn-status', function(event, msgData) {
    $scope.detail.localMNs = msgData.msg;
    $scope.detail.localMNs = $scope.detail.localMNs.filter( function(item) {
      return item.rank == "-";
    });
  })

  electron.ipcRenderer.on('child-mnbudget-show', function(event, msgData){
    $timeout(function(){
      $scope.detail.mnbudgetVote = msgData.msg.result;
      // $scope.detail.mnbudgetVote = JSON.parse(sample);
    },0)
  })

  electron.ipcRenderer.on('child-mnbudget-vote', function(event, msgData){
    $timeout(function(){
      $scope.detail.votingResult = JSON.stringify(msgData.msg, null, 2)
      spawnMessage(MsgType.ALERT)
    },500)
  })
}])
