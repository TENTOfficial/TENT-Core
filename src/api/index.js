var app = angular.module('tentcore', ['pascalprecht.translate'])
var miningProcess = require('child_process')
var StackTrace = require('stacktrace-js')
var autoLaunch = require('auto-launch');
var exec = require('child_process').exec
var fs = require('fs')
var fsextra = require('fs-extra')
var electron = require('electron')
var remote = require('electron').remote
var QRCode = require('qrcode')
var request = require('request')
var http = require('http')
var https = require('https')
var shell = require('electron').shell;
var publicIp = require('public-ip')
var path = require('path')
var dialog = electron.remote.dialog
//telegram
var TelegramBot = require('node-telegram-bot-api');
//discord
var Discord = require('discord.js');
var isDevMode = process.execPath.match(/[\\/]electron/)
var isInit = true
var isSynced = false
var child
var childDaemon
var allData
var helpData
var getinfoData
var z_sendmanyData
var sendToAddress
var feeData
var z_getoperationstatusData
var z_shieldcoinbaseData
var validateaddressData
var masternodelistData
var masternodeoutputsData
var masternodegenkeyData
var importprivkeyData
var dumpprivkeyData
var startmasternodeData
var getPeerInfoData
var getDebugData
var getNewAddressData
var mnbudgetShowData
var mnbudgetVoteData
var encryptData
var changePassData
var lockData
var unlockData
var apiStatus = {}
var listtransactions
var listtransactionstime
var shouldGetTransaction = false
var shouldGetWallet = false
var shouldGetAll = true
var sendingCoin
var w;
var localMNs = []
var isRestarting = false
var startaliasData
var ipc = electron.ipcRenderer
var settings = undefined
var currentCoin
var coinList = {}
var autoLauncher
var progName
var explorer = "https://explorer.tent.app/"
var args = remote.process.argv
var serverData = undefined
var confData = undefined
var lastBlock
var lastBalance
var lastTotalBalance
var bot
var balance
var priceandsymbol
var transactions
var addrBook
var isBotCmd
electron.ipcRenderer.send('main-app-version', appVersion)

// Get translation files
let gotTranslations = false
let translations = {}
const validTranslations = ['ae', 'cn', 'cz', 'de', 'en', 'es', 'fr', 'hu', 'it', 'kr', 'nl', 'pl', 'ro', 'ru', 'tr']
const getTranslations = new Promise(function(resolve, reject) {
    validTranslations.forEach((t, i) => {
      fs.readFile(path.join(getLanguageDir(), `${t}.json`), (err, data) => {
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

args.splice(0,1)
if(args[0] == '.')
{
  args.splice(0,1)
}
// args = ['-testnet']
// {
//   var execPath = process.execPath.replace(/\\/g, "/")
//   var split = execPath.split('/')
//   var currLoc = execPath.split('/' + split[split.length - 1])[0]
//   var split = execPath.split('/')
//   progName = split[split.length - 1].split(' ')[0]
//   if(process.platform == 'win32')
//   {
//       autoLauncher = new autoLaunch({
//           name: 'TENTCore',
//           path: currLoc.replace('/', /\\/g) + "\\" + "TENTCore.exe",
//       });
//   }
//   else if(process.platform == 'linux')
//   {
//       autoLauncher = new autoLaunch({
//           name: 'TENTCore',
//           path: currLoc + "/" + "TENTCore",
//       });
//   }
//   else if(process.platform == 'darwin')
//   {
//       autoLauncher = new autoLaunch({
//           name: 'TENTCore',
//           path: currLoc + "/" + "TENTCore.app",
//       });
//   }
// }

window.$ = window.jQuery = require("../../global/vendor/jquery/jquery.js");
window.Chartist =  require("../../global/vendor/chartist/chartist.js");


//open links externally by default
$(document).on('click', 'a[href^="https"]', function(event) {
  event.preventDefault();
  shell.openExternal(this.href);
});

function handleFunction(data)
{
  // writeLog('handleFunction')
  ipc.send('main-update-data', data)
}

function handleFunctionZcash(data)
{
  // writeLog('handleFunction zcash')
  if(data.key == 'getinfo')
  {
    ipc.send('main-get-data-zcash', data)
  }
  else if(data.key == 'getwalletinfo')
  {
    ipc.send('main-get-data-zcash', data)
  }
  else if(data.key == 'z_gettotalbalance')
  {
    ipc.send('main-get-data-zcash', data)
  }
  else if(data.key == 'getblockchaininfo')
  {
    ipc.send('main-get-blockchain-info-zcash', data)
  }
  else if(data.key == 'getblockheader')
  {
    ipc.send('main-get-block-header-zcash', data)
  }
  else if(data.key == 'listtransactions')
  {
    ipc.send('main-list-transactions-zcash', data)
  }
  else if(data.key == 'getaddressesbyaccount')
  {
    ipc.send('main-get-address-by-account-zcash', data)
  }
  else if(data.key == 'listaddressgroupings')
  {
    ipc.send('main-list-address-groupings-zcash', data)
  }
  else if(data.key == 'z_listaddresses')
  {
    ipc.send('main-z-list-address-zcash', data)
  }
  else if(data.key == 'validateaddress')
  {
    ipc.send('main-validate-address-zcash', data)
  }
  else if(data.key == 'z_validateaddress')
  {
    ipc.send('main-z-validate-address-zcash', data)
  }
  else if(data.key == 'z_getbalance')
  {
    ipc.send('main-z-get-balance-zcash', data)
  }
  else if(data.key == 'listreceivedbyaddress')
  {
    ipc.send('main-list-received-by-address-zcash', data)
  }
  else if(data.key == 'z_exportwallet')
  {
    ipc.send('main-exportwallet', data)
  }
  else
  {
    writeLog("zcash not supported")
  }
}

function spawnErr(input)
{
  //@TODO comment to test
  if(isDevMode || betaTest)
  {
    if(!input.includes("Cannot obtain a lock"))
    {
      Error.stackTraceLimit = 10

      // var line
      var callback = function(stackframes) {
        var stringifiedStack = stackframes.map(function(sf) {
          return sf.toString();
        }).join('\n');

        var data = stringifiedStack.split('\n')[1] + ": " + input

        var split = data.split('/')

        data = split[0] + ' ' + split[split.length - 1]

        if (process.env.NODE_ENV == 'production') {
          var arg = [input]
          ipc.send('main-spawn-error', arg)
        } else {
          var arg = [data]
          ipc.send('main-spawn-error', arg)
        }
      }
    }

    var errback = function(err) { console.log(err.message); };

    var error = new Error(input);

    StackTrace.fromError(error).then(callback).catch(errback);
  }
  else
  {
    var arg = [input]
    ipc.send('main-spawn-error', arg)
  }
}

function spawnData(data)
{
  alert(data)
}

function getToolVersion(dir)
{
  if(!fs.existsSync(dir))
  {
    fs.mkdirSync(dir);
    return null;
  }
  else
  {
    var versionFile = dir + "/version.txt";
    if(!fs.existsSync(versionFile))
    {
      return null;
    }
    else
    {
      return fs.readFileSync(versionFile, "utf8");
    }
  }
}

function getParamsHome(serverData) {
  var dataFolder = process.env[(process.platform == 'win32') ? 'APPDATA' : 'HOME']
  if (process.platform == 'win32') {
    dataFolder += serverData.params.win32
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }
  } else if (process.platform == 'linux') {
    dataFolder += serverData.params.linux
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }
  } else if (process.platform == 'darwin'){
    dataFolder += serverData.params.darwin
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }
  }
  return dataFolder
}

function getHome()
{
  var dataFolder = process.env[(process.platform == 'win32') ? 'APPDATA' : 'HOME']
  return dataFolder
}

function getWalletHome(isGetConfig, coin) {
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

  if(isGetConfig == true)
  {
    //do nothing
  }
  else
  {
    dataFolder += "/" + coin
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }
  }
  return dataFolder.replace(/\\/g, "/")
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
  return path.join(getWalletHome(true), "lang.checksum")
}

function getUserHome(serverData, settings) {
  var dataFolder = process.env[(process.platform == 'win32') ? 'APPDATA' : 'HOME']
  if (process.platform == 'win32') {
    dataFolder += serverData.data.win32
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }
  } else if (process.platform == 'linux') {
    dataFolder += serverData.data.linux
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }
  } else if (process.platform == 'darwin') {
    //@TODO update darwin location
    dataFolder += serverData.data.darwin
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }
  }
  var index = args.findIndex(function(e){return e == '-testnet'})
  if(index > -1)
  {
    dataFolder += serverData.testnetfolder == undefined ? "/testnet3" : serverData.testnetfolder
  }
  if(settings != undefined && settings.datafolder != undefined && settings.datafolder != dataFolder.replace(/\\/g, "/"))
  {
    if (!fs.existsSync(settings.datafolder)) {
      fs.mkdirSync(settings.datafolder)
    }
    return settings.datafolder
  }
  else
  {
    return dataFolder.replace(/\\/g, "/")
  }
}

