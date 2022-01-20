var appVersion = "1.1.6"
var betaTest = false
var DecompressZip = require('decompress-zip')
var md5File = require('md5-file')
var md5FilePromise = require('md5-file/promise')
var Steps = {"CHECK_LANGUAGE": -3, "GET_COIN_LIST": -2, "PREPARE": -1, "START":0, "GET_DATA": 1, "CHECK_WALLET_VERSION": 2, "DOWNLOAD_WALLET_VERSION": 3, "CHECK_PARAMS":4, "DOWNLOAD_PARAMS":5, "CHECK_BLOCKCHAIN": 6, "DOWNLOAD_BLOCKCHAIN": 7, "CHECK_DAEMON":9, "DOWNLOAD_DAEMON": 10, "START_DAEMON": 11, "OPENING_WALLET": 12, "FINISH": 13, "CHECK_DATA_FOLDER": 14, "SHOW_POPUP": 15, "CHECK_JS": 16, "END": 17}
var CheckType = {"SERVER":0, "DAEMON": 1}
var GetAllDataType = {"ALL":0, "WITH_BALANCE":1, "WITH_TRANSACTIONS":2, "NONE":3}
var ScreenType = {"LOADING":0, "OVERVIEW": 1, "SEND":2, "SHIELD":3, "ADDRESSES": 4, "TRANSACTIONS": 5, "MASTERNODES": 6, "MASTERNODES_CONFIG": 7, "APPS": 8, "EXCHANGES": 9, "SETTINGS": 10, 'MASTERNODES_MAP': 11, 'ADDRESSBOOK': 13, 'VOTING': 14}
var MsgType = {
  "ALERT": 0, "CONFIRMATION": 1, "DELETE": 2, "EDITMN": 3, "UBUNTU_VERSION": 4, "DAEMON_LOCATION": 5, 'DEPENDENCIES': 6, 'DEFAULT_SETTINGS': 7, "ADD_PEERS": 8, "DEBUG": 9, "GET_PEERS": 10, "SELECTCOIN": 11, "AUTO_DOWNLOAD_DAEMON": 12, "AUTO_DOWNLOAD_BLOCKCHAIN": 13, "LOADING_RESTART_WALLET": 14, "LOADING_DAEMON": 15, "CUSTOM_DATA": 16, "DATA_LOCATION": 17, "CONFIRMATION2": 18, "MASTERNODE_OPTION": 19, "SELECT_COIN_SETTINGS": 20, "SEND_CONFIRMATION": 21, "SEND_MANY": 22, "BUDGET_VOTE": 23,
  "UNLOCK": 24, "CHANGE_PASS": 25, "ENCRYPT": 26
}
var SendType = {"NORMAL":0, "SHIELD": 1, "PUBLIC": 2}
var UpdateDataType = {"COINLIST": 0, "SELECTCOIN": 1, "DATATYPE": 2 , "DOWNLOADBLOCKCHAIN": 3, "DOWNLOADFILE": 4, "CHECKDAEMON": 5, "AUTODOWNLOAD": 6,
"APPLYLOCATION": 7, "CUSTOMDATA": 8, "NEWVERSION": 9, "APPLYCUSTOMDATA": 10, "AUTODOWNLOADBLOCKCHAIN": 11, "DEPENDENCIESACTION": 12, "ERRORDAEMON": 13, "SELECTCOINSETTINGS": 14, "SELECTLINUX": 15, "RESTART": 16}
var LanguageType = {"AE": "ae", "CN": "cn", "CZ": "cz", "DE": "de", "EN": "en", "ES": "es", "FR": "fr", "HU": "hu", "IT": "it", "KR": "kr", "NL": "nl", "PL": "pl", "RO": "ro", "RU": "ru", "TR": "tr"}
function getNameFromUrl(element)
{
  url = element.replace("https:\\", "https://");
  var splits = url.split('/')
  return splits[splits.length - 1]
}
