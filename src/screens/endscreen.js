var app = angular.module('endscreen', ['pascalprecht.translate'])
var electron = require('electron')
var fs = require('fs')
var miningProcess = require('child_process')
var ipc = electron.ipcRenderer
window.$ = window.jQuery = require("../../global/vendor/jquery/jquery.js");
var remote = require('electron').remote
var request = require('request')
var args = remote.process.argv
var path = require('path')
var isDevMode = process.execPath.match(/[\\/]electron/)

let gotTranslations = false;
let translations = {};
const validTranslations = ['ae', 'cn', 'cz', 'de', 'en', 'es', 'fr', 'hu', 'it', 'kr', 'nl', 'pl', 'ro', 'ru', 'tr']
const getTranslations = new Promise(function(resolve, reject) {
    validTranslations.forEach(function(t, i){
      fs.readFile(path.join(getLanguageDir(), `${t}.json`), function(err, data){
        if (err) reject(err);
        translations[t] = JSON.parse(data);
        if (validTranslations.length === i + 1) {
          gotTranslations = true;
          resolve(translations)
        };
      });
    })
});

async function translationsAvailable() {
  await waitFor(_ => gotTranslations === true);
  return new Promise(function(resolve) {
    resolve();
  })
}

function waitFor(conditionFunction) {

  const poll = resolve => {
    if(conditionFunction()) resolve();
    else setTimeout(_ => poll(resolve), 500);
  }

  return new Promise(poll);
}

function getLanguageDir(){
  if(isDevMode)
  {
    return path.join(__dirname, '..', '..', 'assets', 'languages')
  }
  else
  {
    return path.join(getWalletHome(true), "language")
  }
}

function getLanguageChecksumLoc(){
  return path.join(getWalletHome(), "lang.checksum")
}

function getWalletHome() {
  var dataFolder = process.env[(process.platform == 'win32') ? 'APPDATA' : 'HOME']
  if (process.platform == 'win32') {
    dataFolder += "\\tentcore"
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }
  } else if (process.platform == 'linux') {
    dataFolder += "/.tentcore"
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }
  } else if (process.platform == 'darwin') {
    dataFolder += "/Library/Application Support/tentcore"
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }
  }

  return dataFolder.replace(/\\/g, "/")
}

function getLanguage()
{
  var loc = path.join(getWalletHome(), 'config.json')
  var data = {}
  try
  {
    data = JSON.parse(fs.readFileSync(loc, "utf8"))
  }
  catch(ex){}
  if(data.language != undefined)
  {
    return data.language
  }
  else
  {
    return LanguageType.EN
  }
}


let setLanguage;
app.config(['$translateProvider', function ($translateProvider) {
  getTranslations.then(function() {
    // Translations are loaded successfully
    return new Promise(function(resolve) {
      validTranslations.forEach(function(t, i) {
        $translateProvider.translations(t, translations[t]);
        if(validTranslations.length === i+1) resolve();
      })
    })
  }).then(function() {
    $translateProvider.preferredLanguage(getLanguage());
    $translateProvider.fallbackLanguage(LanguageType.EN);
    setLanguage();
  })
}]);

app.run(['$translate', function($translate) {
  setLanguage = function() {
    $translate.use(getLanguage());
    console.log('Language is set');
  }
}]);