function makeRandom(count) {
  var text = ""
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

  for (var i = 0; i < count; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))

  return text
}

function backgroundProcess(name, arg) {
  var loc = name.replace(/\\/g, "/")

  var temp = arg.slice()
  if(temp[0] == '-testnet')
  {
    temp.splice(0,1)
  }
  if(arg[0] == 'z_getoperationstatus')
  {
    arg.splice(2,1)
  }
  else if(arg[0] == '-testnet' && arg[1] == 'z_getoperationstatus')
  {
    arg.splice(3,1)
  }
  else if(arg[0] == 'getdebug')
  {
    arg.splice(0, 1)
  }
  else if(arg[0].includes('validateaddress'))
  {
    if(arg.length > 2)
    {
      arg.splice(2, 1)
    }
  }
  // writeLog(arg)
  // writeLog(temp)
  var rtnData = {};

  if (fs.existsSync(loc)) {
    try {
      if (process.platform == 'linux' || process.platform == 'darwin') {
        var temparg = ["+x", loc]
        miningProcess.spawnSync("chmod", temparg)
      }

      child = miningProcess.spawn(loc, arg)

      child.stdout.on('data', function(data) {
        var strOutput = String(data)
        if (strOutput.startsWith("Error"))
        {
          writeLog("stroutput error")
          spawnErr(strOutput)
        }
        else
        {
          if(rtnData['value'] == undefined)
          {
            rtnData['key'] = temp[0]
            rtnData['arg'] = temp
            rtnData['value'] = strOutput
          }
          else
          {
            rtnData['value'] += strOutput
          }
        }
      })

      child.stderr.on('data', function(data) {
        var strOutput = String(data)
        if(rtnData['value'] == undefined)
          {
            rtnData['key'] = temp[0]
            rtnData['arg'] = temp
            rtnData['value'] = strOutput
          }
          else
          {
            rtnData['value'] += strOutput
          }
      })

      child.on('close', function(code){
        return handleFunction(rtnData)
      })

    } catch (err) {
      setTimeout(function(){
        writeLog("cannot start snowgem-cli")
        spawnErr("Cannot start " + loc + err.toString())
      }, 0)
    }
  } else {
    writeLog("cannot find snowgem-cli")
    spawnErr("Cannot find " + loc)
  }
}

function backgroundProcessDaemon(name, arg) {
  var loc = name.replace(/\\/g, "/")
  var rtnData = {};

  // writeLog(arg)

  if (fs.existsSync(loc)) {
    try {
      if (process.platform == 'linux' || process.platform == 'darwin') {
        var temparg = ["+x", loc]
        miningProcess.spawn("chmod", temparg)
      }

      //childDaemon = miningProcess.spawn(loc, arg)
      childDaemon = miningProcess.spawn(loc, arg, {
        detached: true,
        stdio: [ 'pipe', 'pipe', 'pipe' ]
      });

      childDaemon.unref();

      var dataSend = {}
      dataSend['status'] = true
      electron.ipcRenderer.send('main-loading-screen', dataSend)

      childDaemon.stderr.pipe(process.stdout);

      childDaemon.stdout.on('data', function(data) {
        var strOutput = String(data)
        writeLog("strOutput")
        if (strOutput.startsWith("Error")) {
          writeLog("stroutput error")
          setTimeout(function(){
            spawnErr(strOutput)
          }, 0)
        }
      })

      childDaemon.stderr.on('data', function(data) {
        var strOutput = String(data)
        setTimeout(function(){

            //stop wallet
            if(!strOutput.includes('Cannot obtain a lock on data directory'))
            {
              writeLog(strOutput)
              spawnErr(strOutput)
            }
            // else
            // {
            //   dataSend['status'] = true
            //   electron.ipcRenderer.send('main-loading-screen', dataSend)
            // }
        }, 0)
      })

      childDaemon.stdin.on('error', function(code) {
        var strOutput = String(code)

        setTimeout(function(){
          writeLog("cannot start daemon 1")
          spawnErr("Cannot start " + loc)
          //stop wallet
          // var dataSend = {}
          // dataSend['status'] = false
          // electron.ipcRenderer.send('main-loading-screen', dataSend)

        }, 0)
      })
    } catch (err) {
      setTimeout(function(){
        writeLog("cannot start daemon 2")
        spawnErr("Cannot start " + loc + "\n" + String(err))

        //stop wallet
        var dataSend = {}
        dataSend['status'] = false
        electron.ipcRenderer.send('main-loading-screen', dataSend)
      }, 0)
    }
  } else {
    writeLog("cannot find daemon 2")
    spawnErr("Cannot find " + loc)
    var dataSend = {}
    dataSend['status'] = false
    electron.ipcRenderer.send('main-loading-screen', dataSend)
  }
}

function startDeamon(arg){
  writeLog("\n\n\nSTART wallet")
  backgroundProcessDaemon(settings.daemon, arg)
}

// function startCli(arg){
//   var tempArg = []
//   var index = args.findIndex(function(e){return e == '-testnet'})
//   if(index > -1)
//   {
//     tempArg.push('-testnet')
//   }
//   tempArg = tempArg.concat(arg)
//   backgroundProcess(settings.cli, tempArg)
// }

