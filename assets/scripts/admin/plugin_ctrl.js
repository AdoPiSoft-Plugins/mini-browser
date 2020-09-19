(function () {
  'use strict';

  var App = angular.module('Plugins')
  App.service('MiniBrowserService', [
    '$http',
    'toastr',
    'CatchHttpError',
    '$q',
    function($http, toastr, CatchHttpError, $q) {
      this.open = function (url) {
        return $http.get("/?url="+url).catch(function(){});
      }
      this.close = function(){
        return $http.get("/exit-mini-browser").catch(function(){});
      }
    }
  ])

  App.controller('MiniBrowserPluginCtrl', function($scope, MiniBrowserService, toastr, CatchHttpError, $timeout, $ngConfirm){
    var ip_regx = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
    var domain_regx = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/

    $scope.exit_url = window.location.origin+"/exit-mini-browser"
    $scope.browser;
    $scope.setDefaultUrl = function(){
      if(!$scope.url){
        $scope.url = "http://"
      }
    }

    $scope.formatUrl = function(){
      if(!$scope.url) return
      if($scope.url == 'http://'){
        $scope.url = ''
      }
      $scope.url = $scope.url.toLowerCase()
    }

    $scope.open = function(){
      if($scope.browser && !$scope.browser.closed){
        return $scope.browser.focus()
      }
      document.cookie = "mini_browser=true;path=/";
      var url = new URL($scope.url)
      MiniBrowserService.open($scope.url).finally(function(){
        $scope.browser = window.open(url.pathname, '_blank');
      })
    }

    $scope.close = function(){
      if(!confirm("Are you sure you want to close mini browser session?")) return;
      return MiniBrowserService.close().finally(function(){
        document.cookie = "mini_browser=; Max-Age=0;path=/";
        if($scope.browser){
          $scope.browser.close()
        }
        $scope.browser = null
        $scope.url = ""
      })
    }
  })

})();
