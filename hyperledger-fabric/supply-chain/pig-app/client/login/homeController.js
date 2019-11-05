var app = angular.module('application');
 
  app.controller('HomeController', 
  function($scope, $rootScope, $stateParams, $state, LoginService) {
    $scope.user = $rootScope.userName;
    
  });