function startCli(arg, coinType){
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var tempArg = []
  var index = args.findIndex(function(e){return e == '-testnet'})
  if(confData != undefined)
  {
    if(index > -1)
    {
      port = confData.rpcport != undefined ? confData.rpcport : serverData.testnet_rpcport
    }
    else
    {
      port = confData.rpcport != undefined ? confData.rpcport : serverData.rpcport
    }
    var methods = arg[0]
    arg.splice(0,1)

    curlData(confData.rpcuser, confData.rpcpassword, port, methods, arg, coinType)
  }
}

function getFunctionName(stack){

  var split = stack.split('\n')
  split = split[2].split('at ')
  split = split[1].split(' (')
  return split[0]
}
function writeLog(input) {
  if(isDevMode || betaTest)
  {
    Error.stackTraceLimit = 10

    // var line
    var callback = function(stackframes) {
      var stringifiedStack = stackframes.map(function(sf) {
        return sf.toString();
      }).join('\n');

      if(typeof input == 'string')
      {
        var data = stringifiedStack.split('\n')[1] + ": "
        var split = data.split('/')

        data = split[0] + ' ' + split[split.length - 1]  + input
        console.log(data)
      }
      else
      {
        var data = stringifiedStack.split('\n')[1] + ": "
        var split = data.split('/')
        data = split[0] + ' ' + split[split.length - 1]
        console.log(data)
        console.log(input)
      }
    }

    var errback = function(err) { console.log(err.message); };

    var error = new Error(input);

    StackTrace.fromError(error).then(callback).catch(errback);
  }
  else
  {
    if(settings != undefined && settings.enablelog)
    {
      function getTime(){
        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        return date+' '+time;
      }

      var file = getWalletHome(false, currentCoin) + '/debug.log'

      if (fs.existsSync(file)) {
        var stats = fs.statSync(file)
        var fileSizeInBytes = stats.size
          //Convert the file size to megabytes (optional)
        var fileSizeInMegabytes = fileSizeInBytes / 1000000.0
        if (fileSizeInMegabytes > 10) {
          fs.unlink(file, function(err) {
            if (err) throw err
            console.log('Deleted!')
          })
        }
      }

      if(typeof input == 'string')
      {
        fs.appendFileSync(file, getTime() + " " + input + '\n')
      }
      else
      {
        fs.appendFileSync(file, getTime() + " " + JSON.stringify(input, null, 2) + '\n')
      }
    }
  }
}

function startWallet(arg) {
  var desktop = require('path').join(require('os').homedir(), 'desktop')
  desktop = '-exportdir=' + desktop
  arg.push(desktop)
  // writeLog(arg)
  startDeamon(arg)
}

function stopWallet() {
  var arg = ['stop']
  startCli(arg)
}

function checkWallet()
{
    var arg = [ "getinfo" ]
    startCli(arg)
}

function getAllData(type, transacionType)
{
  var arg = [ "getalldata", type]
  if(transacionType != undefined)
  {
    arg.push(transacionType)
  }
  if(apiStatus['getalldata'] == false || apiStatus['getalldata'] == undefined)
  {
    // writeLog(arg)
    apiStatus['getalldata'] = true
    startCli(arg)
  }
  else
  {
    writeLog('getting data, do not start another one')
  }
}

function getPeerInfo()
{
  var arg = [ "getpeerinfo"]
  // writeLog(arg)
  startCli(arg)
}

function getNetworkHeight(coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = [ "getinfo"]
  // writeLog(arg)
  startCli(arg, coinType)
}

function getBestBlockhash(coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = ["getblockchaininfo"]
  // writeLog(arg)
  startCli(arg, coinType)
}

function getBestTime(bloblockHashckhash, coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = [ "getblockheader", bloblockHashckhash]
  // writeLog(arg)
  startCli(arg, coinType)
}

function zGetTotalBalance(coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = [ "z_gettotalbalance"]
  // writeLog(arg)
  startCli(arg, coinType)
}

function getWalletInfo( coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = [ "getwalletinfo"]
  // writeLog(arg)
  startCli(arg, coinType)
}

function getUnconfirmedBalance()
{
  var arg = [ "getunconfirmedbalance"]
  // writeLog(arg)
  startCli(arg)
}

function checkConnections()
{
  var arg = [ "getconnectioncount"]
  // writeLog(arg)
  startCli(arg)
}

function getAddressBalance(address, coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = [ "z_getbalance", address]
  // writeLog(arg)
  startCli(arg, coinType)
}

function newAddress()
{
  getNewAddressData = undefined
  var arg = [ "getnewaddress"]
  // writeLog(arg)
  startCli(arg)
}

function newZAddress(sapling)
{
  getNewAddressData = undefined
  var arg = [ "z_getnewaddress"]
  if(sapling != undefined)
  {
    arg.push("sapling")
  }
  else
  {
    arg.push("sprout")
  }
  // writeLog(arg)
  startCli(arg)
}

function getDebug(request)
{
  writeLog(request)
  var arr = request.split(' ')
  arr = arr.filter(function(n){ return n != '' })
  var arg = ['getdebug']
  arg = arg.concat(arr)
  startCli(arg)
}

function exportPrivateKeys(filename)
{
  var arg = [ "z_exportwallet", filename]
  // writeLog(arg)
  startCli(arg)
}

function importPrivateKeys(filename)
{
  var arg = [ "z_importwallet " + "\"" + filename + "\""]
  // writeLog(arg)
  startCli(arg)
}

function exportPrivateKey(address)
{
  var arg = [ "dumpprivkey", address]
  // writeLog(arg)
  startCli(arg)
}

function z_exportPrivateKey(address)
{
  var arg = [ "z_exportkey", address]
  // writeLog(arg)
  startCli(arg)
}

function importPrivateKey(key, label, fRescan)
{
  var arg = [ "importprivkey", key]
  if(label != undefined)
  {
    arg.push(label)
  }
  // else
  // {
  //   arg.push("")
  // }
  // if(fRescan != undefined)
  // {
  //   arg.push(fRescan)
  // }
  // writeLog(arg)
  startCli(arg)
}

function z_importPrivateKey(key, fRescan, rescanBlock)
{
  var arg = [ "z_importkey", key]
  // if(fRescan != undefined)
  // {
  //   arg.push(fRescan)
  // }
  // else
  // {
  //   arg.push(false)
  // }
  // if(rescanBlock != undefined)
  // {
  //   arg.push(rescanBlock)
  // }
  // else
  // {
  //   arg.push(0)
  // }
  // writeLog(arg)
  startCli(arg)
}

function listTransactions(count, coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = [ "listtransactions", "", count]
  // writeLog(arg)
  startCli(arg, coinType)
}

function listReceivedByAddress(coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = [ "listreceivedbyaddress", 999999999, true, true]
  // writeLog(arg)
  startCli(arg, coinType)
}

function getAddressByAccount(coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = [ "getaddressesbyaccount", ""]
  // writeLog(arg)
  startCli(arg, coinType)
}

