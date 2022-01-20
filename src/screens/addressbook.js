app.controller('AddressBookCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {

  $scope.addresses = []
  $scope.selectedList = {}
  $scope.selectedListClone = {}
  $scope.importList = []
  $scope.detail = {}
  $scope.privKeyList = {}
  $scope.detail.current = {}
  $scope.detail.privKeyText = ""
  $scope.detail.enableButton = true
  $scope.detail.alertText = ""
  $scope.detail.enableGetPrivKey = false
  $scope.detail.enableImportKey = true
  $scope.detail.hideAddress = false
  $scope.detail.showGetPrivKey = false
  $scope.detail.sapling = false
  $scope.detail.hideAddressText = "Hide Address"
  $scope.detail.currentCoin
  $scope.detail.shieldAddress
  $scope.detail.importWithRescan = true
  $scope.detail.isEditing = false
  $scope.detail.importPrivKeyText = "Import Private Key(s)"

  var isPrivate
  var isSapling
  var importingTimer = undefined
  var countingImport = 1
  var addrData
  var newName
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
        'global.fail',
        'addressesView.importKeysButton',
        'addressesView.importKeysButtonImporting',
        'addressesView.addNewAddressBookButton',
        'addressesView.viewAddressBookButton',
        'addressesView.editAddressBookButton'
      ]).then((o) => {
          $scope.ctrlTranslations = o;
        })
    })
  }

  $scope.getControllerTranslations();

  var isImport = false
  var isContinueImport = false

  function showAlert(id, title, text)
  {
    var arg = [ScreenType.ADDRESSES]
    $timeout(function(){
      $scope.detail.title = title
      $scope.detail.alertText = text
      $(id).modal()
    },0)
  }

  function updateAddress(address, newBook)
  {
    writeLog(newBook)
    var index = $scope.addresses.findIndex(function(e){return e.address == address})
    writeLog(index)
    if(index > -1)
    {
      $scope.addresses[index].book = newBook
      $scope.addresses.sort(function(a,b){return a.address[0] >= b.address[0] ? (a.book ? a.book.localeCompare(b.book) : true) : false})
    }
  }

  function updateImportingText(){
    if(countingImport == 1)
    {
      $scope.detail.importPrivKeyText = $scope.ctrlTranslations['addressesView.importKeysButtonImporting'] + "."
      countingImport+=1
    }
    else if(countingImport == 2)
    {
      $scope.detail.importPrivKeyText = $scope.ctrlTranslations['addressesView.importKeysButtonImporting'] + ".."
      countingImport+=1
    }
    else if(countingImport == 3)
    {
      $scope.detail.importPrivKeyText = $scope.ctrlTranslations['addressesView.importKeysButtonImporting'] + "..."
      countingImport=1
    }
  }

  function populateAddress(){
    $timeout(function(){
      if(!$scope.detail.isEditing)
      {
        $scope.detail.book = readAddressBook(false, serverData, currentCoin)
        $scope.detail.bookKeys = Object.keys($scope.detail.book)
      }
    },0)
  }

  $scope.deleteBook = function(name, address){
    var index = $scope.detail.bookKeys.findIndex(function(e){return e == address})
    $scope.detail.bookKeys.splice(index,1)
    delete $scope.detail.book[address]
  }

  $scope.cancelAddressBookAction = function(){
    $scope.detail.book = readAddressBook(false, serverData, currentCoin)
    $scope.detail.bookKeys = Object.keys($scope.detail.book)
    $scope.detail.isEditing = false
  }

  $scope.editAddressBookAction = function(){
    editAddressBook($scope.detail.book, serverData, currentCoin)
    shouldGetWallet = true
    $scope.detail.isEditing = false
  }

  $scope.editAddressBook = function(){
    $scope.detail.isEditing = true
    $scope.detail.book = readAddressBook(false, serverData, currentCoin)
    $scope.detail.bookKeys = Object.keys($scope.detail.book)
    showAlert('#modalEditAddressBook', $scope.ctrlTranslations['addressesView.editAddressBookButton'])
  }

  $scope.bookChange = function(newName, address){
    // writeLog(newName)
    $timeout(function(){
      $scope.detail.book[address] = newName
      // var index = $scope.addresses.findIndex(function(e) {return e.address === address})
      // $scope.addresses[index].book = newName
      //editAddressBook($scope.detail.book, serverData, currentCoin)
      //shouldGetWallet = true
    },0)
  }

  $scope.newAddressBook = function(){
    $scope.detail.current.name = ''
    $scope.detail.current.address = ''
    $scope.detail.current.readonly = false
    showAlert(
      '#modalNewAddressBook',
      $scope.ctrlTranslations['addressesView.addNewAddressBookButton']
    )
  }

  $scope.viewBook = function(addr, name){
    $scope.detail.current.name = name
    $scope.detail.current.address = addr
    $scope.detail.current.readonly = true
    showAlert(
      '#modalNewAddressBook',
      $scope.ctrlTranslations['addressesView.viewAddressBookButton']
    )
  }

  $scope.createAction = function(name, address){
    $scope.detail.current.address = undefined
    $scope.detail.current.name = undefined
    updateAddress(address, name)
    var rtn = addAddressBook(name, address, serverData, currentCoin)
    if(rtn.result == true)
    {
      book = rtn.book
      shouldGetWallet = true
    }
    else
    {
      //display alert
      showAlert(
        '#modalAddressNoti',
        $scope.ctrlTranslations['global.fail'],
        rtn.error
      )
    }
  }

  $scope.viewQrcode = function(address) {
    var canvas = document.getElementById('qrcodeBook')

    QRCode.toCanvas(canvas, address, {width: 256}, function (error) {
      if (error) console.error(error)
      showAlert('#modalQrCodeBook', address)
    })
  }

  electron.ipcRenderer.on('child-update-address', function(event, msgData) {
    addrData = msgData.msg
    // writeLog(JSON.stringify(data))
    populateAddress()
  })

  electron.ipcRenderer.on('child-update-settings', function(event, msgData){
    $timeout(function(){
      if(msgData.msg[0] != null && msgData.msg[0] != undefined)
      {
        $scope.detail.hideAddress = msgData.msg[0].hideAddress
        $scope.detail.shieldAddress = msgData.msg[0].shieldaddress
        // if($scope.detail.hideZeroAddress == false || $scope.detail.hideZeroAddress == undefined)
        // {
        //   $scope.detail.hideZeroAddressText = $scope.ctrlTranslations['addressesView.hideZeroBalance']
        // }
        // else
        // {
        //   $scope.detail.hideZeroAddressText = $scope.ctrlTranslations['addressesView.showZeroBalance']
        // }
      }
      if(msgData.msg[1] != null && msgData.msg[1] != undefined)
      {
        $scope.detail.sapling = msgData.msg[2].sapling
      }
      $scope.detail.currentCoin = currentCoin
      serverData = msgData.msg[2]
    },0)
  })
}])
