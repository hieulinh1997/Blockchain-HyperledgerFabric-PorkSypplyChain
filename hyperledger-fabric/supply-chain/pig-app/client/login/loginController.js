var app = angular.module('application');
 app.controller('LoginController', function($scope, $rootScope, $stateParams, $state, LoginService) {
    $rootScope.title = "AngularJS Login Sample";
    
    $scope.formSubmit = function() {
      if(LoginService.login($scope.username, $scope.password)) {
        $rootScope.userName = $scope.username;
        $scope.error = '';
        $scope.username = '';
        $scope.password = '';
        $state.transitionTo('views');
      } else {
        $scope.error = "Incorrect username/password !";
      }   
    };    
  });