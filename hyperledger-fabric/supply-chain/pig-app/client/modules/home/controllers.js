'use strict';
(function () {
angular.module('Home')

.controller('HomeController',
    ['$scope',
    function ($scope, $window, appFactory, $location, $rootScope, $timeout) {
        $scope.updateSickCure = function(){

            appFactory.updateSickCure($scope.farm, function(data){
                $scope.update_sick_cure = data;
                if ($scope.update_sick_cure == "Error: no sick_cure found id"){
                    $("#error_holder").show();
                    $("#success_holder").hide();
                } else{
                    $("#success_holder").show();
                    $("#error_holder").hide();
                }
            });
        }
        
        $scope.updateFamer = function(){
    
            appFactory.updateFamer($scope.farm, function(data){
                $scope.update_famer = data;
                if ($scope.update_famer == "Error: no farm found"){
                    $("#error_holder").show();
                    $("#success_holder").hide();
                } else{
                    $("#success_holder").show();
                    $("#error_holder").hide();
                }
            });
        }
    
        $scope.wrapLogin = function(){
            $scope.submit();
            $timeout(function () {
                $scope.loginUser();
            }, 1000);
            // console.log('Successfull login.')
            
        };
        
        $scope.submit = function( data) {
            // if($scope.username == 'user1' && $scope.roles == 'farm'){
            // 	$rootScope.loggedIn = true;
            // 	$location.path('/farm')
            // 	console.log('farm')
            // } else {
            // 	alert ('error login')
            // }
            
        };
        
        // start tab
        this.tab = 1;
    
            this.setTab = function (tabId) {
                this.tab = tabId;
            };
    
            this.isSet = function (tabId) {
                return this.tab === tabId;
            };
        //end tap
        //wrap
        $scope.wrap = function(){
            // var usernameRegister = $scope.user.username;
            $scope.registerUser();
            
        };
        // end wrap
        // fghg
        $scope.registerUser = function(){
    
            var usernameRegister = $scope.user.username;
                
                    appFactory.queryAllUser( function(data){
                    // $scope.addUser();
                    var resultUser  =0;
                        for (var i = 0; i < data.length; i++){
                            if (usernameRegister == (data[i].Record.username)){
                                resultUser = 0;
                            } else {
                                resultUser = 1;
                            }
                        }
                        console.log(resultUser);
                        if (resultUser == 1){
                            $timeout(function () {
                                $scope.addUser();
                                alert('Đã thêm: ' + usernameRegister);
                            }, 1000);
                        } else {
                            alert('user enrolled! Please, register new user');
                            
                        }
                        appFactory.registerUser(usernameRegister, function(data){
                
                        });
                });
        };
    
        $scope.loginUser = function(){
    
            var usernameLogin = $scope.usernameLogin;
            var rolesLogin = $scope.rolesLogin;
            
                appFactory.queryAllUser( function(data){
                    // console.log('login user2');
                    console.log(usernameLogin);
                    var resultUser = 0;
                    for (var i = 0; i < data.length; i++){
                        // (data[i].username);
                        if (usernameLogin == (data[i].Record.username) && (rolesLogin == 'admin')){
                            console.log('usernameLogin = user data');
                            console.log(data[i].Record.username);
                            resultUser = 1;
                        } else if( usernameLogin == (data[i].Record.username) && (rolesLogin == 'farm') ) {
                            console.log('roles login');
                            resultUser = 2;
                        
                        } 
                        // else {
                            // return resultUser = 0;
                            // console.log('resultUser=0');
                        // }
    
                    }
                    console.log(resultUser);
                    if (resultUser == 1){
                        $rootScope.loggedIn = true; //tam
                        $location.path('/admin') //tam
                        alert('Successful Login');
                    } else if (resultUser == 2) {
                        $rootScope.loggedIn = true; //tam
                        $location.path('/farm') //tam
                        alert('Successful Login');
                    } else if (resultUser == 0){
                        alert('Fail login');
                        
                    }
                    appFactory.loginUser(usernameLogin, function(data){
                    });
    
                });
        }
    
        $("#success_holder").hide();
        $("#success_create").hide();
        $("#error_holder").hide();
        $("#error_query").hide();
        
        $scope.addUser = function(){
    
            appFactory.addUser($scope.user, function(data){
                $scope.create_tuna = data;
                $("#success_create").show();
                // alert('Successfull');
            });
        }
        
        $scope.queryAllUser = function(){
    
            appFactory.queryAllUser(function(data){
                var array = [];
                for (var i = 0; i < data.length; i++){
                    parseInt(data[i].Key);
                    // data[i].Record.Key = parseInt(data[i].Key);
                    data[i].Record.Key = (data[i].Key);
                    array.push(data[i].Record);
                }
                // console.log('all use');
                array.sort(function(a, b) {
                    // return parseFloat(a.Key) - parseFloat(b.Key);
                    return (a.Key) - (b.Key);
                });
                $scope.all_user = array;
                
            });
            alert('Successfull');
        }
    
        $scope.queryAllPig = function(){
    
            appFactory.queryAllPig(function(data){
                var array = [];
                for (var i = 0; i < data.length; i++){
                    parseInt(data[i].Key);
                    data[i].Record.Key = parseInt(data[i].Key);
                    array.push(data[i].Record);
                }
                array.sort(function(a, b) {
                    return parseFloat(a.Key) - parseFloat(b.Key);
                });
                $scope.all_pig = array;
                alert('Successfull');
            });
        }
    
        $scope.queryAllFarm = function(){
    
            appFactory.queryAllFarm(function(data){
                var array = [];
                for (var i = 0; i < data.length; i++){
                    parseInt(data[i].Key);
                    data[i].Record.Key = parseInt(data[i].Key);
                    array.push(data[i].Record);
                }
                array.sort(function(a, b) {
                    return parseFloat(a.Key) - parseFloat(b.Key);
                });
                $scope.all_farm = array;
            });
        }
    
        $scope.queryAllTransport = function(){
    
            appFactory.queryAllTransport(function(data){
                var array = [];
                for (var i = 0; i < data.length; i++){
                    parseInt(data[i].Key);
                    data[i].Record.Key = parseInt(data[i].Key);
                    array.push(data[i].Record);
                }
                array.sort(function(a, b) {
                    return parseFloat(a.Key) - parseFloat(b.Key);
                });
                $scope.all_transport = array;
            });
        }
    
        $scope.queryPig = function(){
    
            var id = $scope.pig_id;
            console.log($scope.pig_id);
            console.log("==========id========="+ id);
            appFactory.queryPig(id, function(data){
                $scope.query_pig = data;
                console.log("==========id========="+ id);
    
                if ($scope.query_pig == "Could not locate pig"){
                    console.log()
                    $("#error_query").show();
                } else{
                    $("#error_query").hide();
                }
                alert('Successfull');
            });
            
        }
    
        $scope.chainDelete = function(){
    
            var id = $scope.delete_id;
    
            appFactory.chainDelete(id, function(data){
            });
        }
        
        $scope.queryAllTuna = function(){
    
            appFactory.queryAllTuna(function(data){
                var array = [];
                for (var i = 0; i < data.length; i++){
                    parseInt(data[i].Key);
                    data[i].Record.Key = parseInt(data[i].Key);
                    array.push(data[i].Record);
                }
                array.sort(function(a, b) {
                    return parseFloat(a.Key) - parseFloat(b.Key);
                });
                $scope.all_tuna = array;
            });
        }
    
        $scope.queryTuna = function(){
    
            var id = $scope.tuna_id;
    
            appFactory.queryTuna(id, function(data){
                $scope.query_tuna = data;
    
                if ($scope.query_tuna == "Could not locate tuna"){
                    console.log()
                    $("#error_query").show();
                } else{
                    $("#error_query").hide();
                }
            });
        }
        
        $scope.recordFarm = function(){
    
            appFactory.recordFarm($scope.pig, function(data){
                $scope.create_tuna = data;
                $("#success_create").show();
                alert('Successfull');
            });
        }
    
        $scope.recordTransport = function(){
    
            appFactory.recordTransport($scope.pig, function(data){
                $scope.create_transport = data;
                $("#success_create").show();
                alert('Successfull');
            });
        }
    
        $scope.insertTransport = function(){
    
            appFactory.insertTransport($scope.transport, function(data){
                $scope.insert_transport = data;
                if ($scope.insert_transport == "Error: no transport found"){
                    $("#error_holder").show();
                    $("#success_holder").hide();
                    alert('Successfull');
                } else{
                    $("#success_holder").show();
                    $("#error_holder").hide();
                }
    
            });
        }
    
        $scope.insertAbattoir = function(){
    
            appFactory.insertAbattoir($scope.abattoir, function(data){
                $scope.insert_abattoir = data;
                if ($scope.insert_abattoir == "Error: no abattoir found"){
                    $("#error_holder").show();
                    $("#success_holder").hide();
                    alert('Successfull');
                } else{
                    $("#success_holder").show();
                    $("#error_holder").hide();
                }
            });
        }
    
        $scope.insertSupermarket = function(){
    
            appFactory.insertSupermarket($scope.supermarket, function(data){
                $scope.insert_supermarket = data;
                if ($scope.insert_supermarket == "Error: no supermarket found"){
                    $("#error_holder").show();
                    $("#success_holder").hide();
                    alert('Successfull');
                } else{
                    $("#success_holder").show();
                    $("#error_holder").hide();
                }
            });
        }
    
        $scope.insertFarm = function(){
    
            appFactory.insertFarm($scope.farm, function(data){
                $scope.insert_farm = data;
                if ($scope.insert_farm == "Error: no farm found"){
                    $("#error_holder").show();
                    $("#success_holder").hide();
                } else{
                    $("#success_holder").show();
                    $("#error_holder").hide();
                }
            });
        }
    }]);
    
    
}) ();