app.controller('LoadingCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {

  $scope.settings = {}
  $scope.settings.background = "../../assets/images/xsg-loading5.png"
  $scope.detail = {}
  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess', function(event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations();
  });

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'endscreen.shutdown1',
        'endscreen.shutdown2',
        'endscreen.shutdown3'
      ]).then((o) => {
        $scope.detail.shutdown1 = $scope.ctrlTranslations['endscreen.shutdown1'] || "TENT Core is shutting down"
        $scope.detail.shutdown2 = $scope.ctrlTranslations['endscreen.shutdown2'] || "Please do not shutdown the computer"
        $scope.detail.shutdown3 = $scope.ctrlTranslations['endscreen.shutdown3'] || "until this window disappears."
        })
    })
  }

  $timeout(function(){
    $scope.detail.shutdown1 = $scope.ctrlTranslations['endscreen.shutdown1'] || "TENT Core is shutting down"
    $scope.detail.shutdown2 = $scope.ctrlTranslations['endscreen.shutdown2'] || "Please do not shutdown the computer"
    $scope.detail.shutdown3 = $scope.ctrlTranslations['endscreen.shutdown3'] || "until this window disappears."
  }, 0)
  $scope.getControllerTranslations();

  function filter_array(test_array) {
    var index = -1;
    var arr_length = test_array ? test_array.length : 0;
    var resIndex = -1;
    var result = [];

    while (++index < arr_length) {
        var value = test_array[index];

        if (value) {
            result[++resIndex] = value;
        }
    }

    return result;
  }

  function checkWallet()
  {
    var index = args.findIndex(function(e){return e == '-testnet'})
    if(index > -1)
    {
      port = $scope.settings.confData.rpcport != undefined ? $scope.settings.confData.rpcport : $scope.settings.serverData.testnet_rpcport
    }
    else
    {
      port = $scope.settings.confData.rpcport != undefined ? $scope.settings.confData.rpcport : $scope.settings.serverData.rpcport
    }
    var methods = 'getinfo'
    var arg = []

    var options = {
      url: "http://localhost:" + port,
      method: "post",
      headers:
      {
        "content-type": "text/plain"
      },
      auth: {
          user: $scope.settings.confData.rpcuser,
          pass: $scope.settings.confData.rpcpassword
      },
      body: JSON.stringify( {"jsonrpc": "1.0", "id": "getdata", "method": methods, "params": arg })
    }

    request(options, function(error, response, body) {
      console.log(body)
      var data = body
      try
      {
        data = JSON.parse(body)
      }
      catch(ex){}
      if(body == undefined)
      {
        setTimeout(closeApp, 2000)
      }
      else
      {
        setTimeout(stopDaemon, 2000)
      }
    })
  }

  function stopDaemon(){
      var index = args.findIndex(function(e){return e == '-testnet'})
      if($scope.settings == null || $scope.settings.confData == null ||
         $scope.settings == undefined || $scope.settings.confData == undefined)
      {
        setTimeout(closeApp, 2000)
      }
      else
      {
        if(index > -1)
        {
          port = $scope.settings.confData.rpcport != undefined ? $scope.settings.confData.rpcport : $scope.settings.serverData.testnet_rpcport
        }
        else
        {
          port = $scope.settings.confData.rpcport != undefined ? $scope.settings.confData.rpcport : $scope.settings.serverData.rpcport
        }
        var methods = 'stop'
        var arg = []

        curlData($scope.settings.confData.rpcuser, $scope.settings.confData.rpcpassword, port, methods, arg)
    }
  }

  function closeApp(){
    var arg = []
    electron.ipcRenderer.send('main-close-app', arg)
  }

  electron.ipcRenderer.on('child-stop-daemon', function(event, msgData) {
    $timeout(function(){
      console.log(msgData.msg)
      $scope.settings.data = msgData.msg[0]
      $scope.settings.confData = msgData.msg[1]
      $scope.settings.serverData = msgData.msg[2]
      stopDaemon()
    },0)
  })

  electron.ipcRenderer.on('child-change-language', function(event, msgData) {
    $timeout(function(){
      console.log("change language ----->" + msgData.msg)
      $translate.use(msgData.msg);
    },0)
  })

  function curlData(username, password, port, methods, params){
    var options = {
        url: "http://localhost:" + port,
        method: "post",
        headers:
        {
          "content-type": "text/plain"
        },
        auth: {
            user: username,
            pass: password
        },
        body: JSON.stringify( {"jsonrpc": "1.0", "id": "getdata", "method": methods, "params": params })
    };

    request(options, function(error, response, body) {
      setTimeout(checkWallet, 2000)
    })
  }
}])