function listAddressGroupings(coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = [ "listaddressgroupings"]
  // writeLog(arg)
  startCli(arg, coinType)
}

function zListAddress(coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg = [ "z_listaddresses"]
  // writeLog(arg)
  startCli(arg, coinType)
}

function sendCoin(from, to, amount, fee, defaultFee)
{
  z_sendmanyData = undefined
  z_getoperationstatusData = undefined
  var toData = []
  var temp = {}
  temp["address"] = to
  temp["amount"] = parseFloat(amount)
  toData.push(temp)
  var arg = [ "z_sendmany", from, toData, 1, parseFloat(fee)]
  // writeLog(arg)
  startCli(arg)
}

function settxfee(fee)
{
  feeData = undefined;
  var arg = ["settxfee", parseFloat(fee)]
  startCli(arg)
}

function sendCoinPublic(to, amount)
{
  z_sendmanyData = undefined
  z_getoperationstatusData = undefined
  var arg = [ "sendtoaddress", to, parseFloat(amount)]
  // writeLog(arg)
  startCli(arg)
}

function exec_sendCoin(from, to, amount, fee, type)
{
  z_sendmanyData  = undefined
  z_getoperationstatusData = undefined
  writeLog(type)
  if(type == SendType.NORMAL)
  {
    writeLog("send coin normal")
    sendCoin(from, to, amount, fee)
  }
  else if(type == SendType.SHIELD)
  {
    writeLog("shield coin")
    shieldCoin(from, to, fee)
  }
  else if(type == SendType.PUBLIC)
  {
    writeLog("set tx fee")
    settxfee(fee);
  }
  //@TODO disable send & shield coin button

}


function sendManyCoin(from, to, fee)
{
  var sendInfo = "\"" + from + "\" " + "\"["

  to.forEach(function(item) {
    var split = item.split(',')
    sendInfo += "{\"address\":\"" + split[0] + "\",\"amount\":" + split[1] + "},"
  })
  sendInfo = sendInfo.substring(0, sendInfo.Length - 1)
  sendInfo += "]\""

  var arg = ["z_sendmany", sendInfo, "1", fee]
  // writeLog(arg)
  startCli(arg)
}

function shieldCoin(from, to, fee)
{
  z_shieldcoinbaseData = undefined
  var arg = [ "z_shieldcoinbase", from, to, parseFloat(fee), 300]
  // writeLog(arg)
  startCli(arg)
}

function verifyAddress(address, data, coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  validateaddressData = undefined
  var arg= ['validateaddress', address]
  arg.push(data)
  // writeLog(arg)
  startCli(arg, coinType)
}

function encryptWallet(password, coinType) {
  encryptData = undefined
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg= ['encryptwallet', password]
  // writeLog(arg)
  startCli(arg, coinType)
}

function changePass(phrase, newPhrase, coinType)
{
  changePassData = undefined
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg= ['walletpassphrasechange', phrase, newPhrase]
  // writeLog(arg)
  startCli(arg, coinType)
}

function lockWallet(coinType)
{
  lockData = undefined
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  var arg= ['walletlock']
  // writeLog(arg)
  startCli(arg, coinType)
}

function unlockWallet(phrase, time, coinType)
{
  unlockData = undefined
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  if (time == undefined)
  {
    time = 300
  }
  var arg= ['walletpassphrase', phrase, parseInt(time)]
  // writeLog(arg)
  startCli(arg, coinType)
}

function verifyZAddress(address, data, coinType)
{
  if(coinType == undefined)
  {
    coinType = 'snowgem'
  }
  validateaddressData = undefined
  var arg = ['z_validateaddress', address]
  arg.push(data)
  // writeLog(arg)
  startCli(arg, coinType)
}

function checkTransaction(opid, type)
{
  opid = strstd(opid)
  var temp = [opid]
  var arg = [ "z_getoperationstatus", temp]
  arg.push(type)
  // writeLog(arg)
  startCli(arg)
}

function getTransaction(txid)
{
  var arg = [ "gettransaction", txid ]
  // writeLog(arg)
  startCli(arg)
}

function getMNPrivKey()
{
  masternodegenkeyData = undefined
  var arg = [ "masternode", 'genkey' ]
  // writeLog(arg)
  startCli(arg)
}

function getMNOutputs()
{
  masternodeoutputsData = undefined
  var arg = [ "masternode", 'outputs' ]
  // writeLog(arg)
  startCli(arg)
}

function getMasternodeList()
{
  masternodelistData = undefined
  var arg = [ "masternode", 'list' ]
  // writeLog(arg)
  startCli(arg)
}

function startMasternode(name)
{
  var arg = [ "startmasternode", "alias", "false", name ]
  // writeLog(arg)
  startCli(arg)
}

function startAlias(name)
{
  var arg = [ "startalias", name ]
  // writeLog(arg)
  startCli(arg)
}

function startAll()
{
  var arg = [ "startmasternode", "many", "false" ]
  // writeLog(arg)
  startCli(arg)
}

function getProposal()
{
  var arg = [ "mnbudget", "show"]
  // writeLog(arg)
  startCli(arg)
}

function voteProposal(mode, hash, value)
{
  var arg = [ "mnbudgetvote", mode, hash, value]
  // writeLog(arg)
  startCli(arg)
}

function readAddressBook(isGetDonation, serverData, currentCoin) {
  var addressLabel = getWalletHome(false, currentCoin) + "/addressLabel.dat";
  var oldbook = {}
  if(fs.existsSync(addressLabel))
  {
    oldbook = JSON.parse(fs.readFileSync(addressLabel, "utf8"))
  }
  if(isGetDonation)
  {
    var keys = Object.keys(oldbook)
    var index = keys.findIndex(function(e){return oldbook[e] == 'donation_address'})
    if(index == -1)
    {
      oldbook[serverData.donation_address] = 'donation_address'
    }
  }

  const ordered = {};
  var key = Object.keys(oldbook)
  Object.values(oldbook).sort(function(a,b){return a.toString().localeCompare(b.toString()) }).forEach(function(value){
    key.some(function(element){
      if(oldbook[element] == value)
      {
        ordered[element] = oldbook[element]
        return
      }
    })
  });
  return ordered
}

function addAddressBook(name, address, serverData, currentCoin) {
  var book = readAddressBook(true, serverData, currentCoin)
  var values = Object.keys(book)
  var keys = Object.values(book)
  var data = {}
  if(keys.includes(name))
  {
    data['result'] = false
    data['error'] = "Duplicate name"
    return data
  }
  else if(values.includes(address))
  {
    data['result'] = false
    data['error'] = "Duplicate address"
    return data
  }
  else
  {
    var addressLabel = getWalletHome(false, currentCoin) + "/addressLabel.dat";
    book[address] = name
    delete book[serverData.donation_address]
    fs.writeFileSync(addressLabel, JSON.stringify(book))
    data['result'] = true
    data['error'] = ''
    data['book'] = book
    return data
  }
}

function editAddressBook(book, serverData, currentCoin){
  var addressLabel = getWalletHome(false, currentCoin) + "/addressLabel.dat";
  delete book[serverData.donation_address]
  fs.writeFileSync(addressLabel, JSON.stringify(book))
  return book
}

