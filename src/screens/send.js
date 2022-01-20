app.controller('SendCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function ($scope, $http, $timeout, $translate, $rootScope) {
  $scope.balances = {}
  $scope.publicAddresses = []
  $scope.privateAddresses = []
  $scope.books = []
  $scope.detail = {}
  $scope.detail.selected = undefined
  $scope.detail.recipientAddress = undefined
  $scope.detail.message = undefined
  $scope.detail.amount = undefined
  $scope.detail.value = '1'
  $scope.detail.fee = 0.0001
  $scope.detail.btnDisable = false
  $scope.detail.isBot = false
  $scope.detail.showPrivateAddress = true
  $scope.visible = false
  $scope.detail.btnSendmanyDisable = true
  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess', function (event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations()
  })

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'global.alert',
        'global.success2',
        'sendView.sendConfirmation1',
        'sendView.sendConfirmation2',
        'sendView.sendConfirmation3',
        'sendView.operations.selectSendAddress',
        'sendView.operations.putReceiverAddress',
        'sendView.operations.putAmount',
        'sendView.operations.putTxFee',
        'sendView.operations.invalidAddress',
        'sendView.operations.checkTxError',
        'sendView.sendMany',
        'global.errors.InsufficientShieldedFunds1',
        'global.errors.InsufficientShieldedFunds2',
        'global.errors.InsufficientTransparentFunds1',
        'global.errors.InsufficientTransparentFunds2',
        'global.errors.InsufficientTransparentFunds3',
        'global.errors.BadTxnsOversize',
        'global.errors.BadTxnsJoinsplitRequirementsNotMet',
        'global.errors.NonCoinbaseUTXOsToSpend'
      ]).then((o) => {
        $scope.ctrlTranslations = o
      })
    })
  }

  $scope.getControllerTranslations()

  function spawnMessage(type, text, title) {
    var arg = [ScreenType.SEND, true]
    electron.ipcRenderer.send('main-show-screen', arg)
    $timeout(function () {
      $scope.detail.title = title == undefined ? $scope.ctrlTranslations['global.alert'] + '!!!' : title
      $scope.detail.text = text
      if (type == MsgType.ALERT) {
        $('#modalSendAlert').modal()
      }
      else if (type == MsgType.SEND_CONFIRMATION) {
        $('#modalSendConfirmation').modal()
      }
      else if (type == MsgType.SEND_MANY) {
        $('#modalSendMany').modal()
      }
    }, 0)
  }

  $scope.sendClick = function () {
    // writeLog("send coin")
    if ($scope.detail.selected == undefined || $scope.detail.selected == '') {
      writeLog("send address = null")
      spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['sendView.operations.selectSendAddress'])
      return undefined
    }

    if ($scope.detail.recipientAddress == undefined || $scope.detail.recipientAddress == '') {
      writeLog("recipient address = null")
      spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['sendView.operations.putReceiverAddress'])
      return undefined
    }

    if ($scope.detail.amount == undefined || $scope.detail.amount == '') {
      writeLog("amount = null")
      spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['sendView.operations.putAmount'])
      return undefined
    }

    writeLog($scope.detail.fee)
    if ($scope.detail.fee == undefined || $scope.detail.fee === '') {
      writeLog("fee = null")
      spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['sendView.operations.putTxFee'])
      return undefined
    }

    var realAmount = parseFloat($scope.detail.amount) * parseFloat($scope.detail.value)
    spawnMessage(MsgType.SEND_CONFIRMATION, $scope.ctrlTranslations['sendView.sendConfirmation1'] + " " + realAmount + " " +
      $scope.detail.sticker + " " + $scope.ctrlTranslations['sendView.sendConfirmation2'] + " " + $scope.detail.recipientAddress +
      " " + $scope.ctrlTranslations['sendView.sendConfirmation3'] + " " + $scope.detail.fee + " " + $scope.detail.sticker)
  }

  $scope.sendMany = function () {
    spawnMessage(MsgType.SEND_MANY, undefined, $scope.ctrlTranslations['sendView.sendConfirmation2'] | 'Send Many')
  }

  $scope.sendCoin = function () {
    writeLog("verifyAddress")
    $scope.detail.btnDisable = true
    var dataToSend = {}
    dataToSend['from'] = $scope.detail.selected
    dataToSend['to'] = $scope.detail.recipientAddress
    var realAmount = parseFloat($scope.detail.amount) * parseFloat($scope.detail.value)
    dataToSend['amount'] = realAmount
    dataToSend['fee'] = $scope.detail.fee
    $scope.detail.isBot = false
    if (dataToSend['from'] == "public") {
      exec_sendCoin(dataToSend.from, dataToSend.to, String(dataToSend.amount).replace(',', '.'), String(dataToSend.fee).replace(',', '.'), SendType.PUBLIC)
    }
    else {
      verifyAddress($scope.detail.recipientAddress, dataToSend)
    }
  }

  $scope.selectAddress = function (addr) {
    $scope.detail.selected = addr
  }

  $scope.detail.recipientAddressChange = function (data) {
    $scope.detail.recipientAddress = data
  }

  $scope.amountChange = function (data) {
    $scope.detail.amount = data
  }

  $scope.valueChange = function (data) {
    $scope.detail.value = data
  }

  $scope.feeChange = function (data) {

    $scope.detail.fee = data
  }

  $scope.messageChange = function (data) {
    $scope.detail.message = data
  }

  function populateAddress(data) {
    var walletDic = data.from
    var keys = Object.keys(walletDic)

    $timeout(function () {
      $scope.publicAddresses = []
      $scope.privateAddresses = []
      keys.forEach(function (element) {
        var temp = {}
        temp['text'] = element + " - " + walletDic[element].amount
        temp['value'] = element.split(' (')[0]
        temp['amount'] = walletDic[element].amount
        if (element.startsWith('z')) {
          var index = $scope.privateAddresses.findIndex(function (e) { return e.text.split(' - ')[0] === temp.text.split(' - ')[0] })
          if (index == -1) {
            if (walletDic[element].amount > 0) {
              $scope.privateAddresses.push(temp)
            }
          }
          else {
            if ($scope.privateAddresses[index].text.split(' - ')[1] != temp.text.split(' - ')[1]
              && parseFloat(temp.text.split(' - ')[1]) > 0) {
              $scope.privateAddresses[index].text = temp.text
            }
            else if ($scope.privateAddresses[index].text.split(' - ')[1] != temp.text.split(' - ')[1]
              && parseFloat(temp.text.split(' - ')[1]) == 0) {
              $scope.privateAddresses.splice(index, 1)
            }
          }
        }
        else {
          var index = $scope.publicAddresses.findIndex(function (e) { return e.text.split(' - ')[0] === temp.text.split(' - ')[0] })
          if (index == -1) {
            if (walletDic[element].amount > 0) {
              if (walletDic[element].ismine) {
                $scope.publicAddresses.push(temp)
              }
            }
          }
          else {
            if ($scope.publicAddresses[index].text.split(' - ')[1] != temp.text.split(' - ')[1]
              && parseFloat(temp.text.split(' - ')[1]) > 0) {
              $scope.publicAddresses[index].text = temp.text
            }
            else if ($scope.publicAddresses[index].text.split(' - ')[1] != temp.text.split(' - ')[1]
              && parseFloat(temp.text.split(' - ')[1]) == 0) {
              $scope.publicAddresses.splice(index, 1)
            }
          }
        }
      })

      var book = data.book
      if (book != undefined) {
        $scope.books = []
        keys = Object.keys(book)

        keys.forEach(function (element) {
          var temp = {}
          temp['text'] = book[element]
          temp['value'] = element
          if (!$scope.books.filter(function (e) { return e.text === temp.text }).length > 0) {
            $scope.books.push(temp)
          }
        })

        $scope.books.sort(function (a, b) { return a.text.localeCompare(b.text) })

        addrBook = JSON.parse(JSON.stringify($scope.books))
      }

      if ($scope.detail.selected == undefined && $scope.publicAddresses.length > 0) {
        if (!$scope.detail.showPrivateAddress) {
          $scope.detail.selected = "public"
        }
        else {
          $scope.detail.selected = $scope.publicAddresses[0].value
        }
      }
    }, 0)
  }

  $scope.faq = function () {
    shell.openExternal('https://docs.tent.app/wallets/snowgem-modern-wallet/frequently-asked-questions')
  }

  $scope.maxCoinClick = function () {
    var temp = $scope.publicAddresses.concat($scope.privateAddresses)
    var maxAmount = 0
    temp.forEach(function (element) {
      if (element.value == $scope.detail.selected) {
        maxAmount = element.amount
      }
    })
    if (!$scope.detail.showPrivateAddress) {
      $scope.detail.amount = parseFloat((parseFloat($scope.balances.transparentCoins) - parseFloat($scope.detail.fee) - 0.1).toFixed(8))
    }
    else {
      $scope.detail.amount = parseFloat((parseFloat(maxAmount) - parseFloat($scope.detail.fee)).toFixed(8))
    }
  }

  electron.ipcRenderer.on('child-transparent-balance', function(event, msgData){
    var data = msgData.msg
    $scope.balances.transparentCoins = data
  })

  electron.ipcRenderer.on('child-update-send', function (event, msgData) {
    var data = msgData.msg
    populateAddress(data)
  })

  electron.ipcRenderer.on('child-verify-address', function (event, msgData) {
    var info = msgData.msg
    var data = info[0].result
    var arg = info[1]
    if (data != undefined && data.isvalid == true) {
      $timeout(function () {
        exec_sendCoin(arg[2].from, arg[2].to, String(arg[2].amount).replace(',', '.'), String(arg[2].fee).replace(',', '.'), SendType.NORMAL)
      }, 0)
    }
    else if (data != undefined && data.isvalid == false) {
      $timeout(function () {
        writeLog(arg[2])
        verifyZAddress(arg[2].to, arg[2])
      }, 0)
    }
  })

  electron.ipcRenderer.on('child-verify-zaddress', function (event, msgData) {
    var info = msgData.msg
    var data = info[0].result
    var arg = info[1]
    if (data != undefined && data.isvalid == true) {
      $timeout(function () {
        exec_sendCoin(arg[2].from, arg[2].to, String(arg[2].amount).replace(',', '.'), String(arg[2].fee).replace(',', '.'), SendType.NORMAL)
      }, 0)
    }
    else if (data != undefined && data.isvalid == false) {
      $timeout(function () {
        $scope.detail.btnDisable = false
        var msg = $scope.ctrlTranslations['sendView.operations.invalidAddress'] + ' ' + $scope.detail.recipientAddress
        if ($scope.detail.isBot == false) {
          spawnMessage(MsgType.ALERT, msg)
        }
        else {
          sendBotReplyMsg(msg)
        }
      }, 0)
    }
  })

  electron.ipcRenderer.on('child-send-coin', function (event, msgData) {
    var data = msgData.msg
    // writeLog(data)
    if (data.result != null) {
      checkTransaction(data.result, SendType.NORMAL)
    }
    else {
      $timeout(function () {
        $scope.detail.btnDisable = false
        if ($scope.detail.isBot == false) {
          spawnMessage(MsgType.ALERT, data.error.message)
        }
        else {
          sendBotReplyMsg(data.error.message)
        }
      }, 0)

    }
  })

  electron.ipcRenderer.on('child-set-tx-fee', function (event, msgData) {
    var data = msgData.msg
    if (data.error == null) {
      $timeout(function () {
        var realAmount = parseFloat($scope.detail.amount) * parseFloat($scope.detail.value)
        sendCoinPublic($scope.detail.recipientAddress, realAmount)
      })
    }
    else {
      $timeout(function () {
        $scope.detail.btnDisable = false
        if ($scope.detail.isBot == false) {
          spawnMessage(MsgType.ALERT, data.error? data.error.message : $scope.ctrlTranslations['global.error'])
        }
        else {
          sendBotReplyMsg(data.error? data.error.message : $scope.ctrlTranslations['global.error'])
        }
      }, 0)
    }
  })

  electron.ipcRenderer.on('child-send-to-address', function (event, msgData) {
    var data = msgData.msg
    writeLog(data)
    if (data.error == null) {
      $timeout(function () {
        $scope.detail.btnDisable = false
        var msg = $scope.ctrlTranslations['global.success2']
        if ($scope.detail.isBot == false) {
          spawnMessage(MsgType.ALERT, msg)
        }
        else {
          msg += "\n" + explorer + "tx/" + element.result.txid
          sendBotReplyMsg(msg)
        }
        shouldGetAll = true
        $scope.detail.amount = undefined
        $scope.detail.recipientAddress = undefined
        $scope.detail.message = undefined
      }, 0)
    }
    else {
      $timeout(function () {
        $scope.detail.btnDisable = false
        if ($scope.detail.isBot == false) {
          spawnMessage(MsgType.ALERT, data.error? data.error.message : $scope.ctrlTranslations['global.error'])
        }
        else {
          sendBotReplyMsg(data.error? data.error.message : $scope.ctrlTranslations['global.error'])
        }
      }, 0)

    }
  })

  electron.ipcRenderer.on('child-check-transaction', function (event, msgData) {
    // writeLog(msgData.msg)
    var data = msgData.msg
    if (data.result == null) {
      $timeout(function () {
        $scope.detail.btnDisable = false
        var msg = $scope.ctrlTranslations['sendView.operations.checkTxError']
        if ($scope.detail.isBot == false) {
          spawnMessage(MsgType.ALERT, msg)
        }
        else {
          sendBotReplyMsg(msg)
        }
      }, 0)
    }
    else {
      //send done, check status
      var element = data.result[0]
      // writeLog(element)
      var status = element ? element.status : undefined
      if (status == "executing" || status == undefined) {
        setTimeout(function () {
          checkTransaction(element ? element.id : data.id, SendType.NORMAL)
          //update sending process
        }, 2000);
      }
      else if (status == "success") {
        $timeout(function () {
          $scope.detail.btnDisable = false
          var msg = $scope.ctrlTranslations['global.success2']
          if ($scope.detail.isBot == false) {
            spawnMessage(MsgType.ALERT, msg)
          }
          else {
            msg += "\n" + explorer + "tx/" + element.result.txid
            sendBotReplyMsg(msg)
          }
          shouldGetAll = true
          $scope.detail.amount = undefined
          $scope.detail.recipientAddress = undefined
          $scope.detail.message = undefined
        }, 0)
      }
      else {
        $scope.detail.btnDisable = false
        var error_msg = element.error.message
        writeLog(error_msg)
        switch (true) {
          case error_msg.includes("Insufficient shielded funds"):
            var have = error_msg.split('have ').pop().split(',')[0];
            var need = error_msg.split('need ').pop().split(',')[0];
            msg = $scope.ctrlTranslations['global.errors.InsufficientShieldedFunds1'] + have
            msg += $scope.ctrlTranslations['global.errors.InsufficientShieldedFunds2'] + need
            break;
          case (error_msg.includes("Insufficient transparent funds") && !error_msg.includes("dust threshold is")):
            var have = error_msg.split('have ').pop().split(',')[0];
            var need = error_msg.split('need ').pop().split(',')[0];
            msg = $scope.ctrlTranslations['global.errors.InsufficientTransparentFunds1'] + have
            msg += $scope.ctrlTranslations['global.errors.InsufficientShieldedFunds2'] + need
            break;
          case (error_msg.includes("Insufficient transparent funds") && error_msg.includes("dust threshold is")):
            var have = error_msg.split('have ').pop().split(',')[0];
            var need = error_msg.split('need ').pop().split(' more')[0];
            var invalid_change = error_msg.split('output ').pop().split(' (')[0];
            var dust_threshold = error_msg.split('is ').pop().split(')')[0];
            msg = $scope.ctrlTranslations['global.errors.InsufficientTransparentFunds1'] + have
            msg += $scope.ctrlTranslations['global.errors.InsufficientShieldedFunds2'] + need
            msg += $scope.ctrlTranslations['global.errors.InsufficientTransparentFunds2'] + invalid_change
            msg += $scope.ctrlTranslations['global.errors.InsufficientTransparentFunds3'] + dust_threshold + ")"
            break;
          case error_msg.includes("bad-txns-oversize"):
            msg = $scope.ctrlTranslations['global.errors.BadTxnsOversize']
            break;
          case error_msg.includes("bad-txns-joinsplit-requirements-not-met"):
            msg = $scope.ctrlTranslations['global.errors.BadTxnsJoinsplitRequirementsNotMet']
            break;
          case error_msg.includes("Could not find any non-coinbase UTXOs to spend."):
            msg = $scope.ctrlTranslations['global.errors.NonCoinbaseUTXOsToSpend']
            break;
          default:
            msg = error_msg
        }
        if ($scope.detail.isBot == false) {
          spawnMessage(MsgType.ALERT, msg)
        }
        else {
          sendBotReplyMsg(msg)
        }
      }
    }
  })

  electron.ipcRenderer.on('child-update-settings', function (event, msgData) {
    $timeout(function () {
      if (msgData.msg[2] != null && msgData.msg[2] != undefined) {
        $scope.detail.sticker = msgData.msg[2].sticker
        $scope.detail.stickerSmall = 'm' + msgData.msg[2].sticker
        $scope.detail.hideShield = !msgData.msg[2].shield
        $scope.detail.showPrivateAddress = msgData.msg[2].showprivateaddress
      }
    }, 0)
  })

  electron.ipcRenderer.on('child-execute-send-coin', function (event, msgData) {
    $timeout(function () {
      if (msgData.msg != undefined) {
        var data = msgData.msg
        $scope.detail.btnDisable = true
        var dataToSend = {}
        dataToSend['from'] = data.from
        dataToSend['to'] = data.to
        dataToSend['amount'] = data.value
        dataToSend['fee'] = $scope.detail.fee
        $scope.detail.isBot = data.isBot
        verifyAddress(data.to, dataToSend)
      }
    }, 0)
  })

}]);
