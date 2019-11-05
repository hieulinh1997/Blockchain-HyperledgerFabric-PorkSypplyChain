// SPDX-License-Identifier: Apache-2.0

'use strict';

var app = angular.module('application',['ngRoute', 'ngStorage'] );
var countUser;
var countChain;
var idLocalStorage;
var idUserLocalStorage;

var getkeyapprove = 0;
var getroleapprove = 0;
var getstateapproveapprove = 0;
var getKeyEditChainID = 0;
var getKeyEditRole = 0;
var getKeyEditStatus = 0;

var getFood;

app.directive("compareTo", function ()  

  {  

      return {  

          require: "ngModel",  

          scope:  

          {  

              repeatPassword: "=compareTo"  

          },  

          link: function (scope, element, attributes, paramval)  

          {  

              paramval.$validators.compareTo = function (val)  

              {  

                  return val == scope.repeatPassword;  

              };  

              scope.$watch("repeatPassword", function ()  

              {  

                  paramval.$validate();  

              });  

          }  

      };  

  });

app.config(function($routeProvider) {
	$routeProvider
	
	.when('/', {
		templateUrl: 'loginAngularJS.html',
		hideMenus: true
	})
	.when('/signup', {
		resolve: {
			"check": function($location, $rootScope){
				if (!$rootScope.loggedIn) {
					$location.path('/');
				}
			}
		},
		
		templateUrl: 'signup.html'
	})
	.when('/roleadmin', {
		resolve: {
			"check": function($location, $rootScope){
				if (!$rootScope.loggedIn) {
					$location.path('/');
				}
			}
		},
		
		templateUrl: 'admin.html'
	})
	.when('/rolefarm', {
		resolve: {
			"check": function($location, $rootScope,){
				if (!$rootScope.loggedIn) {
					$location.path('/');
				}
			}
		},
		templateUrl: 'farm.html'
	})
	.when('/roletransport', {
		resolve: {
			"check": function($location, $rootScope,){
				if (!$rootScope.loggedIn) {
					$location.path('/');
				}
			}
		},
		templateUrl: 'transport.html'
	})
	.when('/roleabattoir', {
		resolve: {
			"check": function($location, $rootScope,){
				if (!$rootScope.loggedIn) {
					$location.path('/');
				}
			}
		},
		templateUrl: 'abattoir.html'
	})
	.when('/rolesupermarket', {
		resolve: {
			"check": function($location, $rootScope,){
				if (!$rootScope.loggedIn) {
					$location.path('/');
				}
			}
		},
		templateUrl: 'supermarket.html'
	})
	.when('/user', {
		resolve: {
			"check": function($location, $rootScope,){
				if (!$rootScope.loggedIn) {
					$location.path('/');
				}
			}
		},
		templateUrl: 'index.html'
	})
	.otherwise({
		redirectTo: '/'
	});
});

