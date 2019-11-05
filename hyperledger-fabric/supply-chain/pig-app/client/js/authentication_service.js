'use strict';

angular.module('vardyger')
  .factory('AuthenticationService',
    function(
      $log,                // inject the $log service
      $rootScope,          // inject the $rootScope service
      $http,               // inject the $http service
      authService,         // inject the authService service
      localStorageService  // inject the localStorageService service
    ) {
      $log.info('AuthenticationService');

      var loggedIn = false;

      var service = {
        login: function(credentials) {
          $http.post('https://login', { user: credentials }, { ignoreAuthModule: true })
            .success(function (data, status, headers, config) {
              loggedIn = true;

              $http.defaults.headers.common.Authorization = data.authorizationToken;
              localStorageService.set('authorizationToken', data.authorizationToken);
              
              authService.loginConfirmed(data, function(config) {
                config.headers.Authorization = data.authorizationToken;
                return config;
              });
            })

            .error(function (data, status, headers, config) {
              $rootScope.$broadcast('event:auth-login-failed', status);
            });
        },

        isLoggedIn: function() {
          return loggedIn;
        },

        loginCancelled: function() {
          authService.loginCancelled();
        },

        logout: function() {
          loggedIn = false;

          $http.post('https://logout', {}, { ignoreAuthModule: true })
            .finally(function(data) {
              localStorageService.remove('authorizationToken');
              delete $http.defaults.headers.common.Authorization;
              $rootScope.$broadcast('event:auth-logout-complete');
            });
        }
      };

      return service;
  });