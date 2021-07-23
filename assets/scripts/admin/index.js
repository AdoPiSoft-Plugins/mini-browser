(function () {
  'use strict';
  var App = angular.module('Plugins')
  .config(function($stateProvider) {
    $stateProvider
    .state('plugins.mini_browser', {
      templateUrl : "/public/plugins/mini-browser/views/admin/index.html",
      controller: 'MiniBrowserPluginCtrl',
      url: '/mini-browser-plugin',
      title: 'Mini Browser'
    });
  });
})();