function updateWalletDic(walletDic)
{
  var newObj = JSON.parse(JSON.stringify(walletDic));
  var dicKeys = Object.keys(newObj)
  var bookLocal = readAddressBook(true, serverData, currentCoin)
  if(bookLocal != undefined)
  {
    var bookKeys = Object.keys(bookLocal)

    bookKeys.forEach(function(key){
      var index = dicKeys.findIndex(function(e){return e == key})
      if(index > -1)
      {
        var amount = newObj[key].amount
        var ismine = newObj[key].ismine
        delete newObj[key]
        var temp = {}
        temp['amount'] = amount
        temp['ismine'] = ismine
        newObj[key + ' (' + bookLocal[key] + ')'] = temp
      }
    })
  }

  return newObj
}

function getMasternodes()
{
  var loc = getUserHome(serverData, settings) + "/" + (serverData.mn_file ? serverData.mn_file : "masternode.conf")
  if(fs.existsSync(loc))
  {
    return fs.readFileSync(loc, "utf8");
  }
  return undefined
}

function getConfig(serverData)
{
  var loc = getUserHome(serverData, settings) + "/" + serverData.conf_file
  if(fs.existsSync(loc))
  {
    return fs.readFileSync(loc, "utf8");
  }
  return undefined
}

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var year = ('0' + a.getFullYear()).slice(-4);
  var month = ('0' + (a.getMonth() + 1)).slice(-2);
  var date = ('0' + a.getDate()).slice(-2);
  var hour = ('0' + a.getHours()).slice(-2);
  var min = ('0' + a.getMinutes()).slice(-2);
  var sec = ('0' + a.getSeconds()).slice(-2);
  var time
  if((settings != undefined && settings.datetime == "1") || settings == undefined || settings.datetime == undefined)
  {
    time = year + '.' + month + '.' + date + ' '+ hour + ':' + min + ':' + sec ;
  }
  else if(settings != undefined && settings.datetime == "2")
  {
    time = date + '.' + month + '.' + year + ' '+ hour + ':' + min + ':' + sec ;
  }
  return time;
}

function secondsToString(sec)
{
    // Unix timestamp is seconds past epoch
    var day = parseInt(sec / 86400);
    var hour = parseInt((sec % 86400) / 3600);
    var min = parseInt((sec % 3600) / 60);
    if(settings == undefined)
    {
      return (day > 1 ? day + " days " : day + " day ") + ('0' + hour).slice(-2) + "h:" +('0' + min).slice(-2) + "m";
    }
    else
    {
      return (day > 1 ? day + " days " : day + " day ") + ('0' + hour).slice(-2) + "h:" +('0' + min).slice(-2) + "m";
    }
}

function currentTime(sec)
{
    // Unix timestamp is seconds past epoch
    var day = parseInt(sec / 86400);
    var hour = parseInt((sec % 86400) / 3600);
    var min = parseInt((sec % 3600) / 60);
    if(settings == undefined)
    {
      return (day > 1 ? day + " days " : day + " day ") + ('0' + hour).slice(-2) + "h:" +('0' + min).slice(-2) + "m";
    }
    else
    {
      return (day > 1 ? day + " days " : day + " day ") + ('0' + hour).slice(-2) + "h:" +('0' + min).slice(-2) + "m";
    }
}

function strstd(input)
{
  return input.replace('\r\n', '\n').replace('\n', '')
}

function bestCopyEver(src) {
  return Object.assign([], src);
}

function showTab(data, isCheck)
{
  if(isInit && isCheck)
  {
    var tabcontent = document.getElementsByClassName("tabcontent")
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none"
    }
    var element = document.getElementById(getKeyByValue(ScreenType, ScreenType.LOADING))
    if(element != null)
    {
      element.style.display = "block"
    }
    $('#modalMenuBarAlert').modal()
    return
  }
  $('.modal-backdrop').remove();
  var tabcontent = document.getElementsByClassName("tabcontent")
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none"
  }

  var element = document.getElementById(getKeyByValue(ScreenType, data))
  if(element != null)
  {
    element.style.display = "block"
  }
  if(data == ScreenType.OVERVIEW)
  {
    ipc.send('main-update-chart', undefined)
  }
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(function(key){return object[key] == value});
}

function editMasternode(name, ip, privkey, txhash, txid, status, oldName, isNew, port)
{
  if(!isNew)
  {
    var index = localMNs.findIndex(function(f){return f.alias == oldName})
    if(index > -1)
    {
      localMNs.splice(index, 1)
    }
  }
  var temp = {}
  if(status == false)
  {
    temp['status'] = "No"
  }
  else
  {
    temp['status'] = "Yes"
  }
  temp['alias'] = name
  temp['ip'] = ip
  temp['privkey'] = privkey
  temp['txhash'] = txhash
  temp['outidx'] = txid
  localMNs.push(temp)

  writeMasternodeFile(localMNs, port)
}

function removeMasternode(txhash, outidx, port)
{
  var index = localMNs.findIndex(function(f){return f.txhash == txhash && f.outidx == outidx})
  localMNs.splice(index, 1)
  writeMasternodeFile(localMNs, port)
}
function writeMasternodeFile(data, port)
{
  var dataToWrite = ""
  data.sort(function(a,b){return a.alias.localeCompare(b.alias)})
  data.forEach(function(element){
    dataToWrite += (element.status == 'Yes' ? '' : '#') + element.alias + " " + element.ip + ":" + port + " " + element.privkey + " " + element.txhash + " " + element.outidx + "\n"
  });

  fs.writeFileSync(getUserHome(serverData, settings) + "/" + (serverData.mn_file ? serverData.mn_file : "masternode.conf"), dataToWrite)
}

function correctAliasName(name)
{
  while(name.startsWith('#'))
  {
    name.splice(0,1)
  }
  return name
}

function installDependencies(){
  var path = require('path');
  var app2 = electron.remote.app;
  var loc
  if (process.platform == 'linux')
  {
    loc = getWalletHome(true) + '/setup.sh'
  }
  else if(process.platform == 'darwin')
  {
    loc = getHome() + '/setup.command'
  }
  if(fs.existsSync(loc))
  {
    fs.unlinkSync(loc)
  }

  if (process.platform == 'linux')
  {
    var str = 'sudo apt-get install build-essential pkg-config libc6-dev m4 g++-multilib autoconf libtool ncurses-dev unzip git python python-zmq zlib1g-dev wget bsdmainutils automake curl'
    fs.writeFileSync(loc, str)
  }
  else if(process.platform == 'darwin')
  {
    var str = 'brew tap discoteq/discoteq; brew install flock; brew install autoconf; brew install autogen; brew install automake; brew install gcc5; brew install binutils; brew install protobuf; brew install coreutils; brew install wget'
    fs.writeFileSync(loc, str)
  }

  writeLog("run chmod setup.sh")
  var temparg = ["+x", loc]
  miningProcess.spawnSync("chmod", temparg)

  temparg = [loc]
  miningProcess.spawnSync("sh", temparg,{
    detached: true,
    shell: true
  })

  return loc
}

