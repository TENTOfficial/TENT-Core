app.controller('AddressesCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {

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
        'global.success',
        'global.fail',
        'global.alert',
        'global.error',
        'global.done',
        'global.confirmationTitle',
        'addressesView.importKeysButton',
        'addressesView.importKeysButtonImporting',
        'addressesView.getAdresses',
        'addressesView.getMultipleAdresses',
        'addressesView.createNewAddressButton',
        'addressesView.createNewPrivateAddressButton',
        'addressesView.addNewAddressBookButton',
        'addressesView.viewAddressBookButton',
        'addressesView.editAddressBookButton',
        'addressesView.operations.keysImportTitle',
        'addressesView.operations.keysImportMsg',
        'addressesView.operations.readOnlyErrTitle',
        'addressesView.operations.readOnlyErrMsg',
        'addressesView.operations.emptyNameErrMsg',
        'addressesView.operations.duplicateNameErrMsg',
        'addressesView.hideAddressButton',
        'addressesView.hideAddressesButton',
        'addressesView.modalMultipleShieldErrMsg',
        'addressesView.modalMultipleShieldConfirmMsg',
        'addressesView.exportMessage',
      ]).then((o) => {
          $scope.detail.privKeyText = o['addressesView.getAdresses'];
          if($scope.detail.importPrivKeyText.startsWith($scope.ctrlTranslations['addressesView.importKeysButtonImporting']) == false)
          {
            $scope.detail.importPrivKeyText = o['addressesView.importKeysButton'];
          }
          if(countSelected(Object.keys($scope.selectedList)) > 1)
          {
            $scope.detail.privKeyText = o['addressesView.getMultipleAdresses']
            $scope.detail.hideAddressText = o['addressesView.hideAddressesButton']
          }
          else
          {
            $scope.detail.privKeyText = o['addressesView.getAdresses']
            $scope.detail.hideAddressText = o['addressesView.hideAddressButton']
          }
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

  function populateAddress(data){
    var walletDic = data.from
    var keys = Object.keys(walletDic)
    var count = 1
    var settings = readSettings($scope.detail.currentCoin)

    var countSelected = 0
    keys.forEach(function(element) {
      if($scope.selectedList[element] == true)
      {
        countSelected += 1
      }
    })

    if(countSelected >= 1)
    {
      $scope.detail.showGetPrivKey = true
      $scope.detail.enableGetPrivKey = true
    }
    else
    {
      $scope.detail.showGetPrivKey = false
      $scope.detail.enableGetPrivKey = false
    }
    $timeout(function(){
      $scope.addresses = []
      keys.forEach(function(element) {
        var temp = {}
        temp['no'] = count
        temp['copy'] = ""
        var split = element.split(' ')
        temp['address'] = element.split(' ')[0]
        if(split.length > 1)
        {
          var newbook = element.split(temp['address'] + ' ')[1]
          if(newbook.startsWith('('))
          {
            newbook = newbook.slice(1, newbook.length - 1)
          }
          if(newbook.endsWith(')'))
          {
            newbook = newbook.splice(0, newbook.length - 2)
          }
          temp['book'] = newbook
        }
        var type
        if(element.startsWith('z'))
        {
          type = 'private'
        }
        else
        {
          type = 'public'
        }
        if(walletDic[element].ismine == false)
        {
          type = 'read-only'
        }
        temp['type'] = type
        temp['amount'] = walletDic[element].amount
        if(settings.addresses == undefined || (settings.addresses != undefined &&
          (settings.addresses[temp.address] == true || settings.addresses[temp.address] == undefined)))
        {
          $scope.addresses.push(temp)
          var selectedKeys = Object.keys($scope.selectedList)
          var index = selectedKeys.findIndex(function(e){return e === temp.address})

          if(index == -1 && temp.type != 'read-only')
          {
            $scope.selectedList[temp.address] = false
          }
          count += 1
        }
      })
      $scope.addresses.sort(function(a,b){return a.address[0] >= b.address[0] ? (a.book ? a.book.localeCompare(b.book) : true) : false})
      $scope.detail.enableButton = true
      if(!$scope.detail.isEditing)
      {
        $scope.detail.book = readAddressBook(false, serverData, currentCoin)
        $scope.detail.bookKeys = Object.keys($scope.detail.book)
      }
    },0)
  }

  function countSelected(keys){
    var selectedCount = 0
    keys.forEach(function(element) {
      if($scope.selectedList[element] == true)
      {
        selectedCount += 1
      }
    })
    return selectedCount
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

  $scope.select = function(addr, isSelected){
    // var index = $scope.addresses.findIndex(function(e) {return e.address === addr})
    // if($scope.addresses[index].type == 'read-only')
    // {
    //   $scope.selectedList[addr] = false
    //   showAlert(
    //     '#modalAddressNoti',
    //     $scope.ctrlTranslations['addressesView.operations.readOnlyErrTitle'],
    //     $scope.ctrlTranslations['addressesView.operations.readOnlyErrMsg']
    //   )
    // }
    // else
    {
      $scope.selectedList[addr] = isSelected
      var keys = Object.keys($scope.selectedList)
      var count = 0
      keys.forEach(function(element) {
        if($scope.selectedList[element] == true)
        {
          count += 1
        }
      })

      if(count >= 1)
      {
        $scope.detail.showGetPrivKey = true
        $scope.detail.enableGetPrivKey = true
        if(count >= 2)
        {
          $scope.detail.privKeyText = $scope.ctrlTranslations['addressesView.getMultipleAdresses']
          $scope.detail.hideAddressText = $scope.ctrlTranslations['addressesView.hideAddressesButton']
        }
        else
        {
          $scope.detail.privKeyText = $scope.ctrlTranslations['addressesView.getAdresses']
          $scope.detail.hideAddressText = $scope.ctrlTranslations['addressesView.hideAddressButton']
        }

      }
      else
      {
        $scope.detail.showGetPrivKey = false
      }
    }
  }

  $scope.selectAllClick = function(isSelected){
    var keys = Object.keys($scope.selectedList)
    keys.forEach(function(element){
      var index = $scope.addresses.findIndex(function(e){return e.address === element})
      if(index > -1)
      {
        $scope.selectedList[element] = isSelected
      }
    })
    if(isSelected && $scope.addresses.length > 0)
    {
      if($scope.addresses.length > 1)
      {
        $scope.detail.privKeyText = $scope.ctrlTranslations['addressesView.getMultipleAdresses']
        $scope.detail.hideAddressText = $scope.ctrlTranslations['addressesView.hideAddressesButton']
      }
      else
      {
        $scope.detail.privKeyText = $scope.ctrlTranslations['addressesView.getAdresses']
        $scope.detail.hideAddressText = $scope.ctrlTranslations['addressesView.hideAddressButton']
      }
      $scope.detail.showGetPrivKey = true
      $scope.detail.enableGetPrivKey = true
    }
    else
    {
      $scope.detail.showGetPrivKey = false
    }
  }

  $scope.newAddress = function(){
    isPrivate = false
    showAlert(
      '#modalAddressNewAddress',
      $scope.ctrlTranslations['addressesView.createNewAddressButton']
    )
  }

  $scope.newPrivateAddress = function(sapling){
    isPrivate = true
    isSapling = sapling
    showAlert(
      '#modalAddressNewAddress',
      $scope.ctrlTranslations['addressesView.createNewPrivateAddressButton']
    )
  }

  $scope.createAddress = function(event)
  {
    console.log($scope.detail.addressName)
    if(event != undefined)
    {
      event.preventDefault()
      if (event.keyCode === 13) {
        $('#modalAddressNewAddress').modal('hide')
      }
      else
      {
        return
      }
    }

    if(!$scope.detail.addressName)
    {
      showAlert(
        '#modalAddressNoti',
        $scope.ctrlTranslations['global.fail'],
        $scope.ctrlTranslations['addressesView.operations.emptyNameErrMsg']
      )
      return
    }
    var book = readAddressBook(true, serverData, currentCoin)
    var keys = Object.values(book)
    if(keys.includes($scope.detail.addressName))
    {
      showAlert(
        '#modalAddressNoti',
        $scope.ctrlTranslations['global.fail'],
        $scope.ctrlTranslations['addressesView.operations.duplicateNameErrMsg']
      )
      return
    }
    newName = $scope.detail.addressName
    $scope.detail.addressName = ""
    if(isPrivate == false)
    {
      newAddress()
      shouldGetAll = true
      $scope.detail.enableButton = false
    }
    else
    {
      newZAddress(isSapling)
      shouldGetAll = true
      $scope.detail.enableButton = false
    }
  }

  $scope.getPrivKey = function(){
    $scope.privKeyList = {}
    var keys = Object.keys($scope.selectedList)
    keys.forEach(function(element){
      if($scope.selectedList[element] == true)
      {
        $scope.selectedListClone[element] = true
      }
    });
    $scope.detail.enableGetPrivKey = false
    privKey()
  }

  $scope.exportToFile = function(){
    exportPrivateKeys("xsgprivkey")
  }

  function privKey(){
    var keys = Object.keys($scope.selectedListClone)

    var addr = keys[0]
    delete $scope.selectedListClone[addr]
    if(!addr.startsWith('z'))
    {
      exportPrivateKey(addr.split(' ')[0])
    }
    else
    {
      z_exportPrivateKey(addr.split(' ')[0])
    }
  }

  $scope.importPrivKey = function()
  {
    isImport = true
    showAlert(
      '#modalAddressNoti',
      $scope.ctrlTranslations['addressesView.operations.keysImportTitle'],
      $scope.ctrlTranslations['addressesView.operations.keysImportMsg']
    )
  }

  $scope.closeAlertAction = function(){
    if(isImport)
    {
      $('#importPrivatekeys').modal()
      isImport = false
    }
    else if(isContinueImport)
    {
      setTimeout(continueImport, 1000)
      isContinueImport = false
    }
  }

  $scope.importAction = function(){
    $scope.importList = $scope.detail.privKeysImport.replace(/\r\n/g, '\n').split('\n')
    $scope.detail.privKeysImport = undefined
    if($scope.importList.length > 0)
    {
      if(importingTimer == undefined)
      {
        importingTimer = setInterval(updateImportingText, 1000);
      }
      importKey()
    }
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

  function importKey(data)
  {
    $timeout(function(){
      if(data != undefined && data.msg.value.error != null)
      {
        var errMsg = "Cannot import " + data.msg.arg[1] + "\n\n"
        errMsg += data.msg.value.error.message
        isContinueImport = true
        showAlert(
          '#modalAddressError',
          $scope.ctrlTranslations['global.error'],
          errMsg
        )
      }
      else
      {
        continueImport()
      }

    },0)
  }

  function continueImport()
  {
    if($scope.importList.length == 0)
    {
      shouldGetAll = true
      $scope.detail.enableImportKey = true
      showAlert('#modalAddressNoti', '', $scope.ctrlTranslations['global.done'])
      clearTimeout(importingTimer)
      importingTimer = undefined
      $scope.detail.importPrivKeyText = $scope.ctrlTranslations['addressesView.importKeysButton']
      return
    }
    $scope.detail.enableImportKey = false
    var priv1 = $scope.importList[0]
    $scope.importList.splice(0,1)
    writeLog($scope.importList.length)
    if(priv1.startsWith('K') || priv1.startsWith('L'))
    {
      importPrivateKey(priv1, "", $scope.detail.importWithRescan)
    }
    else
    {
      z_importPrivateKey(priv1, $scope.detail.importWithRescan, 0)
    }
  }

  $scope.viewQrcode = function(address) {
    var canvas = document.getElementById('qrcode')

    QRCode.toCanvas(canvas, address, {width: 256}, function (error) {
      if (error) console.error(error)
      showAlert('#modalQrCode', address)
    })
  }

  $scope.hideAddressClick = function(){
    var settings = readSettings($scope.detail.currentCoin)
    if(settings.addresses == undefined)
    {
      settings.addresses = {}
    }
    var keys = Object.keys($scope.selectedList)
    keys.forEach(function(element){
      if($scope.selectedList[element] == true)
      {
        settings.addresses[element] = false
        $scope.selectedList[element] = false
      }
    })
    $scope.detail.selectedAll = false
    saveSettings(settings, $scope.detail.currentCoin)
    populateAddress(addrData)
    // var arg = [settings]
    // ipc.send('main-update-settings', arg)
  }

  $scope.showAddressClick = function(){
    settings.addresses = {}
    $scope.detail.selectedAll = false
    saveSettings(settings, $scope.detail.currentCoin)
    populateAddress(addrData)
  }
  $scope.multipleShieldClick = function(){
    if($scope.detail.shieldAddress == null || $scope.detail.shieldAddress == undefined)
    {
      showAlert(
        '#modalAddressNoti',
        $scope.ctrlTranslations['global.alert'],
        $scope.ctrlTranslations['addressesView.modalMultipleShieldErrMsg']
      )
    }
    else
    {
      showAlert(
        '#shieldAllConfirmationAddr',
        $scope.ctrlTranslations['global.confirmationTitle'],
        $scope.ctrlTranslations['addressesView.modalMultipleShieldConfirmMsg'] + ' ' + $scope.detail.shieldAddress
      )
    }
  }

  $scope.shieldAllAction = function(){
    var arg = {}
    arg.privateAddr = $scope.detail.shieldAddress
    arg.shieldAddress = []
    var keys = Object.keys($scope.selectedList)
    keys.forEach(function(element) {
      if($scope.selectedList[element] == true)
      {
        arg.shieldAddress.push(element)
      }
    })
    electron.ipcRenderer.send('main-execute-multiple-shield', arg)
    //move to shield page
    showTab(ScreenType.SHIELD, false)
    $(window).scrollTop(0);
  }

  electron.ipcRenderer.on('child-update-address', function(event, msgData) {
    addrData = msgData.msg
    // writeLog(JSON.stringify(data))
    populateAddress(addrData, $scope.detail.hideAddress)
  })

  electron.ipcRenderer.on('child-get-new-address', function(event, msgData) {
    var rtn = addAddressBook(newName, msgData.msg.result, serverData, currentCoin)
    shouldGetWallet = true
    showAlert('#modalAddressNoti', $scope.ctrlTranslations['addressesView.newAddressButton'], msgData.msg.result)
  })

  electron.ipcRenderer.on('child-exportwallet', function(event, msgData) {
    showAlert('#modalAddressNoti', $scope.ctrlTranslations['global.done'], msgData.msg.value.result ? 
    $scope.ctrlTranslations['addressesView.exportMessage'] + msgData.msg.value.result :  msgData.msg.value.error.message)
  })

  electron.ipcRenderer.on('child-update-settings', function (event, msgData) {
    $timeout(function () {
      if (msgData.msg[2] != null && msgData.msg[2] != undefined) {
        $scope.detail.showPrivateAddress = msgData.msg[2].showprivateaddress
        $scope.detail.shield = msgData.msg[2].shield
      }
    }, 0)
  })
  
  electron.ipcRenderer.on('child-dump-priv-key', function(event, msgData) {
    var data = msgData.msg
    // writeLog(JSON.stringify(data))
    $timeout(function(){
      $scope.privKeyList[data.arg[1]] = data.value.result
      var keys = Object.keys($scope.selectedList)
      var privKeys = Object.keys($scope.privKeyList)

      var selectedCount = countSelected(keys)
      writeLog(selectedCount)
      writeLog(privKeys.length)
      if(selectedCount == privKeys.length)
      {
        $scope.detail.privatekeys = JSON.stringify($scope.privKeyList, null, 2)
        $scope.detail.enableGetPrivKey = true
        // $scope.detail.privatekeys = $scope.detail.privatekeys.replace('\r\n','\n').replace('\n', '')
        $('#privKeyModal').modal()
      }
      else
      {
        privKey()
      }
    })
  },0)

  electron.ipcRenderer.on('child-import-priv-key', function(event, msgData) {
    importKey(msgData)
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
    },0)
  })
}])
