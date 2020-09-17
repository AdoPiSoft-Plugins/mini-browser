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
        return $http.get("/?url="+url).catch(CatchHttpError);
      }
      this.close = function(){
        return $http.get("/exit-mini-browser").catch(CatchHttpError);
      }
    }
  ])

  App.controller('MiniBrowserPluginCtrl', function($scope, MiniBrowserService, toastr, CatchHttpError, $timeout, $ngConfirm){
    $scope.exit_url = window.location.origin+"/exit-mini-browser"
    $scope.browser;
    $scope.open = function(){
      if($scope.browser && !$scope.browser.closed){
        return $scope.browser.focus()
      }
      document.cookie = "mini_browser=true;path=/";
      MiniBrowserService.open($scope.url).then(function(){
        $scope.browser = window.open("/", '_blank');
      })
    }

    $scope.close = function(){
      if(!confirm("Are you sure you want to close mini browser session?")) return;
      document.cookie = "mini_browser=; Max-Age=0;path=/";
      if($scope.browser){
        $scope.browser.close()
      }
      $scope.browser = null
      $scope.url = ""
      return MiniBrowserService.close()
    }
  })

})();