function saveSettings(input, coin)
{
  var keys = Object.keys(input)
  var loc = getWalletHome(false, coin) + "/settings.json"
  var data = {}
  if(fs.existsSync(loc))
  {
    try
    {
      data = JSON.parse(fs.readFileSync(loc, "utf8"))
    }
    catch(ex){}
  }
  if(keys.length > 0)
  {
    keys.forEach(function(element){
      data[element] = input[element]
    })
  }
  fs.writeFileSync(loc, JSON.stringify(data))
  readSettings(coin)
}

function readSettings(coin)
{
  writeLog('readSettings')
  var loc = path.join(getWalletHome(false, coin), 'settings.json')
  var data = {}
  try
  {
    data = JSON.parse(fs.readFileSync(loc, "utf8"))
  }
  catch(ex){}
  return data
}

function getLanguage()
{
  var loc = path.join(getWalletHome(true, currentCoin), 'config.json')
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
    data.language = LanguageType.EN
    return data.language
  }
}

function saveLanguage(language){
  var loc = getWalletHome(true) + "/config.json"
  var data = {}
  try
  {
    data = JSON.parse(fs.readFileSync(loc, "utf8"))
  }
  catch(ex){}
  data.language = language
  fs.writeFileSync(loc, JSON.stringify(data))
}

function getCurrentCoin(){
  var loc = getWalletHome(true, currentCoin) + "/config.json"
  var data = {}
  try
  {
    data = JSON.parse(fs.readFileSync(loc, "utf8"))
  }
  catch(ex){}
  if(data.coinname != undefined)
  {
    return data.coinname
  }
  else
  {
    return undefined
  }
}

function saveCurrentCoin(coin){
  var loc = getWalletHome(true) + "/config.json"
  var data = {}
  try
  {
    data = JSON.parse(fs.readFileSync(loc, "utf8"))
  }
  catch(ex){}
  data.coinname = coin
  fs.writeFileSync(loc, JSON.stringify(data))
}

var isRunning = function(jquery, cb){
  var platform = process.platform;
  var cmd = '';
  switch (platform) {
      case 'win32' : cmd = 'tasklist'; break;
      case 'darwin' : cmd = 'ps -ax'; break;
      case 'linux' : cmd = 'ps -A'; break;
      default: break;
  }
  exec(cmd, function(err, stdout, stderr){
      cb(stdout);
  });
}

function countOcurrences(str, value, isProgramName) {
  if(!isProgramName)
  {
    var regExp = new RegExp(value, "gi");
    return (str.match(regExp) || []).length;
  }
  else
  {
    str = str.replace('\r\n', '\n')
    var split = str.split('\n')
    var count = 0
    split.forEach(function(element){
      var split2 = element.split('/')
      if(split2[split2.length - 1] == value)
      {
        count += 1
      }
    })

    return count
  }
}

function getPrice()
{
  var serverUrl = "data.tent.app"
  var backupUrl = "rates.tent.app"
  var path =  '/rates/index.html'
  var request = require('request');
  request('https://' + serverUrl + path, function (error, response, body) {
    if(response == undefined || response.statusCode != 200)
    {
      request('https://' + backupUrl + path, function (error, response, body) {
        if(response == undefined || response.statusCode != 200){
          request('http://' + serverUrl + path, function (error, response, body) {
            if(response == undefined || response.statusCode != 200){
              request('http://' + backupUrl + path, function (error, response, body) {
                if(response == undefined || response.statusCode != 200){
                  setTimeout(getPrice, 60000)
                }
                else
                {
                  ipc.send('main-update-price', String(body))
                }
              })
            }
            else
            {
              ipc.send('main-update-price', String(body))
            }
          })
        }
        else
        {
          ipc.send('main-update-price', String(body))
        }
      })
    }
    else
    {
      ipc.send('main-update-price', String(body))
    }
  });
}

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

function readConfig(serverData){
  var fileName = getUserHome(serverData, settings) + "/" + serverData.conf_file
  var data = {}
  if(fs.existsSync(fileName))
  {
    var fileData = String(fs.readFileSync(fileName))
    var fileData = fileData.replace(new RegExp('\r?\n','g'), '\n')
    fileData = fileData.split('\n')
    fileData = filter_array(fileData)
    fileData.forEach(function(element){
      var split = element.split('=')
      if(split.length == 2)
      {
        data[split[0]] = split[1]
      }
    })
  }
  return data
}

function writeConfig(data, isString){
  var dataToWrite = ""
  if(isString)
  {
    dataToWrite = data
  }
  else
  {
    var key = Object.keys(data)
    key.forEach(function(element){
      dataToWrite += element + '=' + data[element] + '\n'
    })
  }
  var fileName = getUserHome(serverData, settings) + "/" + serverData.conf_file
  fs.writeFileSync(fileName, dataToWrite)
}

function checkBlockchain(serverData, args)
{
  var homeDir = getUserHome(serverData, settings)
  var index = args.findIndex(function(e){return e == '-reindex'})
  if(!fs.existsSync(homeDir + "/blocks") || index > -1)
  {
    return false
  }
  else
  {
    return true
  }
}

function checkNoticeDisplay(serverData, type, name)
{
  var loc = getWalletHome(false, currentCoin) + "/temp.dat"
  var curr = Math.round((new Date()).getTime() / 1000)
  if(fs.existsSync(loc))
  {
    var content = fs.readFileSync(loc, 'utf8')
    try
    {
      content = JSON.parse(content)
      var eleLocal = content.notice.findIndex(function(e){return e.type == type && e.name == name})
      if(eleLocal > -1)
      {
        if(parseInt(content.notice[eleLocal].time) + serverData.noticetimer > curr &&
          parseInt(content.notice[eleLocal].time) < curr)
        {
          return false
        }
        else
        {
          return true
        }
      }
      else
      {
        return true
      }
    }
    catch(ex){

    }
  }
  return true
}

function saveNoticeDisplay(type, name)
{
  var loc = getWalletHome(false, currentCoin) + "/temp.dat"
  var curr = Math.round((new Date()).getTime() / 1000)
  if(fs.existsSync(loc))
  {
    var content = fs.readFileSync(loc, 'utf8')
    try
    {
      content = JSON.parse(content)
      var eleLocal = content.notice.findIndex(function(e){return e.type == type && e.name == name})
      if(eleLocal > -1)
      {
        content.notice[eleLocal].time = curr
        fs.writeFileSync(loc, JSON.stringify(content))
        return
      }
      else
      {
        var temp = {}
        temp["type"] = type
        temp["name"] = name
        temp["time"] = curr
        content.notice.push(temp)
        fs.writeFileSync(loc, JSON.stringify(content))
        return
      }
    }
    catch(ex){

    }
  }
  content = {}
  content.notice = []
  var temp = {}
  temp["type"] = type
  temp["time"] = curr
  temp["name"] = name
  content.notice.push(temp)
  fs.writeFileSync(loc, JSON.stringify(content))
}

//#region
/************
 * Bot region
 */

