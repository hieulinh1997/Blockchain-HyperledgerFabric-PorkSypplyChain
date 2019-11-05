var app = angular.module('application');
  
  app.factory('LoginService', function() {
    var admin = 'admin';
    var pass = 'password';
    var isAuthenticated = false;
    
    return {
      login : function(username, password) {
        isAuthenticated = username === admin && password === pass;
        return isAuthenticated;
      },
      isAuthenticated : function() {
        return isAuthenticated;
      }
    };
    
  });