//home
(function () {

app.controller('appController', function($scope, $window, appFactory, $location, $rootScope, $timeout, $localStorage){
	
	// $scope.loadCurrentUser = function (){
	// 	$scope.currentUser = User.currentUser;
	// };
	// $scope.loadCurrentUser();
	// $scope.getCurrentUser = $Auth.getCurrentUser;

	// $scope.clickFunc = function(item){
	// 	item.Action = "Hủy"
	// }

	$scope.Export = function () {
		$("#all_pig").table2excel({
			filename: "Table.xls"
		});
	}

	// comfirm email
	$scope.sendForm = function () {

		$scope.msg = "Form Validated";
		
		};

	
	// $scope.orderByField = 'chainid';
	$scope.isDisabled = false;
  	$scope.reverseSort = false;
	
	$scope.logout = function(){
		//Just clear values from scope
		// $scope.username = '';
		// $scope.password = '';
		$location.path('/');
		
	}


	$timeout(function () {
		angular.element('#queryFarm').triggerHandler('click');
	}, 0);
	$timeout(function () {
		angular.element('#queryTransport').triggerHandler('click');
	}, 0);

	$timeout(function () {
		angular.element('#clickCurrentUser').triggerHandler('click');
		// document.querySelector('a').addEventListener('click', function($scope){
		// 	console.log('button clicked');

		// }, false);
	}, 0);
	$timeout(function () {
		angular.element('#queryViewUser').triggerHandler('click');
	}, 0);

	$timeout(function () {
		angular.element('#queryAllUser').triggerHandler('click');
		
	}, 0);

	$timeout(function () {
		angular.element('#queryAllPig').triggerHandler('click');
		
	}, 0);

	$scope.updateSickCure = function(){

		appFactory.updateSickCure($scope.farm, function(data){
			$scope.update_sick_cure = data;
			if ($scope.update_sick_cure == "Error: no sick_cure found"){
				$("#error_update_sick_cure").show();
				$("#success_update_sick_cure").hide();
			} else{
				$("#success_update_sick_cure").show();
				$("#error_update_sick_cure").hide();
			}
		});
		$timeout(function () {
			$('#addSickCure').modal('toggle');
			angular.element('#queryFarm').triggerHandler('click');
			
		}, 5000);
	}
	
	$scope.updateFamer = function(){

		appFactory.updateFamer($scope.farm, function(data){
			$scope.update_famer = data;
			if ($scope.update_famer == "Error: no farm found"){
				$("#error_update_famer").show();
				$("#success_update_famer").hide();
			} else{
				$("#success_update_famer").show();
				$("#error_update_famer").hide();
			}
			
		});
		$timeout(function () {
			$('#addFamer').modal('toggle');
			angular.element('#queryFarm').triggerHandler('click');
			
		}, 5000);

	}

	//updateSpecies
	$scope.updateSpecies = function(){

		appFactory.updateSpecies($scope.farm, function(data){
			$scope.update_species = data;
			if ($scope.update_species == "Error: no farm found"){
				$("#error_update_species").show();
				$("#success_update_species").hide();
			} else{
				$("#success_update_species").show();
				$("#error_update_species").hide();
			}
			
		});
		$timeout(function () {
			$('#addSpecies').modal('toggle');
			angular.element('#queryFarm').triggerHandler('click');
			
		}, 5000);

	}

	//updateFood
	$scope.updateFood = function(){

		appFactory.updateFood($scope.farm, function(data){
			$scope.update_food = data;
			if ($scope.update_food == "Error: no farm found"){
				$("#error_update_food").show();
				$("#success_update_food").hide();
			} else{
				$("#success_update_food").show();
				$("#error_update_food").hide();
			}
			
		});
		$timeout(function () {
			$('#addFood').modal('toggle');
			angular.element('#queryFarm').triggerHandler('click');
			
		}, 5000);

	}

	//updateLocation
	$scope.updateLocation = function(){

		appFactory.updateLocation($scope.farm, function(data){
			$scope.update_location = data;
			if ($scope.update_location == "Error: no farm found"){
				$("#error_update_location").show();
				$("#success_update_location").hide();
			} else{
				$("#success_update_location").show();
				$("#error_update_location").hide();
			}
			
		});
		$timeout(function () {
			$('#addLocation').modal('toggle');
			angular.element('#queryFarm').triggerHandler('click');
			
		}, 5000);

	}

	//updateStartDate
	$scope.updateStartDate = function(){

		appFactory.updateStartDate($scope.farm, function(data){
			$scope.update_start_date = data;
			if ($scope.update_start_date == "Error: no farm found"){
				$("#error_update_start_date").show();
				$("#success_update_start_date").hide();
			} else{
				$("#success_update_start_date").show();
				$("#error_update_start_date").hide();
			}
			
		});
		$timeout(function () {
			$('#addStartDate').modal('toggle');
			angular.element('#queryFarm').triggerHandler('click');
			
		}, 5000);

	}

	//updateEndDate
	$scope.updateEndDate = function(){

		appFactory.updateEndDate($scope.farm, function(data){
			$scope.update_end_date = data;
			if ($scope.update_end_date == "Error: no farm found"){
				$("#error_update_end_date").show();
				$("#success_update_end_date").hide();
			} else{
				$("#success_update_end_date").show();
				$("#error_update_end_date").hide();
			}
			
		});
		$timeout(function () {
			$('#addEndDate').modal('toggle');
			angular.element('#queryFarm').triggerHandler('click');
			
		}, 5000);

	}

	//changeApprove
	
	$scope.changeApprove = function (getkey, getrole, getstateapprove){
		
		getkeyapprove = getkey
		getroleapprove = getrole
		getstateapproveapprove = getstateapprove

		$scope.approveUser();
		// alert("Chờ xử lý ...")

		//reload data 
		$timeout(function () {
		$scope.load();
		}, 5000);
		

		//close modal
		// $timeout(function () {
		// 	$('#approveUser').modal('toggle');
		// }, 7000);

		// if ( el.value === "Phê Duyệt" )
        //     el.value = "Huy";
        // else
        //     el.value = "Phê Duyệt";
	}

	$scope.approveUser = function(){
		// var resultCountChain  = 0;
		appFactory.queryAllUser( function(data){
			var resultCountChain  = 0;
			// console.log('next addChain')
			// var lengthChain = 0;
			
				// for (var i = 0; i < data.length; i++){
					// var lengthChain = (data.length)-1;
					
					// console.log('next trc for1')
			if (  getroleapprove != 'Z.Farm' ){
				// $timeout(function () {
					// console.log('next trc for2')
					resultCountChain = 0;
					console.log('countchain err khong tao chuoi: '+ resultCountChain)
					
					// break;
				// }, 5000);
				// resultCountChain = 1;
				// break;
			} else if(  getroleapprove == 'Z.Farm' && getstateapproveapprove == 'WAITTING' ){
				
				console.log('role=farm resultCountChain: '+resultCountChain)
				resultCountChain = 1;
				// break;
			}
				// }
			if (resultCountChain == 1){
				appFactory.queryAllPig( function(data){
					console.log('next addChain queryAllpig')
						for (var i = 0; i < data.length; i++){
									$localStorage.countChain = data.length+1;
									countChain = $localStorage.countChain;
									
									resultCountChain = 1;
									
									console.log('countChain after for: '+countChain)
									
						}
						resultCountChain = 1;
				});
				
				resultCountChain = 1;
				console.log('countchain if: '+countChain);
				
					$timeout(function () {
						
						$scope.addChain();
						alert('Add chain');
						console.log('add chain success');
					}, 3000);
			}
			// $window.location.reload();
			var checkApprove = 0;
			// for (var i = 0; i < data.length; i++){
				if ( getstateapproveapprove != 'WAITTING') {
					checkApprove = 0;
					// break;
				} else if ( getstateapproveapprove == 'WAITTING') {
					checkApprove = 1;
					// break;
					
					//hủy phê duyệt ở đây
				}
			// }
			if (checkApprove == 1) {
				$timeout(function () {
					appFactory.approveUser($scope.user, function(data){
						$scope.approve_user = data;
						if ($scope.approve_user == "Error: no user found"){
							$("#error_approveUser").show();
							$("#success_approveUser").hide();
						} else{
							$("#success_approveUser").show();
							$("#error_approveUser").hide();
							alert('Duyệt thành công: '+ getkeyapprove);
							
			
						}
						console.log('approve user successful')
						//adddChain
						
						
					});
				}, 3000);
			} else if (checkApprove == 0) {
				// $scope.cancelApproveUser();
				// alert('Đã hũy duyệt')
				alert('Người dùng đã được duyệt');
			}
				
				
				
		});

		

	}

	//cancelApproveUser
	$scope.cancelApproveUser = function(){
		appFactory.cancelApproveUser($scope.user, function(data){
			$scope.cancel_approve_user = data;
			if ($scope.cancel_approve_user == "Error: no user found"){
				$("#error_cancel_approve_user").show();
				$("#success_cancel_approve_user").hide();
			} else{
				$("#success_cancel_approve_user").show();
				$("#error_cancel_approve_user").hide();
				alert('Hủy thành công: '+ getkeyapprove);
				

			}
			console.log('cancel approve user successful')
			
			
			
		});
	}

	//changeChainID
	$scope.changeChainID = function (getkey){
		getKeyEditChainID = getkey;
		$scope.editChainID();
		alert("Chờ xử lý...")

		//reload data 
		$scope.load();

		//close modal
		$timeout(function () {
			$('#editChainID').modal('toggle');
			
			
		}, 5000);
		
	}

	$scope.editChainID = function(){
		
		appFactory.editChainID($scope.user, function(data){
			$scope.edit_chainid = data;
			if ($scope.edit_chainid == "Error: no user found"){
				$("#error_editChainID").show();
				$("#success_editChainID").hide();

			} else{
				$("#success_editChainID").show();
				$("#error_editChainID").hide();

			}
		});
		
	}

	//changePassword
	$scope.changePassword = function (){
		if ($scope.user.password == $scope.repeatPass){
			$scope.editPassword();
			alert("Chờ xử lý...")

			//reload data 
			$scope.load();

			//close modal
			$timeout(function () {
				$('#editPassword').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				
				
			}, 5000);
		} else{
			alert('Mật khẩu không trùng khớp.')
		}
		
	}


	$scope.editPassword = function(){
		
		appFactory.editPassword($scope.user, function(data){
			$scope.edit_password = data;
			
			
				if ($scope.edit_password == "Error: no user found"){
					$("#error_editPassword").show();
					$("#success_editPassword").hide();

				} else{
					$("#success_editPassword").show();
					$("#error_editPassword").hide();

				}
			
		});
		
	}

	//changeEmail
	$scope.changeEmail = function (){
		
		$scope.editEmail();
		alert("Chờ xử lý...")

		//reload data 
		$scope.load();

		//close modal
		$timeout(function () {
			$('#editEmail').modal('toggle');
			angular.element('#queryAllUser').triggerHandler('click');
			
		}, 5000);
		
	}


	$scope.editEmail = function(){
		
		appFactory.editEmail($scope.user, function(data){
			$scope.edit_email = data;
			if ($scope.edit_email == "Error: no user found"){
				$("#error_editEmail").show();
				$("#success_editEmail").hide();

			} else{
				$("#success_editEmail").show();
				$("#error_editEmail").hide();

			}
		});
		
	}
	
	//changeRole
	$scope.changeRole = function (getkey){
		
		getKeyEditRole = getkey

		$scope.editRoles();
		alert("Chờ xử lý...")

		//reload data 
		$scope.load();

		//close modal
		// $timeout(function () {
		// 	$('#editRoles').modal('toggle');
			
			
		// }, 5000);
		
	}


	$scope.editRoles = function(){
		
		appFactory.editRoles($scope.user, function(data){
			$scope.edit_roles = data;
			if ($scope.edit_roles == "Error: no user found"){
				$("#error_editRoles").show();
				$("#success_editRoles").hide();

			} else{
				$("#success_editRoles").show();
				$("#error_editRoles").hide();

			}
		});
		
	}

	//changeStatus
	$scope.changeStatus = function (getkey){
		
		getKeyEditStatus = getkey;

		$scope.editStatus();
		alert("Chờ xử lý...")

		//reload data 
		$scope.load();

		//close modal
		// $timeout(function () {
		// 	$('#editStatus').modal('toggle');
			
		// }, 5000);
		
	}

	$scope.editStatus = function(){
		
		appFactory.editStatus($scope.user, function(data){
			$scope.edit_status = data;
			if ($scope.edit_status == "Error: no user found"){
				$("#error_holder").show();
				$("#success_holder").hide();

			} else{
				$("#success_holder").show();
				$("#error_holder").hide();

			}
		});
		
	}
	
	$scope.load = function() {

		$timeout(function () {
			angular.element('#queryAllUser').triggerHandler('click');
			angular.element('#queryViewUser').triggerHandler('click');
		}, 6000);
	}

	$scope.wrapLogin = function(){
		$scope.submit();
		
		
		$timeout(function () {
			$scope.loginUser();
			
			
		}, 1000);
		

	};
	
	$scope.submit = function( data) {
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

		$scope.registerUser();
		
		
    };
	// end wrap


	
	// đăng ký

	// $scope.reset = function() {
    //     $scope.user = angular.copy();
    // };
    
	$scope.registerUser = function(){
		var idRegister = $scope.user.id;
		var usernameRegister = $scope.user.username;
		var passwordRegister = $scope.user.password;
		var emailRegister = $scope.user.email;
		var rolesRegister = $scope.user.roles;
			
				appFactory.queryAllUser( function(data){
				// $scope.addUser();
				var resultUser  =0;
					for (var i = 0; i < data.length; i++){
						$localStorage.datalength = data.length+1;
							countUser = $localStorage.datalength;
							// console.log('countUser: '+countUser)
						if (usernameRegister == (data[i].Record.username)){
							resultUser = 0;
							break;
						} else if (usernameRegister != (data[i].Record.username)){
							resultUser = 1;
							continue;
						}
						console.log(resultUser);
					}
					if (resultUser == 1){
						alert('Chờ xử lý giao dịch!...');
							$timeout(function () {
								
								$scope.addUser();
								
								for (var i = 0; i < data.length; i++){
									$localStorage.datalength = data.length+1;
									countUser = $localStorage.datalength;
								}
								console.log('countUser: '+countUser);
								// $window.location.reload();
								console.log('localstorage-signup');
							}, 5000);
						// alert('Chờ duyệt: ' + usernameRegister);
					} else if (resultUser == 0){
						alert('user enrolled! Please, register new user');
						
					}
					// $window.location.reload();
					// appFactory.registerUser(usernameRegister, function(data){
			
					// });
			});
	};

	$scope.loginUser = function(){

		var usernameLogin = $scope.usernameLogin;
		var password = $scope.password;
		
		// var rolesLogin = $scope.rolesLogin;
		// var user = $cookie.get(usernameLogin);

			appFactory.queryAllUser( function(data){
				// console.log('login user2');
				console.log(usernameLogin);
				var resultUser = 0;
				var chainidLocalStorage = 0;
				var iduserLocalStorage = 0;
				for (var i = 0; i < data.length; i++){
					// (data[i].username);
					if  (usernameLogin == (data[i].Record.username) && 
						password == (data[i].Record.password) && 
						(data[i].Record.roles) == 'Admin' &&
						(data[i].Record.status) == 'ABLE' &&
						(data[i].Record.approve) == 'APPROVED' ){
						console.log('usernameLogin = user data');
						console.log('xin chao: '+data[i].Record.username);
						resultUser = 1;
						$localStorage.chainidLocalStorage = (data[i].Record.chainid);
						chainidLocalStorage = $localStorage.chainidLocalStorage;
						idLocalStorage = chainidLocalStorage
						//viewuser
						$localStorage.iduserLocalStorage = (data[i].Key);
						iduserLocalStorage = $localStorage.iduserLocalStorage;
						idUserLocalStorage = iduserLocalStorage
						
						
					} else if( usernameLogin == (data[i].Record.username) && 
						password == (data[i].Record.password) &&
						(data[i].Record.roles) == 'Z.Farm' &&
						(data[i].Record.status) == 'ABLE' &&
						(data[i].Record.approve) == 'APPROVED') {
						console.log('Farm');
						console.log('xin chao: ' + data[i].Record.username);
						resultUser = 2;
						$localStorage.chainidLocalStorage = (data[i].Record.chainid);
						chainidLocalStorage = $localStorage.chainidLocalStorage;
						idLocalStorage =chainidLocalStorage;
						console.log('roles login');
						//viewuser
						$localStorage.iduserLocalStorage = (data[i].Key);
						iduserLocalStorage = $localStorage.iduserLocalStorage;
						idUserLocalStorage = iduserLocalStorage
					} else if( usernameLogin == (data[i].Record.username) && 
						password == (data[i].Record.password) &&
						(data[i].Record.roles) == 'Y.Transport' &&
						(data[i].Record.status) == 'ABLE' &&
						(data[i].Record.approve) == 'APPROVED') {
						console.log('Transport');
						console.log('xin chao: ' + data[i].Record.username);
						resultUser = 3;
						$localStorage.chainidLocalStorage = (data[i].Record.chainid);
						chainidLocalStorage = $localStorage.chainidLocalStorage;
						idLocalStorage =chainidLocalStorage;
						//viewuser
						$localStorage.iduserLocalStorage = (data[i].Key);
						iduserLocalStorage = $localStorage.iduserLocalStorage;
						idUserLocalStorage = iduserLocalStorage
					} else if( usernameLogin == (data[i].Record.username) && 
						password == (data[i].Record.password) &&
						(data[i].Record.roles) == 'X.Abattoir' &&
						(data[i].Record.status) == 'ABLE' &&
						(data[i].Record.approve) == 'APPROVED') {
						console.log('Abattoir');
						console.log('xin chao: ' + data[i].Record.username);
						resultUser = 4;
						$localStorage.chainidLocalStorage = (data[i].Record.chainid);
						chainidLocalStorage = $localStorage.chainidLocalStorage;
						idLocalStorage =chainidLocalStorage;
						//viewuser
						$localStorage.iduserLocalStorage = (data[i].Key);
						iduserLocalStorage = $localStorage.iduserLocalStorage;
						idUserLocalStorage = iduserLocalStorage
					} else if( usernameLogin == (data[i].Record.username) && 
						password == (data[i].Record.password) &&
						(data[i].Record.roles) == 'W.Supermarket' &&
						(data[i].Record.status) == 'ABLE' &&
						(data[i].Record.approve) == 'APPROVED') {
						console.log('Supermarket');
						console.log('xin chao: ' + data[i].Record.username);
						resultUser = 5;
						$localStorage.chainidLocalStorage = (data[i].Record.chainid);
						chainidLocalStorage = $localStorage.chainidLocalStorage;
						idLocalStorage =chainidLocalStorage;
						//viewuser
						$localStorage.iduserLocalStorage = (data[i].Key);
						iduserLocalStorage = $localStorage.iduserLocalStorage;
						idUserLocalStorage = iduserLocalStorage
					} else if( usernameLogin == (data[i].Record.username) && 
						password == data[i].Record.password && 
						data[i].Record.approve == 'WAITTING') {
						console.log('Please, waiting for admin approval!');
						resultUser = 6;
					
					}
					// else {
						// return resultUser = 0;
						// console.log('resultUser=0');
					// }

				}
				console.log(resultUser);
				if (resultUser == 1){
					$rootScope.loggedIn = true; //tam
					// $location.path('/')
					console.log('localstorage');
					$localStorage.message = usernameLogin;
					// $localStorage.chainidLocalStorage = chainidLocalStorage;
					$location.path('/roleadmin') //tam
					// console.log('localstorage2');
					// $localStorage.message = usernameLogin;
					$scope.isDisabled = true;
					alert('Successful login: ' + usernameLogin);
					// return usernameLogin;
				} else if (resultUser == 2) {
					$rootScope.loggedIn = true; //tam
					console.log('localstorage');
					$localStorage.message = usernameLogin;
					$location.path('/rolefarm') //tam
					$scope.isDisabled = true;
					alert('Successful login: ' + usernameLogin);
					// $timeout(function () {
					// 	angular.element('#queryFarm').triggerHandler('click');
					// }, 3000);
				} else if (resultUser == 3) {
					$rootScope.loggedIn = true; //tam
					console.log('localstorageTransport');
					$localStorage.message = usernameLogin;
					$location.path('/roletransport') //tam
					$scope.isDisabled = true;
					alert('Successful login: ' + usernameLogin);
					// $timeout(function () {
					// 	angular.element('#queryTransport').triggerHandler('click');
					// }, 0);
				} else if (resultUser == 4) {
					$rootScope.loggedIn = true; //tam
					console.log('localstorageAbattoir');
					$localStorage.message = usernameLogin;
					$location.path('/roleabattoir') //tam
					$scope.isDisabled = true;
					alert('Successful login: ' + usernameLogin);
					$timeout(function () {
						angular.element('#queryAbattoir').triggerHandler('click');
					}, 3000);
				} else if (resultUser == 5) {
					$rootScope.loggedIn = true; //tam
					console.log('localstorageSupermarket');
					$localStorage.message = usernameLogin;
					$location.path('/rolesupermarket') //tam
					$scope.isDisabled = true;
					alert('Successful login: ' + usernameLogin);
					$timeout(function () {
						angular.element('#querySupermarket').triggerHandler('click');
					}, 3000);
				} else if (resultUser == 6) {
					// $rootScope.loggedIn = true; //tam
					// console.log('localstorage1');
					// $localStorage.message = usernameLogin;
					// $location.path('/user') //tam
					alert('Vui lòng chờ admin chấp thuận: ' + usernameLogin);
				} else if (resultUser == 0){
					alert('Fail login with: ' + usernameLogin);
					
				}

				appFactory.loginUser(usernameLogin, function(data){
				});
				// $timeout(function () {
			
				// 	angular.element('#queryFarm').triggerHandler('click');
					
				// }, 0);

			});
			
	}

	$scope.loadCurrentUser = function() {
		$scope.message = $localStorage.message;
		$scope.chainidLocalStorage = $localStorage.chainidLocalStorage;
		$scope.iduserLocalStorage = $localStorage.iduserLocalStorage;
		$timeout(function () {
			angular.element('#clickCurrentUser').triggerHandler('click');
			// angular.element('#queryViewUser').triggerHandler('click');
		}, 0);
		
		
		
	}

	$("#success_update_sick_cure").hide();
	$("#success_create").hide();
	$("#error_update_sick_cure").hide();
	$("#error_query").hide();

	$("#success_update_famer").hide();
	$("#success_create").hide();
	$("#error_update_famer").hide();
	$("#error_query").hide();

	$("#success_update_species").hide();
	$("#success_create").hide();
	$("#error_update_species").hide();
	$("#error_query").hide();

	$("#success_update_food").hide();
	$("#success_create").hide();
	$("#error_update_food").hide();
	$("#error_query").hide();

	$("#success_update_location").hide();
	$("#success_create").hide();
	$("#error_update_location").hide();
	$("#error_query").hide();

	$("#success_update_start_date").hide();
	$("#success_create").hide();
	$("#error_update_start_date").hide();
	$("#error_query").hide();

	$("#success_update_end_date").hide();
	$("#success_create").hide();
	$("#error_update_end_date").hide();
	$("#error_query").hide();

	$("#success_holder").hide();
	$("#success_create").hide();
	$("#error_holder").hide();
	$("#error_query").hide();

	$("#success_editChainID").hide();
	$("#success_create").hide();
	$("#error_editChainID").hide();
	$("#error_query").hide();
	
	$("#success_editRoles").hide();
	$("#success_create").hide();
	$("#error_editRoles").hide();
	$("#error_query").hide();

	$("#success_editPassword").hide();
	$("#success_create").hide();
	$("#error_editPassword").hide();
	$("#error_query").hide();

	$("#success_editEmail").hide();
	$("#success_create").hide();
	$("#error_editEmail").hide();
	$("#error_query").hide();

	$("#success_approveUser").hide();
	$("#success_create").hide();
	$("#error_approveUser").hide();
	$("#error_query").hide();

	$("#success_cancel_approve_user").hide();
	$("#success_create").hide();
	$("#error_cancel_approve_user").hide();
	$("#error_query").hide();

	$("#success_chain").hide();
	$("#success_create").hide();
	$("#error_chain").hide();
	$("#error_query").hide();

	
	$scope.addUser = function(){

		appFactory.addUser($scope.user, function(data){
			$scope.create_tuna = data;
			$("#success_create").show();
			
			alert('Successfull! Chờ admin duyệt.');
			
		});
	}

	$scope.addChain = function(){

		appFactory.addChain($scope.chain, function(data){
			$scope.create_chain = data;
			$("#success_create").show();
			
			alert('Đã tạo chuỗi mới: '+countChain+' cho ID: '+ getkeyapprove +' có vai trò Farm ');
			
		});
		$timeout(function () {
			angular.element('#queryAllPig').triggerHandler('click');
			
		}, 5000);
	}

	// $scope.addSentUser = function(){

	// 	appFactory.addSentUser($scope.user, function(data){
	// 		$scope.create_tuna = data;
	// 		$("#success_create").show();
	// 		// alert('Successfull');
	// 	});
	// }
	
	$timeout(function () {
		angular.element('#clickAddUser').triggerHandler('click');
	}, 0);
	$scope.loadAddUser = function() {
		// $scope.datalength = $localStorage.datalength+1;
		// countUser = $localStorage.datalength
		$timeout(function () {
			angular.element('#clickAddUser').triggerHandler('click');
		}, 0);
		
	}
	$scope.queryAllUser = function(){

		appFactory.queryAllUser(function(data){
			var array = [];
			
			for (var i = 0; i < data.length; i++){
				parseInt(data[i].Key);
				// data[i].Record.Key = parseInt(data[i].Key);
				data[i].Record.Key = (data[i].Key);
				array.push(data[i].Record);
				// $localStorage.datalength = data.length+1;
				// countUser = $localStorage.datalength;
			}
			// console.log('all use');
			array.sort(function(a, b) {
				// console.log(parseInt((a.Key.replace( /^\D+/g, ''))))
				// return parseFloat(a.Key) - parseFloat(b.Key);
				return (a.Key.replace( /^\D+/g, '')) - (b.Key.replace( /^\D+/g, ''));	
			
			});
			$scope.all_user = array;
			
		});
		// alert('Successfull');
	}

	// $scope.querySentUser = function(){

	// 	appFactory.querySentUser(function(data){
	// 		var array = [];
	// 		for (var i = 0; i < data.length; i++){
	// 			parseInt(data[i].Key);
	// 			// data[i].Record.Key = parseInt(data[i].Key);
	// 			data[i].Record.Key = (data[i].Key);
	// 			array.push(data[i].Record);
	// 		}
	// 		// console.log('all use');
	// 		array.sort(function(a, b) {
	// 			// return parseFloat(a.Key) - parseFloat(b.Key);
	// 			return (a.Key) + (b.Key);
	// 		});
	// 		$scope.all_sent_user = array;
			
	// 	});
	// 	alert('Successfull, query all user waiting approve');
	// }

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
			// alert('Successfull');
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
		var getRole = $scope.getRole;
		console.log($scope.pig_id);
		console.log("==========id========="+ id);
		console.log("==========getrole========="+getRole);
		appFactory.queryPig(id, function(data){
			$scope.query_pig = data;
			console.log("==========id========="+ id);
			console.log("==========getrole========="+getRole);

			if ($scope.query_pig == "Could not locate pig"){
				console.log()
				$("#error_query").show();
			} else{
				$("#error_query").hide();
			}
			// alert('Successfull');
		});
		
	}

	

	// $scope.chainDelete = function(){

	// 	var id = $scope.delete_id;

	// 	appFactory.chainDelete(id, function(data){
	// 	});
	// }
	
	// $scope.queryAllTuna = function(){

	// 	appFactory.queryAllTuna(function(data){
	// 		var array = [];
	// 		for (var i = 0; i < data.length; i++){
	// 			parseInt(data[i].Key);
	// 			data[i].Record.Key = parseInt(data[i].Key);
	// 			array.push(data[i].Record);
	// 		}
	// 		array.sort(function(a, b) {
	// 		    return parseFloat(a.Key) - parseFloat(b.Key);
	// 		});
	// 		$scope.all_tuna = array;
	// 	});
	// }

	// $scope.queryTuna = function(){

	// 	var id = $scope.tuna_id;

	// 	appFactory.queryTuna(id, function(data){
	// 		$scope.query_tuna = data;

	// 		if ($scope.query_tuna == "Could not locate tuna"){
	// 			console.log()
	// 			$("#error_query").show();
	// 		} else{
	// 			$("#error_query").hide();
	// 		}
	// 	});
	// }
	
	$scope.recordFarm = function(){

		appFactory.recordFarm($scope.pig, function(data){
			$scope.create_tuna = data;
			$("#success_create").show();
			alert('Successfull');
		});
	}

	$scope.initChainBtn = function(){
		$scope.initChain();
		// $timeout(function () {
		// 	angular.element('#queryAllPig').triggerHandler('click');
			
		// }, 5000);
		// console.log('timeouted')
	}

	$scope.initChain = function(){
		var chainID = $scope.chain.id;
		appFactory.queryAllPig( function(data){
			var resultUser  =0;
					for (var i = 0; i < data.length; i++){
						if (chainID == (data[i].Key)){
							resultUser = 0;
							break;
						} else if (chainID != (data[i].Key)){
							resultUser = 1;
							continue;
						}
						console.log(resultUser);
					}
					if (resultUser == 1){
						alert('Chờ xử lý giao dịch!...');

						appFactory.initChain($scope.chain, function(data){
							$scope.create_chain = data;
							$("#success_chain").show();
							
							
						});
						$timeout(function () {
							angular.element('#queryAllPig').triggerHandler('click');
							
						}, 4000);

						alert('Tạo thành công chuỗi. ID là: '+chainID);
					} else if (resultUser == 0){
						alert('ID chuỗi đã tồn tại. Nhập ID mới');
						
					}
		});
		
		
	}

	

	$scope.recordTransport = function(){

		appFactory.recordTransport($scope.pig, function(data){
			$scope.create_transport = data;
			$("#success_create").show();
			alert('Successfull');
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

	//farm.html
	$scope.insertFarm = function(){
		var idFarm = $scope.farm.id;
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

		$timeout(function () {
			$('#insertFarm').modal('toggle');
			var id = $localStorage.chainidLocalStorage;
			// appFactory.queryFarm(id, function(data){
			// 	$scope.query_farm = data;
	
			// 	if ($scope.query_farm == "Could not locate farm id"){
			// 		console.log()
			// 		$("#error_query").show();
			// 	} else{
			// 		$("#error_query").hide();
			// 	}
			// });
			angular.element('#queryFarm').triggerHandler('click');
			
		}, 4000);
	}

	//queryViewUser
	$scope.queryViewUser = function(){
		var getFamer = $scope.getFamer;
		var id = $localStorage.iduserLocalStorage;
		console.log("==========id========="+ id);
		console.log("==========getrole queryviewuser========="+getFamer);

		appFactory.queryViewUser(id, function(data){
			$scope.query_view_user = data;

			if ($scope.query_view_user == "Could not locate user id"){
				console.log()
				$("#error_query").show();
			} else{
				$("#error_query").hide();
			}
			
		});
	}

	$scope.queryFarm = function(){

		var id = $localStorage.chainidLocalStorage;
		getFood = query_farm.food;
		console.log("==========chainid========="+ id);
		console.log("==========getFood========="+ getFood);

		appFactory.queryFarm(id, function(data){

			$scope.query_farm = data;

			if ($scope.query_farm == "Could not locate farm id"){
				console.log()
				$("#error_query").show();
			} else{
				$("#error_query").hide();
			}
			
		});
	}

	//transport.html
	$scope.insertTransport = function(){
		var idTransport = $scope.transport.id;

		appFactory.insertTransport($scope.transport, function(data){
			$scope.insert_transport = data;
			if ($scope.insert_transport == "Error: no transport found"){
				$("#error_holder").show();
				$("#success_holder").hide();
				
			} else{
				$("#success_holder").show();
				$("#error_holder").hide();
				alert('Successfull');
			}

		});

		$timeout(function () {
			$('#insertTransport').modal('toggle');
			// var id = $localStorage.chainidLocalStorage;
			// appFactory.queryTransport(id, function(data){
			// 	$scope.query_transport = data;
	
			// 	if ($scope.query_transport == "Could not locate transport id"){
			// 		console.log()
			// 		$("#error_query").show();
			// 	} else{
			// 		$("#error_query").hide();
			// 	}
			// });
			angular.element('#queryTransport').triggerHandler('click');
			
		}, 5000);
	}

	
	
	$scope.queryTransport = function(){
		// var getCompany = $localStorage.query_transport.company
		var id = $localStorage.chainidLocalStorage;
		console.log("==========id========="+ id);
		appFactory.queryTransport(id, function(data){
			$scope.query_transport = data;

			if ($scope.query_transport == "Could not locate transport id"){
				console.log()
				$("#error_query").show();
			} else{
				$("#error_query").hide();
			}
			// alert('Successfull');
			
		});
		
		
	}

	//abattoir.html
	$scope.insertAbattoir = function(){
		var idAbattoir = $scope.abattoir.id;
		appFactory.insertAbattoir($scope.abattoir, function(data){
			$scope.insert_abattoir = data;
			if ($scope.insert_abattoir == "Error: no abattoir found"){
				$("#error_holder").show();
				$("#success_holder").hide();
			} else{
				$("#success_holder").show();
				$("#error_holder").hide();
			}
		});
		
		$timeout(function () {
			$('#insertAbattoir').modal('toggle');
			// var id = $localStorage.chainidLocalStorage;
			// appFactory.queryAbattoir(id, function(data){
			// 	$scope.query_abattoir = data;
	
			// 	if ($scope.query_abattoir == "Could not locate abattoir id"){
			// 		console.log()
			// 		$("#error_query").show();
			// 	} else{
			// 		$("#error_query").hide();
			// 	}
			// });
			angular.element('#queryAbattoir').triggerHandler('click');
			
		}, 5000);
	}
	$scope.queryAbattoir = function(){

		var id = $localStorage.chainidLocalStorage;
		console.log("==========id========="+ id);
		
		appFactory.queryAbattoir(id, function(data){
			$scope.query_abattoir = data;

			if ($scope.query_abattoir == "Could not locate abattoir id"){
				console.log()
				$("#error_query").show();
			} else{
				$("#error_query").hide();
			}
			
		});
	}

	//supermarket.html
	$scope.insertSupermarket = function(){
		var idSupermarket = $scope.supermarket.id;
		appFactory.insertSupermarket($scope.supermarket, function(data){
			$scope.insert_supermarket = data;
			if ($scope.insert_supermarket == "Error: no supermarket found"){
				$("#error_holder").show();
				$("#success_holder").hide();
			} else{
				$("#success_holder").show();
				$("#error_holder").hide();
			}
		});
		
		$timeout(function () {
			$('#insertSupermarket').modal('toggle');
			// var id = $localStorage.chainidLocalStorage;
			// appFactory.querySupermarket(id, function(data){
			// 	$scope.query_supermarket = data;
	
			// 	if ($scope.query_supermarket == "Could not locate supermarket id"){
			// 		console.log()
			// 		$("#error_query").show();
			// 	} else{
			// 		$("#error_query").hide();
			// 	}
			// });
			angular.element('#querySupermarket').triggerHandler('click');
			
		}, 5000);
	}
	$scope.querySupermarket = function(){

		var id = $localStorage.chainidLocalStorage;
		console.log("==========id========="+ id);
		
		appFactory.querySupermarket(id, function(data){
			$scope.query_supermarket = data;

			if ($scope.query_supermarket == "Could not locate supermarket id"){
				console.log()
				$("#error_query").show();
			} else{
				$("#error_query").hide();
			}
			
		});
	}

});
})();

// Angular Factory
app.factory('appFactory', function($http){

	var factory = {};

	factory.updateSickCure = function(data, callback){

		var farm = idLocalStorage + "-" + data.sick_cure;

    	$http.get('/update_sick_cure/'+farm).success(function(output){
			callback(output)
		});
	}
	
	factory.updateFamer = function(data, callback){
		
		var farm = idLocalStorage + "-" + data.famer;

    	$http.get('/update_famer/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateSpecies = function(data, callback){
		
		var farm = idLocalStorage + "-" + data.species;

    	$http.get('/update_species/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateFood = function(data, callback){
		
		var farm = idLocalStorage + "-" + data.food;

    	$http.get('/update_food/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateLocation = function(data, callback){
		
		var farm = idLocalStorage + "-" + data.location;

    	$http.get('/update_location/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateStartDate = function(data, callback){
		
		var farm = idLocalStorage + "-" + data.startdate;

    	$http.get('/update_start_date/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateEndDate = function(data, callback){
		
		var farm = idLocalStorage + "-" + data.enddate;

    	$http.get('/update_end_date/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.editPassword = function(data, callback){

		var user = data.id + "-" + data.password  ;

    	$http.get('/edit_password/'+user).success(function(output){
			callback(output)
		});
	}

	factory.editEmail = function(data, callback){

		var user = data.id + "-" + data.email  ;

    	$http.get('/edit_email/'+user).success(function(output){
			callback(output)
		});
	}

	factory.editChainID = function(data, callback){

		var user = getKeyEditChainID + "-" + data.editchainid  ;

    	$http.get('/edit_chainid/'+user).success(function(output){
			callback(output)
		});
	}

	factory.editRoles = function(data, callback){

		var user = getKeyEditRole + "-" + data.editroles  ;

    	$http.get('/edit_roles/'+user).success(function(output){
			callback(output)
		});
	}

	factory.editStatus = function(data, callback){

		var user = getKeyEditStatus + "-" + data.editstatus  ;

    	$http.get('/edit_status/'+user).success(function(output){
			callback(output)
		});
	}

	factory.approveUser = function(data, callback){

		var user = getkeyapprove + "-" + "ABLE" + "-" + "APPROVED" ;

    	$http.get('/approve_user/'+user).success(function(output){
			callback(output)
		});
	}

	factory.cancelApproveUser = function(data, callback){

		var user = getkeyapprove + "-" + "DISABLE" + "-" + "WAITTING" ;

    	$http.get('/cancel_approve_user/'+user).success(function(output){
			callback(output)
		});
	}

	// registerUser
	factory.registerUser = function(username, callback){
    	$http.get('/sign_up/'+username).success(function(output){
			callback(output)
		});
	}

	factory.addUser = function(data, callback){

		var user = "user"+countUser + "-" + data.username + "-" + data.password + "-" + data.email + "-" + "NULL" + "-" + data.roles + "-" + "DISABLE" + "-" + "WAITTING";

    	$http.get('/add_user/'+user).success(function(output){
			callback(output)
		});
	}

	factory.addChain = function(data, callback){

		var chain = countChain + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null";

    	$http.get('/add_chain/'+chain).success(function(output){
			callback(output)
		});
	}
	// factory.addSentUser = function(data, callback){

	// 	var user = data.id + "-" + data.username + "-" + data.password + "-" + data.email + "-" + "NULL" + "-" + "DISABLE" + "-" + "WAIT";

    // 	$http.get('/add_sent_user/'+user).success(function(output){
	// 		callback(output)
	// 	});
	// }

	factory.queryAllUser = function(callback){

    	$http.get('/get_all_user/').success(function(output){
			callback(output)
		});
	}

	// factory.querySentUser = function(callback){

    // 	$http.get('/get_all_sent_user/').success(function(output){
	// 		callback(output)
	// 	});
	// }

	factory.queryAllPig = function(callback){

    	$http.get('/get_all_pig/').success(function(output){
			callback(output)
		});
	}
	factory.queryAllFarm = function(callback){

    	$http.get('/get_all_farm/').success(function(output){
			callback(output)
		});
	}

	factory.queryAllTransport = function(callback){

    	$http.get('/get_all_transport/').success(function(output){
			callback(output)
		});
	}
	
	factory.queryPig = function(id, callback){
    	$http.get('/get_pig/'+id).success(function(output){
			callback(output)
		});
	}

	// loginUser
	factory.loginUser = function(username, callback){
    	$http.get('/login/'+username).success(function(output){
			callback(output)
		});
	}

	// factory.chainDelete = function(id, callback){
    // 	$http.get('/chain_delete/'+id).success(function(output){
	// 		callback(output)
	// 	});
	// }

	// factory.queryAllTuna = function(callback){

    // 	$http.get('/get_all_tuna/').success(function(output){
	// 		callback(output)
	// 	});
	// }

	// factory.queryTuna = function(id, callback){
    // 	$http.get('/get_tuna/'+id).success(function(output){
	// 		callback(output)
	// 	});
	// }

	factory.recordFarm = function(data, callback){

		var pig = data.id + "-" + data.qrcode + "-" + data.famer + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_location + "-" + data.start_date_of_farming + "-" + data.end_date_of_farming;

    	$http.get('/add_pig/'+pig).success(function(output){
			callback(output)
		});
	}

	factory.initChain = function(data, callback){

		// var chain = data.id + "-" + data.qrcode + "-" + data.famer + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_location + "-" + data.start_date_of_farming + "-" + data.end_date_of_farming + "-" + data.company + "-" + data.transporter + "-" + data.vehicle + "-" + data.trouble + "-" + data.solution + "-" + data.transport_qualified + "-" + data.time + "-" + data.abattoir_name + "-" + data.abattoir_location + "-" + data.abattoir_qualified + "-" + data.peck_time + "-" + data.supermarket_name + "-" + data.supermarket_qualified + "-" + data.price + "-" + data.quantity_remaining + "-" + data.manufacturing_date + "-" + data.expiry_date;
		var chain = data.id + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null";

    	$http.get('/init_chain/'+chain).success(function(output){
			callback(output)
		});
	}

	factory.initChainWithFarm = function(data, callback){

		// var chain = data.id + "-" + data.qrcode + "-" + data.famer + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_location + "-" + data.start_date_of_farming + "-" + data.end_date_of_farming + "-" + data.company + "-" + data.transporter + "-" + data.vehicle + "-" + data.trouble + "-" + data.solution + "-" + data.transport_qualified + "-" + data.time + "-" + data.abattoir_name + "-" + data.abattoir_location + "-" + data.abattoir_qualified + "-" + data.peck_time + "-" + data.supermarket_name + "-" + data.supermarket_qualified + "-" + data.price + "-" + data.quantity_remaining + "-" + data.manufacturing_date + "-" + data.expiry_date;
		var chain = data.id + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null";

    	$http.get('/init_chain/'+chain).success(function(output){
			callback(output)
		});
	}

	

	factory.recordTransport = function(data, callback){

		var pig = data.id + "-" + data.company + "-" + data.transporter + "-" + data.vehicle + "-" + data.trouble + "-" + data.solution + "-" + data.transport_qualified + "-" + data.time;

    	$http.get('/add_transport/'+pig).success(function(output){
			callback(output)
		});
	}

	//queryViewUser
	factory.queryViewUser = function(id, callback){
    	$http.get('/query_view_user/'+id).success(function(output){
			callback(output)
		});
	}
	
	// farml.html
	factory.insertFarm = function(data, callback){
		
		var farm = idLocalStorage + "-" + "null" + "-" + data.famer + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_location + "-" + data.start_date_of_farming + "-" + data.end_date_of_farming;

    	$http.get('/insert_farm/'+farm).success(function(output){
			callback(output)
		});
	}
	factory.queryFarm = function(id, callback){
    	$http.get('/query_farm/'+id).success(function(output){
			callback(output)
		});
	}

	//transport.html
	factory.insertTransport = function(data, callback){

		var transport = idLocalStorage + "-" + data.company + "-" + data.transporter + "-" + data.vehicle + "-" + data.trouble + "-" + data.solution + "-" + data.transport_qualified + "-" + data.time;

    	$http.get('/insert_transport/'+transport).success(function(output){
			callback(output)
		});
	}
	factory.queryTransport = function(id, callback){
    	$http.get('/query_transport/'+id).success(function(output){
			callback(output)
		});
	}

	//abattoir.html
	factory.insertAbattoir = function(data, callback){

		var abattoir = idLocalStorage + "-" + data.abattoir_name + "-" + data.abattoir_location + "-" + data.abattoir_qualified + "-" + data.peck_time;

    	$http.get('/insert_abattoir/'+abattoir).success(function(output){
			callback(output)
		});
	}
	factory.queryAbattoir = function(id, callback){
    	$http.get('/query_abattoir/'+id).success(function(output){
			callback(output)
		});
	}

	// supermarket.html
	factory.insertSupermarket = function(data, callback){

		var supermarket = idLocalStorage + "-" + data.supermarket_name + "-" + data.supermarket_qualified + "-" + data.price + "-" + data.quantity_remaining + "-" + data.manufacturing_date + "-" + data.expiry_date;

    	$http.get('/insert_supermarket/'+supermarket).success(function(output){
			callback(output)
		});
	}
	factory.querySupermarket = function(id, callback){
    	$http.get('/query_supermarket/'+id).success(function(output){
			callback(output)
		});
	}



	return factory;
});