function clearBot(type)
{
    if(bot != undefined)
    {
        if(type == "Telegram")
        {
            bot.stopPolling();
            bot = undefined;
        }
        else if(type == "Discord")
        {
            bot = undefined;
        }
    }
}
function initBot(type, key)
{
    console.log("Key = " + key);
    if(bot == undefined)
    {
        if(type == "Telegram")
        {
            bot = new TelegramBot(key, {polling: {interval: 1000} });
            bot.on('message', function(message) {
                console.log(message);
            });

            bot.on('error', function(message) {
                console.log("Error");
            })

            bot.on('polling_error', function(message) {
                //clearBot(type);
                console.log(message);
            })

            bot.on('channel_post', function(message) {
                console.log(message)
                var txt = message.text.toLowerCase();
                replyMessage(txt, message.chat.id);
            })

        }
        else if(type == "Discord")
        {
            bot = new Discord.Client();
            bot.login(key);
            bot.on('message', function(message) {
                console.log(message);
                if (message.author.bot) return;
                var txt = message.content.toLowerCase();
                replyMessage(txt, message.author.id);
            });
        }
    }
}

function replyMessage(txt, id)
{
  var res = txt.split(" ");
  console.log(res.length)
  console.log(res)
  var botStr = settings.botname + "\n"
  //if(res[0][0] == '/')
  var book = readAddressBook(true, serverData, currentCoin)
  {
    var command = res[1];
    var agr = res[0];
    if (agr && (agr == settings.botname.toLowerCase() || agr == "all"))
    {
      if(command == "initbot")
      {
        settings.botid = id
        saveSettings(settings, currentCoin)
        sendMessage(settings.bot, id, botStr + "Init successfully");
      }
      else if(command == "noti")
      {
        var msg
        if(res[2].toLowerCase() == "enable")
        {
          settings.botnoti = true
          msg = "Enable notification"
        }
        else
        {
          settings.botnoti = false
          msg = "Disable notification"
        }
        saveSettings(settings, currentCoin)
        sendMessage(settings.bot, id, botStr + msg + " successfully");
      }
      else if(command == "shieldall")
      {
        isBotCmd = true
        if(res[2])
        {
          var data = {}
          data.shieldthreshold = 8
          var values = Object.keys(book)
          var keys = Object.values(book)
          var idx = keys.findIndex(function(e){return e == res[2]})
          if(idx > -1)
          {
            data.shieldaddress = values[idx]
          }
          else
          {
            data.shieldaddress = res[2]
          }
          data.isBot = true
          sendMessage(settings.bot, id, botStr + "Shielding all generated coin to " + data.shieldaddress);
          electron.ipcRenderer.send('main-execute-shield-all', data)
        }
        else
        {
          createHelpMessage(command)
        }
      }
      else if(command == "send")
      {
        isBotCmd = true
        if(res[2] && res[3] && res[4])
        {
          var data = {}
          var values = Object.keys(book)
          var keys = Object.values(book)
          var idx = keys.findIndex(function(e){return e == res[2]})
          if(idx > -1)
          {
            data.from = values[idx]
          }
          else
          {
            data.from = res[2]
          }

          idx = keys.findIndex(function(e){return e == res[3]})
          if(idx > -1)
          {
            data.to = values[idx]
          }
          else
          {
            data.to = res[3]
          }

          if(isNaN(res[4]))
          {
            createHelpMessage(command)
            return
          }
          else
          {
            data.value = +res[4]
          }

          data.isBot = true
          sendMessage(settings.bot, id, botStr + "Sending " + data.value + " from " + data.from + " to " + data.to)
          electron.ipcRenderer.send('main-execute-send-coin', data)
        }
        else
        {
          createHelpMessage(command)
        }
      }
      else if(command == "getaddrbook")
      {
        var inside = []
        var outside= []
        var keys = Object.keys(walletDic)
        addrBook.forEach(function(element){
          var index = keys.findIndex(function(e){return e.includes(element.text)})
          if(index> -1)
          {
            inside.push(element.text)
          }
          else
          {
            outside.push(element.text)
          }
        });
        var msg = "your addresses: " + inside.join(", ")
        msg += "\nnot your addresses: " + outside.join(", ")
        sendMessage(settings.bot, id, botStr + msg);
      }
      else if(command == "getaddr")
      {
        var addr = ""
        if(res[2])
        {
          addrBook.some(function(element){
            if(element.text == res[2])
            {
              addr = element.value
              return
            }
          });
          var msg = botStr + addr
          sendMessage(settings.bot, id, msg);
        }
        else
        {
          createHelpMessage(command)
        }
      }
      else if(command == "stats")
      {
        sendMessage(settings.bot, id, createNotiData());
      }
      else if(command == "mns")
      {
        sendMessage(settings.bot, id, createMNData());
      }
      else if(command == "mndetail")
      {
        sendMessage(settings.bot, id, createMNData(res[2]));
      }
      else if(command == "txs")
      {
        sendMessage(settings.bot, id, createTxData(parseInt(res[2])));
      }
      else if(command == "price")
      {
        sendMessage(settings.bot, id, botStr + priceandsymbol);
      }
      else if(command == "getid")
      {
        msg = settings.botname + "\n" + id;
        sendMessage(settings.bot, id, msg);
      }
      else if(command == "name")
      {
        msg = settings.botname + "\n";
        sendMessage(settings.bot, id, msg);
      }
      else if(command == "restart")
      {
        //start mining
        msg = settings.botname + " will restart after 1 minute";
        sendMessage(settings.bot, id, msg);
        restartPC();
      }
      else if(command == "help")
      {
        //send help
        if(res.length == 3)
        {
          var cmd = res[2];
          var msg = createHelpMessage(cmd);
          sendMessage(settings.bot, id, msg);
        }
        else
        {
          sendHelp(settings.botname + ":\n", id);
        }
      }
      else if(command == "ip")
      {
        publicIp.v4().then(function(ip){
          localip = ip
          var msg = settings.botname + " ip: " + localip;
          sendMessage(settings.bot, id, msg);
        })
      }
      else
      {
        sendHelp(settings.botname + "\n", id);
      }
    }
  }
}

function createNotiData()
{
  return settings.botname + "\n" + JSON.stringify(balance, null, 2)
}

function createMNData(alias)
{
  var data = []

  localMNs.forEach(function(element){
    alias == undefined ? data.push(element.alias) :
      (element.alias == alias ? data.push(element) : "")
  })

  var botStr = settings.botname + "\n"
  if(data.length == 0 && alias == undefined)
  {
    return botStr + "Cannot find any masternode in your wallet"
  }
  else if(data.length == 0 && alias != undefined)
  {
    return botStr + "Cannot find " + alias + " in your wallet"
  }
  if(alias == undefined)
    return botStr + data.join(', ')
  else
    return botStr + JSON.stringify(data, null, 2)
}

