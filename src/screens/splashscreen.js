var app = angular.module('splashscreen', ['pascalprecht.translate'])
var electron = require('electron')
var fs = require('fs')
var fsextra = require('fs-extra')
var miningProcess = require('child_process')
var readLastLines = require('read-last-lines')
var ipc = electron.ipcRenderer
window.$ = window.jQuery = require("../../global/vendor/jquery/jquery.js");
var remote = require('electron').remote
var request = require('request')
var dialog = electron.remote.dialog
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

function getDebugFile(settings){
  return path.join(settings.datafolder, 'debug.log');
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

app.controller('SplashCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.detail = {}
  $scope.detail.hidedata = true
  $scope.detail.disableProgressbar = true
  $scope.detail.currentprocess = "Initializing"
  $scope.detail.appversion = ""
  $scope.detail.coins = undefined
  $scope.detail.currentCoin = undefined
  $scope.detail.hideSwitchCoin = true
  $scope.detail.linuxVersion = undefined
  $scope.detail.reindex = false
  $scope.detail.progressbarWidth = remote.getCurrentWindow().getBounds().width / 2
  $scope.oss = ["Ubuntu-16.04", "Ubuntu-18.04", "Ubuntu-20.04", "Others"]
  ipc.send('main-show-splash')
  var serverData
  var settings
  var confData
  var hideSplash = false
  var isStart = false
  $scope.detail.log = 'TENTCore'
  $timeout(function(){
    $scope.detail.hidedata = false
  },1000)


  $scope.ctrlTranslations = {}

  $rootScope.$on('$translateChangeSuccess', function(event, current, previous) {
    // Language has changed
    $scope.getControllerTranslations();
  });

  $scope.getControllerTranslations = function () {
    translationsAvailable().then(() => {
      $translate([
        'global.alert',
        'global.apply',
        'global.version',
        'settingsView.reindexWlt',
        'splashscreen.currentProcess',
        'splashscreen.ossOthers',
        'splashscreen.daemonLocation',
        'splashscreen.autoDaemonDownload',
        'splashscreen.dataFolder',
        'splashscreen.defaultDataLocation',
        'splashscreen.downloadErr1',
        'splashscreen.downloadErr2',
        'splashscreen.downloadErr3',
        'splashscreen.scopeUpdate1',
        'splashscreen.scopeUpdate2',
        'splashscreen.scopeUpdate3',
        'splashscreen.scopeUpdate4',
        'splashscreen.downloadErr4',
        'loadingView.selectBinaryFiles',
        'splashscreen.selectDataDir'
      ]).then((o) => {
          $scope.detail.currentprocess = o['splashscreen.currentProcess'];
          $scope.oss[2] = o['splashscreen.ossOthers'];
          $scope.ctrlTranslations = o;
        })
    })
  }

  $scope.getControllerTranslations();


  $scope.applyLocationAction = function(){
    if($scope.detail.daemonLocation == '' || $scope.detail.daemonLocation == undefined)
    {
      spawnMessage(MsgType.ALERT, $scope.ctrlTranslations['splashscreen.daemonLocation'])
    }
    else
    {
      ipc.send('main-update-data-loading', {type: UpdateDataType.APPLYLOCATION, data: $scope.detail.daemonLocation})
    }
  }

  $scope.cancelLocationAction = function(){
    spawnMessage({type: MsgType.AUTO_DOWNLOAD_DAEMON, text: $scope.ctrlTranslations['splashscreen.autoDaemonDownload'], title: ''})
  }

  $scope.selectLinux = function(version){
    ipc.send('main-update-data-loading', {type: UpdateDataType.SELECTLINUX, data: version})
  }

  $scope.openDaemon = function(){
    $scope.detail.disableSelectDaemon = true
    var dialogOptions;
    if(process.platform == 'win32')
    {
      dialogOptions= {
        filters: [
          { name: "Exe Files", extensions: ["exe"] },
        ],
        properties: ["openFile"]
      }
    }
    else if(process.platform == 'linux' || process.platform == 'darwin')
    {
      dialogOptions= {
        properties: ["openFile"]
      }
    }
    dialog.showOpenDialog(dialogOptions, function (fileNames) {
      $timeout(function(){
        $scope.detail.disableSelectDaemon = false
        if(fileNames === undefined){
          console.log("No file selected");
        }else{
          document.getElementById("daemon-file").value = $scope.detail.daemonLocation = fileNames[0];
        }
      },0)
    })
  }

  $scope.openDataDir = function(){
    $scope.detail.disableSelectDirectory = true
    var dialogOptions = {
      properties: ["openDirectory"]
    }
    dialog.showOpenDialog(dialogOptions, function (folder) {
      $timeout(function(){
        $scope.detail.disableSelectDirectory = false
        if(folder === undefined){
          console.log("No folder selected");
        }else{
          document.getElementById("data-dir").value = $scope.detail.dataLocation = folder[0];
        }
      }, 0)
    })
  }

  $scope.applyCustomDataAction = function(){
    if($scope.detail.dataLocation == '' || $scope.detail.dataLocation == undefined)
    {
      spawnMessage({type: MsgType.ALERT, text: $scope.ctrlTranslations['splashscreen.dataFolder']})
    }
    else
    {
      ipc.send('main-update-data-loading', {type: UpdateDataType.APPLYCUSTOMDATA, data: $scope.detail.dataLocation})
    }
  }

  $scope.canceCustomDataAction = function(){
    spawnMessage({type: MMsgType.CUSTOM_DATA, text: $scope.ctrlTranslations['splashscreen.defaultDataLocation'], title: ''})
  }

  $scope.btnAction = function(){
    console.log('go to download page')
    var shell = electron.shell
    shell.openExternal(serverData.walleturl)
    //close wallet
    var arg = []
    ipc.send('main-self-close', arg)
  }

  $scope.cancelAction = function(){
    ipc.send('main-update-data-loading', {type: UpdateDataType.NEWVERSION})
  }

  $scope.autoDownloadBlockchain = function(value){
    ipc.send('main-update-data-loading', {type: UpdateDataType.AUTODOWNLOADBLOCKCHAIN,data: value})
  }

  $scope.dependenciesAction = function(){
    ipc.send('main-update-data-loading', {type: UpdateDataType.DEPENDENCIESACTION})
  }

  $scope.daemonAction = function(){
    ipc.send('main-update-data-loading', {type: UpdateDataType.ERRORDAEMON, data: $scope.detail.text})
  }

  $scope.reindexAction = function(){
    var walletHome = getWalletHome()
    fs.writeFileSync(walletHome + "/commands.txt", '-reindex')
    ipc.send('main-update-data-loading', {type: UpdateDataType.RESTART, data: $scope.detail.text})
  }

  function spawnMessage(data)
  {
    if(data.type)
    {
      $timeout(function () {
        $scope.detail.title = data.title == undefined ? $scope.ctrlTranslations['global.alert'] + '!!!' : data.title
        $scope.detail.text = data.text
        $scope.detail.btnText = data.btnText == undefined ? $scope.ctrlTranslations['global.apply'] : data.btnText
        console.log(data.type)
        if(data.type == MsgType.ALERT)
        {
          $('#modalLoadingAlert').modal()
        }
        else if(data.type == MsgType.CONFIRMATION)
        {
          $('#modalLoadingNewVersion').modal()
        }
        else if(data.type == MsgType.UBUNTU_VERSION)
        {
          $('#modalUbuntuVersion').modal()
        }
        else if(data.type == MsgType.DAEMON_LOCATION)
        {
          $('#modalDaemonLocation').modal()
        }
        else if(data.type == MsgType.DEPENDENCIES)
        {
          $('#modalDependencies').modal()
        }
        else if(data.type == MsgType.SELECTCOIN)
        {
          $('#selectCoinAlert').modal()
        }
        else if(data.type == MsgType.SELECT_COIN_SETTINGS)
        {
          $('#selectCoinAlertSettings').modal()
        }
        else if(data.type == MsgType.AUTO_DOWNLOAD_DAEMON)
        {
          $('#autoDownloadDaemonModal').modal()
        }
        else if(data.type == MsgType.AUTO_DOWNLOAD_BLOCKCHAIN)
        {
          $('#autoDownloadBlockchainModal').modal()
        }
        else if(data.type == MsgType.LOADING_DAEMON)
        {
          if($scope.detail.text.toLowerCase().includes("reindex")){
            $scope.detail.reindex = true
          }
          else
          {
            $scope.detail.reindex = false
          }
          $('#modalLoadingDaemon').modal()
        }
        else if(data.type == MsgType.CUSTOM_DATA)
        {
          $('#customDataDir').modal()
        }
        else if(data.type == MsgType.DATA_LOCATION)
        {
          $('#modalDataLocation').modal()
        }
        else if(data.type == MsgType.MASTERNODE_OPTION)
        {
          $('#masternodeOption').modal()
        }
      }, 1000)
    }
  }

  function downloadFile(data) {
    var url = data.url.replace("https:\\", "https://");
    console.log('downloading ' + url)
    console.log(data.saveFolder)
    if(!fs.existsSync(data.saveFolder))
    {
      fs.mkdirSync(data.saveFolder);
    }
    var saveFile = data.saveFolder + "/" + data.name + ".zip";
    downloadFileInside(data.url, saveFile)
    console.log(saveFile);
    function downloadFileInside(file_url , targetPath){
      // Save variable to know progress
      var received_bytes = 0;
      var total_bytes =   0;
      req = request({
        method: 'GET',
        uri: file_url
      });

      var out = fs.createWriteStream(targetPath);
      var stream = req.pipe(out);

      //finish downloading
      stream.on('finish', function(){
        //enable flag
        finishStream = true;
        $timeout(function(){
          $scope.detail.disableProgressbar = true
        },0)
        setTimeout(function(){
          downloadTimerFunction()
        }, 3000);
      });

      req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        total_bytes = parseInt(data.headers['content-length' ]);
      });

      req.on('data', function(chunk) {
        // Update the received bytes
        received_bytes += chunk.length;

        showProgress(received_bytes, total_bytes);
      });

      req.on('error', function (err){
        fs.unlink(saveFile);
        $timeout(function(){
          $scope.detail.disableProgressbar = true
        },0)

        spawnMessage({type: MsgType.ALERT, text: $scope.ctrlTranslations['splashscreen.downloadErr1'] || "Downloading error, restarting wallet"})
      });

      function moveFiles(dir){
        var files = fs.readdirSync(dir)

        files.forEach(element => {
          try
          {
            var files2 = fs.readdirSync(dir + '/' + element)
            files2.forEach(e => {
              fs.copyFileSync(dir + '/' + element + '/' + e, dir + '/' + e)
            })
            fsextra.removeSync(dir + '/' + element);
          }
          catch(ex){console.log(ex)}
        });
      }

      function downloadTimerFunction(){
        $timeout(function(){
          updateScope(($scope.ctrlTranslations['splashscreen.scopeUpdate1'] || "Extracting file") + '...')
          $scope.detail.disableProgressbar = false
          $scope.detail.progress = 0
          $scope.detail.width = '0%'

          //extracting text
          if(received_bytes ==  total_bytes)
          {
            var unzipper = new DecompressZip(saveFile);

            // Add the error event listener
            unzipper.on('error', function (err) {
              $timeout(function(){
                fs.unlinkSync(saveFile);
                spawnMessage({ type: MsgType.ALERT, text: ($scope.ctrlTranslations['splashscreen.downloadErr2'] || "Download files error, please restart wallet") + ' ' + err.message})
                $scope.detail.disableProgressbar = true
              },0)
            });

            // Notify when everything is extracted
            unzipper.on('extract', function (log) {
              $timeout(function(){
                $scope.detail.disableProgressbar = true
                moveFiles(data.saveFolder)

                if(data.step == Steps.DOWNLOAD_PARAMS || data.step == Steps.DOWNLOAD_DAEMON) {
                  fs.unlinkSync(saveFile)
                  ipc.send('main-update-data-loading', {type: UpdateDataType.CHECKDAEMON})
                }
                else if(data.step == Steps.CHECK_LANGUAGE) {
                  var hash = md5File.sync(saveFile)
                  fs.writeFileSync(getLanguageChecksumLoc(), hash)
                  fs.unlinkSync(saveFile)
                  ipc.send('main-update-data-loading', {type: UpdateDataType.RESTART})
                }
              },0)
            });

            // Notify "progress" of the decompressed files
            unzipper.on('progress', function (fileIndex, fileCount) {
              $timeout(function(){
                var percentage = (parseFloat(fileIndex + 1) / fileCount * 100).toFixed(2)
                updateScope(($scope.ctrlTranslations['splashscreen.scopeUpdate1'] || "Extracting file") + ' (' + percentage + '%)')
                $scope.detail.progress = percentage
                $scope.detail.width = percentage + '%'
              },0)
            });

            // Start extraction of the content
            unzipper.extract({
              path: data.saveFolder
            });
          }
          else
          {
            $scope.detail.disableProgressbar = true
          }
        },0)
      }

      function showProgress(received, total){
        var percentage = (received * 100) / total;
        $timeout(function(){
          updateScope(($scope.ctrlTranslations['splashscreen.scopeUpdate2'] || "Downloading") + ' ' + data.name + ' (' + (received / 1024 / 1024).toFixed(2) + "MB/ " + (total / 1024 / 1024).toFixed(2) + "MB)")
          $scope.detail.disableProgressbar == true ? $scope.detail.disableProgressbar = false : ''
          $scope.detail.progress = percentage
          $scope.detail.width = percentage.toFixed(2) + '%'
        },0)
      }
    }
  }

  function downloadBlockchain(data)
  {
    if(data.checksum)
      {
        updateScope($scope.ctrlTranslations['splashscreen.scopeUpdate3'] + '...')
        var files = JSON.parse(JSON.stringify(data)).files
        var values = Object.values(files)
        var actions = values.map(checkHash);
        var results = Promise.all(actions);
        var arr = {}
        results.then(function(resdata){
          resdata.forEach(function(element){
            var keys = Object.keys(element)
            arr[keys[0]] = element[keys[0]]
          })

          var keys = Object.keys(data.checksum)
          keys.forEach(function(element){
            if(arr[element] && data.checksum[element].toLowerCase() == arr[element].toLowerCase())
            {
              delete files[element]
            }
          })
          startDownload()
        })
      }
      else
      {
        startDownload()
      }

      function checkHash(url)
      {
        var name = getNameFromUrl(url)
        if(fs.existsSync(data.saveFolder + '/' + name))
        {
          return new Promise(function(resolve){
            md5File(data.saveFolder + '/' + name, function(err, hash) {
              var temp = {}
              temp[name] = hash
              resolve(temp)
            })
          })
        }
        else
        {
          var temp = {}
          temp[name] = undefined
          return temp
        }
      }

      function startDownload()
      {
        if(Object.keys(files).length > 0)
        {
          url = Object.values(files)[0]
          delete files[Object.keys(files)[0]]
          console.log('downloading ' + url)
          console.log(data.saveFolder)
          name = getNameFromUrl(url)
          if(!fs.existsSync(data.saveFolder))
          {
            fs.mkdirSync(data.saveFolder);
          }
          var saveFile = data.saveFolder + "/" + name;
          downloadFileInside(url, saveFile, name)
          console.log(saveFile);
        }
        else
        {
          $timeout(function(){
            $scope.detail.disableProgressbar = true
          },0)
          setTimeout(function(){
            downloadTimerFunction(true)
          }, 3000);
        }
      }

      function downloadFileInside(file_url , targetPath, name){
        // Save variable to know progress
        var received_bytes = 0;
        var total_bytes =   0;
        req = request({
          method: 'GET',
          uri: file_url
        });

        var out = fs.createWriteStream(targetPath);
        var stream = req.pipe(out);

        //finish downloading
        stream.on('finish', function(){
          //enable flag
          if(Object.keys(files).length == 0)
          {
            finishStream = true;
            $timeout(function(){
              $scope.detail.disableProgressbar = true
            },0)
            setTimeout(function(){
              downloadTimerFunction()
            }, 3000);
          }
          else
          {
            url = Object.values(files)[0]
            delete files[Object.keys(files)[0]]
            console.log('downloading ' + url)
            console.log(data.saveFolder)
            name = getNameFromUrl(url)
            var saveFile = data.saveFolder + "/" + name;
            downloadFileInside(url, saveFile, name)
          }
        });

        req.on('response', function ( data ) {
          // Change the total bytes value to get progress later.
          total_bytes = parseInt(data.headers['content-length' ]);
        });

        req.on('data', function(chunk) {
          // Update the received bytes
          received_bytes += chunk.length;

          showProgress(received_bytes, total_bytes, name);
        });

        req.on('error', function (err){
          $timeout(function(){
            $scope.detail.disableProgressbar = true
          },0)

          spawnMessage({type: MsgType.ALERT, text: $scope.ctrlTranslations['splashscreen.downloadErr3']})
        });
      }

      function downloadTimerFunction(allFilesOk) {

        updateScope($scope.ctrlTranslations['splashscreen.scopeUpdate4'] + '...')
        var splitFile = require('split-file');
        var saveFile = data.saveFolder + '/' + data.outputFile
        var fileName = []
        if(Object.values(data.files).length > 0 || allFilesOk)
        {
          Object.values(data.files).forEach(function(element){
            var splits = element.split('/')
            fileName.push(data.saveFolder + '/' + splits[splits.length - 1])
          });
          splitFile.mergeFiles(fileName, saveFile)
          .then(function(){
            $timeout(function(){
              updateScope($scope.ctrlTranslations['splashscreen.scopeUpdate1'])
              $scope.detail.disableProgressbar = false
              $scope.detail.progress = 0
              $scope.detail.width = '0%'

              //extracting text
              // {
              //   var unzipper = new DecompressZip(saveFile);

              //   // Add the error event listener
              //   unzipper.on('error', function (err) {
              //     $timeout(function(){
              //       console.log(err)
              //       spawnMessage({type: MsgType.ALERT, text: $scope.ctrlTranslations['splashscreen.downloadErr4'] + ' ' + err.message})
              //       $scope.detail.disableProgressbar = true
              //     },0)
              //   });

              //   // Notify when everything is extracted
              //   unzipper.on('extract', function (log) {
              //     $timeout(function(){
              //       $scope.detail.disableProgressbar = true
              //       fs.unlinkSync(saveFile)
              //       fileName.forEach(function(element){
              //         var saveFile = data.saveFolder + "/" + getNameFromUrl(element);
              //         fs.unlinkSync(saveFile);
              //       });
              //       ipc.send('main-update-data-loading', {type: UpdateDataType.STARTDAEMON})
              //     },0)
              //   });

              //   // Notify "progress" of the decompressed files
              //   unzipper.on('progress', function (fileIndex, fileCount) {
              //     $timeout(function(){
              //       var percentage = (parseFloat(fileIndex + 1) / fileCount * 100).toFixed(2)
              //       updateScope($scope.ctrlTranslations['splashscreen.scopeUpdate1'] + ' (' + percentage + '%)')
              //       $scope.detail.progress = percentage
              //       $scope.detail.width = percentage + '%'
              //     },0)
              //   });

              //   // Start extraction of the content
              //   unzipper.extract({
              //     path: data.saveFolder
              //   });
              // }
              var percentage = 0
              var isFinished = false
              function setPercentage(){
                percentage += 1
                $scope.detail.width = percentage + '%'
                if(percentage >= 100)
                {
                  percentage = 0
                }
                if(!isFinished){
                  $timeout(function(){
                    setPercentage();
                  }, 200)
                }
              }

              $timeout(function(){
                setPercentage();
              }, 200)

              var unzip = require("unzip-stream")
              fs.createReadStream(saveFile).pipe(unzip.Extract({ path: data.saveFolder }).on('entry', function (entry) {
                console.log(entry)
              }))
              .on('close', function () {
                $timeout(function(){
                  isFinished = true
                  $scope.detail.disableProgressbar = true
                  fs.unlinkSync(saveFile)
                  fileName.forEach(function(element){
                    var saveFile = data.saveFolder + "/" + getNameFromUrl(element);
                    fs.unlinkSync(saveFile);
                  });
                  ipc.send('main-update-data-loading', {type: UpdateDataType.STARTDAEMON})
                },0)
              });
            },0)
          })
          .catch(function(err){
            console.log('Error: ', err);
          });
        }
        else
        {
          ipc.send('main-update-data-loading', {type: UpdateDataType.STARTDAEMON})
        }
      }

      function showProgress(received, total, name){
        var percentage = (received * 100) / total;
        $timeout(function(){
          updateScope($scope.ctrlTranslations['splashscreen.scopeUpdate2'] + ' ' + name + ' (' + (received / 1024 / 1024).toFixed(2) + "MB/ " + (total / 1024 / 1024).toFixed(2) + "MB)")
          $scope.detail.disableProgressbar == true ? $scope.detail.disableProgressbar = false : ''
          $scope.detail.progress = percentage
          $scope.detail.width = percentage.toFixed(2) + '%'
        },0)
      }
  }

  function updateScope(scope)
  {
    $timeout(function(){
      $scope.detail.currentprocess = scope.split('...')[0]
    }, 0)
  }
  $scope.selectCoin = function(coin){
    ipc.send('main-update-data-loading', {type: UpdateDataType.SELECTCOIN, data: coin})
  }

  $scope.selectCoinSettings = function(coin){
    ipc.send('main-update-data-loading', {type: UpdateDataType.SELECTCOINSETTINGS, data: coin})
  }

  $scope.indexData = function() {
    ipc.send('main-update-data-loading', {type: UpdateDataType.DATATYPE, data: true})
  }

  $scope.noindexData = function() {
    ipc.send('main-update-data-loading', {type: UpdateDataType.DATATYPE, data: false})
  }

  $scope.autoDownload = function(value){
    if(value == true)
    {
      ipc.send('main-update-data-loading', {type: UpdateDataType.AUTODOWNLOAD, data: true})
    }
    else
    {
      spawnMessage({type: MsgType.DAEMON_LOCATION,text: undefined, btnText: undefined, title: $scope.ctrlTranslations['loadingView.selectBinaryFiles']})
    }
  }

  $scope.customData = function(value){
    if(value == false)
    {
      ipc.send('main-update-data-loading', {type: UpdateDataType.CUSTOMDATA, data: false})
    }
    else
    {
      spawnMessage({type: MsgType.DATA_LOCATION,text: '', title: $scope.ctrlTranslations['splashscreen.selectDataDir']})
    }
  }

  $scope.debuggingAction = function(){
    ipc.send('main-show-debuggingscreen')
  }

  electron.ipcRenderer.on('child-update-settings', function(event, msgData){
    $timeout(function(){
      serverData = msgData.msg[2]
      settings = msgData.msg[0]
      confData = msgData.msg[1]
      if (serverData && serverData.linuxoss) $scope.oss = serverData.linuxoss
    },0)
  })

  electron.ipcRenderer.on('child-resize-screen', function(event, msgData){
    $timeout(function(){
      if(!$scope.detail.disableProgressbar)
      {
        $scope.detail.progressbarWidth = remote.getCurrentWindow().getBounds().width / 2
      }
    },0)
  })

  electron.ipcRenderer.on('child-app-version', function(event, msgData){
    $timeout(function(){
      console.log(msgData)
      $scope.detail.appversion = ($scope.ctrlTranslations['global.version'] || "Version") + ' ' + msgData.msg
      $scope.detail.hidedata = false
    },0)
  })

  electron.ipcRenderer.on('child-update-scope', function(event, msgData){
    $timeout(function(){
      updateScope(msgData.msg)
    },0)
  })

  electron.ipcRenderer.on('child-show-popup', function(event, msgData){
    $timeout(function(){
      spawnMessage(msgData.msg)
    },0)
  })

  electron.ipcRenderer.on('child-update-data-splash', function(event, msgData){
    $timeout(function(){
      if(msgData.msg.type == UpdateDataType.COINLIST)
      {
        $scope.detail.hideSwitchCoin = false
        $scope.detail.coins = msgData.msg.data
        $scope.detail.currentCoin = msgData.msg.currentCoin
      }
      else if(msgData.msg.type == UpdateDataType.DOWNLOADBLOCKCHAIN)
      {
        downloadBlockchain(msgData.msg.data)
      }
      else if(msgData.msg.type == UpdateDataType.DOWNLOADFILE)
      {
        downloadFile(msgData.msg.data)
      }
      else if(msgData.msg.type == UpdateDataType.SELECTCOINSETTINGS)
      {
        spawnMessage(msgData.msg.data)
      }
    },0)
  })

  electron.ipcRenderer.on('child-close-splashscreen', function(event, msgData){
    hideSplash = true
  })

  electron.ipcRenderer.on('child-start-wallet', function(event, msgData){
    isStart = true
  })

}])
