var app = angular.module('debuggingscreen', ['pascalprecht.translate'])
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

app.controller('DebuggingCtrl', ["$scope", "$http", "$timeout", "$translate", "$rootScope", function($scope, $http, $timeout, $translate, $rootScope) {
  $scope.detail = {}
  $scope.settings = undefined
  function getDebugFile(settings){
    return path.join(settings.datafolder, 'debug.log');
  }

  electron.ipcRenderer.on('debugging-update-settings', function(event, msgData){
    $timeout(function(){
      $scope.settings = msgData.msg[0]
      if (serverData && serverData.linuxoss) $scope.oss = serverData.linuxoss
    },0)
  })

  readLog()
  function readLog(){
    if($scope.settings)
    {
      readLastLines.read(getDebugFile($scope.settings), 18)
      .then((lines) => {
        console.log(lines)
        $timeout(function(){
          $scope.detail.log = lines.split('\n').filter(function () { return true });
          readLog()
        }, 100)
      })
    }
    else
    {
      setTimeout(() => {
        readLog()
      }, 1000);
    }
  }
}])