function createTxData(noTx)
{
  var data = []
  if(noTx <= 0)
  {
    noTx = 5
  }
  else if(noTx > 5)
  {
    noTx = 5
  }
  else if(isNaN(noTx))
  {
    noTx = 1
  }
  transactions.some(function(element){
    var temp = {}
    if(data.length < noTx)
    {
      temp['no'] = data.length + 1
      temp['direction'] = element.direction
      temp['date'] = element.date
      temp['address'] = element.address
      temp['amount'] = element.amount
      temp['validated'] = element.validated
      temp['confirmations'] = element.confirmations
      data.push(temp)
    }
    else
    {
      return
    }
  });
  return settings.botname + "\n" + JSON.stringify(data, null, 2)
}

function createHelpMessage(cmd)
{
  var msg = "";
  if(cmd == "initbot")
  {
    msg = "\n\
    ``initbot``\n\
    Init bot data\n\
    \nResult:\n\
      Returns initialization success message\n\
    \nExamples:\n\
    wallet1 initbot"
  }
  else if(cmd == "stats")
  {
    msg = "\n\
    ``stats``\n\
    Get wallet information\n\
    \nExamples:\n\
    wallet1 stats"
  }
  else if(cmd == "getaddrbook")
  {
    msg = "\n\
    ``getaddrbook``\n\
    Get all address book in wallet\n\
    \nExamples:\n\
    wallet1 getaddrbook"
  }
  else if(cmd == "getaddr")
  {
    msg = "\n\
    ``getaddr addressbook``\n\
    Get address from specific address book in wallet\n\
    \nArguments:\n\
    1. \"addressbook\"   (string, required) address book to get wallet address\n\
    \nExamples:\n\
      wallet1 getaddrbook book1"
  }
  else if(cmd == "shieldall")
  {
    msg = "\n\
    ``shieldall toaddress``\n\
    Get address from specific address book in wallet\n\
    \nArguments:\n\
    1. \"toaddress\"   (string, required) address book or private address to be received shield coin\n\
    \nExamples:\n\
      wallet1 getaddrbook shieldall\n\
      wallet1 getaddrbook shieldall zs1yezn5j36lwjj9yfywehqt0l3ptke3aek4gmsvcehtwdm17l9qywp7ze4zcelxy4ep8ygk6nh2yz"
  }
  else if(cmd == "send")
  {
    msg = "\n\
    ``send fromaddress toaddress amount``\n\
    Get address from specific address book in wallet\n\
    \nArguments:\n\
    1. \"fromaddress\"   (string, required) address book or address to send coin\n\
    2. \"toaddress\"   (string, required) address book or address to be received coin\n\
    3. \"amount\"   (numberic, required) amount to send\n\
    \nExamples:\n\
      wallet1 send sapling_shield add1 0.5"
  }
  else if(cmd == "mns")
  {
    msg = "\n\
    ``mns``\n\
    Get all alias in your wallet\n\
    \nExamples:\n\
      wallet1 mns"
  }
  else if(cmd == "mndetail")
  {
    msg = "\n\
    ``mndetail aliasname``\n\
    Get masternode detail for specific masternode\n\
    \nArguments:\n\
    1. \"aliasname\"   (string, required) alias name\n\
    \nExamples:\n\
      wallet1 mndetail mn1"
  }
  else if(cmd == "txs")
  {
    msg = "\n\
    ``txs numbertoget``\n\
    Get some latest transactions\n\
    \nArguments:\n\
    1. \"numbertoget\"   (number, optional) number of transactions to get (1-5)\n\
    \nExamples:\n\
      wallet1 txs\n\
      wallet1 txs 3"
  }
  else if(cmd == "price")
  {
    msg = "\n\
    ``price``\n\
    Get TENT price\n\
    \nExamples:\n\
      wallet1 price"
  }
  return msg;
}

function sendHelp(begining, id)
{
  var msg = "";
  if(begining)
  {
    msg += begining;
  }
  msg += "Command structure: <walletname> <command> <agruments>\n";
  msg += "For example: wallet1 stats\n";
  msg += "If you put 'all' to second parameter, all PCs will reply\n";
  msg += "For example: ``all stats``\n\n";
  msg += "Use '<walletname> help <command>' to display more detail\n";
  msg += "For example: ``wallet1 help send``\n\n";
  msg += "Supported commands:\n";
  msg += "help - display help message\n";
  msg += "initbot - initialize bot\n";
  // msg += "noti - enable/disable bot notication\n";
  msg += "stats - get wallet info\n";
  msg += "getaddrbook - get wallet name from book\n";
  msg += "getaddr - get wallet address from name\n";
  msg += "shieldall - shield all genmerated coin\n";
  msg += "send - send coin\n";
  msg += "mns - get masternode list\n";
  msg += "mndetail - get masternode detail\n";
  msg += "txs - get some latest transactions\n";
  msg += "price - get coin price\n";
  msg += "name - get bot name\n";
  msg += "getid - get user ID (Discord)\n"
  msg += "restart - restart PC\n"
  msg += "ip - get public ip address"
  sendMessage(settings.bot, id, msg);
}

function sendBotReplyMsg(msg)
{
  var botStr = settings.botname + "\n"
  if(settings.botid)
  {
    sendMessage(settings.bot, settings.botid, botStr + msg)
  }
  else
  {
    sendMessage(settings.bot, settings.botid, botStr + "you have to init bot before receiving done signal")
  }
  isBotCmd = false
}

function sendMessage(type, id, msg)
{
  if(bot != undefined)
  {
    try
    {
      var dateFormat = require('dateformat');
      var now = new Date();
      formatted = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      msg = formatted + "\n" + msg;
      if(msg[msg.length - 1] == '\n')
      {
        msg = msg + "=========================";
      }
      else
      {
        msg = msg + "\n=========================";
      }
      if(type == "Telegram")
      {
        bot.sendMessage(id, msg);
      }
      else if(type == "Discord")
      {
        bot.users.get(id).send(msg);
      }
    }
    catch(err) {
      console.log("Send message error");
      writeLog(err);
    }
  }
}

//#endregion

function curlData(username, password, port, methods, params, coinType){
  var temp = [methods.slice(0, methods.length)]
  temp = temp.concat(params)
  if(methods == 'z_getoperationstatus')
  {
    params.splice(1,1)
  }
  else if(methods == 'getdebug')
  {
    methods = params[0]
    params.splice(0,1)
  }
  else if(methods.includes('validateaddress'))
  {
    if(params.length > 1)
    {
      params.splice(1, 1)
    }
  }
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
      if (error) {
        var rtnData = {}
        rtnData['key'] = temp[0]
        rtnData['arg'] = temp
        rtnData['value'] = error
        if(coinType == 'snowgem')
        {
          handleFunction(rtnData)
        }
        else if(coinType == 'zcash')
        {
          handleFunctionZcash(rtnData)
        }
        else
        {
          writeLog("curlData not supported")
        }
      } else {
        var rtnData = {}
        var data = body
        try
        {
          data = JSON.parse(body)
        }
        catch(ex){}
        rtnData['key'] = temp[0]
        rtnData['arg'] = temp
        rtnData['value'] = data
        if(coinType == 'snowgem')
        {
          handleFunction(rtnData)
        }
        else if(coinType == 'zcash')
        {
          handleFunctionZcash(rtnData)
        }
        else
        {
          writeLog("curlData not supported")
        }
      }
  })
}
