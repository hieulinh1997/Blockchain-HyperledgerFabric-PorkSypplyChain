// SPDX-License-Identifier: Apache-2.0

'use strict';



var app = angular.module('application',['ngSanitize','angularUtils.directives.dirPagination','ngRoute', 'ngStorage'] );


var gethms;


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
	.when('/login', {
		templateUrl: 'login.html'
		
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
		
		templateUrl: 'admin.html',
		controller: "appController"
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
app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});


(function () {

app.controller('appController',function($scope, $window, appFactory, $location, $rootScope, $timeout, $localStorage, $filter){
	
	$scope.currentPage = 0;
    $scope.pageSize = 1000;
    $scope.data = [];
    $scope.q = '';
    
    $scope.getData = function () {
      // needed for the pagination calc
      // https://docs.angularjs.org/api/ng/filter/filter
      return $filter('filter')($scope.data, $scope.q)
     /* 
       // manual filter
       // if u used this, remove the filter from html, remove above line and replace data with getData()
       
        var arr = [];
        if($scope.q == '') {
            arr = $scope.data;
        } else {
            for(var ea in $scope.data) {
                if($scope.data[ea].indexOf($scope.q) > -1) {
                    arr.push( $scope.data[ea] );
                }
            }
        }
        return arr;
       */
    }
    
    $scope.numberOfPages=function(){
        return Math.ceil($scope.getData().length/$scope.pageSize);                
    }
    
    for (var i=0; i<countUser; i++) {
		$scope.data.push("Item "+i);
		console.log('....................'+countUser)
    }
    
   
	
	
	$scope.email = "";
    
    $scope.$on("fileProgress", function(e, progress) {
      $scope.progress = progress.loaded / progress.total;
    });
	
	$scope.logOut = function () {
        console.log("kliknuto na Log Out");
        appFactory.logOut(function (data) {
            console.log(data);
            if (data.message == "ok") {
                $location.path("/");
            }
        });
    }

	$scope.Export = function () {
		$("#all_pig").table2excel({
			filename: "Table.xls"
		});
	}

	// comfirm email
	$scope.sendForm = function () {

		$scope.msg = "Form Validated";
		
		};

	
	// $scope.orderByField = '$index';
	$scope.isDisabled = false;
  	$scope.reverseSort = false;
	
	// $scope.logout = function(){
	// 	$location.path('/');
		
	// }
	// $scope.currentPage = 1;
	// $scope.pageSize = 3;
	//Here you can write the code to make ajax and get the records from database according to currentPage and page size.
	
	// $scope.pageChangeHandler = function(num) {
	// 	console.log('going to page ' + num);
	//   };


	// $scope.templateUrl = "include-2.html";
	// $scope.pageChangeHandler = function(num) {
	// 	console.log('going to page ' + num);
	// };
	// $scope.pageChangeHandler = function(num) {
	// 	console.log('meals page changed to ' + num);
	//   };
	  

	


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
	}, 1000);

	$timeout(function () {
		angular.element('#queryAllUser').triggerHandler('click');
		
	}, 0);

	$timeout(function () {
		angular.element('#queryAllPig').triggerHandler('click');
		angular.element('#queryAllHistoryTxID').triggerHandler('click');
		
	}, 0);

	$timeout(function () {
		angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
		angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
		angular.element('#queryAllPigWithAccountAbattoir').triggerHandler('click');
		angular.element('#queryAllPigWithAccountSupermarket').triggerHandler('click');
	}, 0);

	// $scope.getPigID = function(getpigid, account){
	// 	getPigID =getpigid;
	// 	getAccountCurrent = account
	// 	console.log('===============================================getPigID==============================================='+getPigID)
		
	// }

	$scope.getKeyForUpdateChainId = function(getkey, getusername, getchainid, getroles ){
		getKeyForUpdateChainId =getkey;
		getUsernameWhenUpdateChainid = getusername
		getRoleWhenUpdateChainid = getroles
		getChainidWhenUpdateChainid = getchainid
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyChainId" class="p-getkey">` + getkey + `</span>`;
    	$("#editChainID").find(".modal-body-getkey").html(parag);
		$("#success_editChainID").hide();
		// console.log('getChainidWhenUpdateChainid : '+getChainidWhenUpdateChainid)
		
	}

	$scope.getKeyForUpdateRoles = function(getkey){
		// getKeyForUpdateRoles =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyRoles" class="p-getkey">` + getkey + `</span>`;
    	$("#editRoles").find(".modal-body-getkey").html(parag);
		
	}
	$scope.getKeyForUpdateStatus = function(getkey){
		// getKeyForUpdateStatus =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyStatus" class="p-getkey">` + getkey + `</span>`;
    	$("#editStatus").find(".modal-body-getkey").html(parag);
		
		
	}

	$scope.getKeyForUpdateFamer = function(getkey, farm_account){
		getKeyForUpdateFamer =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyFamer" class="p-getkey">` + getkey + `</span>`;
    	$("#addFamer").find(".modal-body-getkey").html(parag);
		// getFarmAccountForUpdateSpecies = farm_account;
		
	}

	$scope.getKeyForUpdateSpecies = function(getkey, farm_account){
		getKeyForUpdateSpecies =getkey;
		getFarmAccountForUpdateSpecies = farm_account;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeySpecies" class="p-getkey">` + getkey + `</span>`;
    	$("#addSpecies").find(".modal-body-getkey").html(parag);
		
	}

	$scope.getKeyForUpdateFood = function(getkey, getfood){
		getKeyForUpdateFood =getkey;
		getFoodForUpdateFood = getfood;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyFood" class="p-getkey">` + getkey + `</span>`;
    	$("#addFood").find(".modal-body-getkey").html(parag);

		
	}

	$scope.getKeyForUpdateSickCure = function(getkey, getsickcure){
		getKeyForUpdateSickCure =getkey;
		getSickCureForUpdateSickCure = getsickcure;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeySickCure" class="p-getkey">` + getkey + `</span>`;
    	$("#addSickCure").find(".modal-body-getkey").html(parag);
		
	}
	$scope.getKeyForUpdateFarmQualified = function(getkey){
		getKeyForUpdateFarmQualified =getkey;
		// getFarmQualifiedForUpdateSickCure = getfarmqualified;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyFarmQualified" class="p-getkey">` + getkey + `</span>`;
    	$("#addFarmQualified").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateLocation = function(getkey){
		getKeyForUpdateLocation =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyLocation" class="p-getkey">` + getkey + `</span>`;
    	$("#addLocation").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateStartDate = function(getkey){
		getKeyForUpdateStartDate =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyStartDate" class="p-getkey">` + getkey + `</span>`;
    	$("#addStartDate").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateEndDate = function(getkey){
		getKeyForUpdateEndDate =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyEndDate" class="p-getkey">` + getkey + `</span>`;
    	$("#addEndDate").find(".modal-body-getkey").html(parag);
	}

	//transport
	$scope.getKeyForUpdateCompany = function(getkey){
		getKeyForUpdateCompany =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyCompany" class="p-getkey">` + getkey + `</span>`;
    	$("#addCompany").find(".modal-body-getkey").html(parag);
	}

	$scope.getKeyForUpdateTransporter = function(getkey){
		getKeyForUpdateTransporter =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyTransporter" class="p-getkey">` + getkey + `</span>`;
    	$("#addTransporter").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateVehicle = function(getkey){
		getKeyForUpdateVehicle =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyVehicle" class="p-getkey">` + getkey + `</span>`;
    	$("#addVehicle").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateTransportTroubleSolution = function(getkey){
		getKeyForUpdateTransportTroubleSolution =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyTransportTroubleSolution" class="p-getkey">` + getkey + `</span>`;
    	$("#addTransportTroubleSolution").find(".modal-body-getkey").html(parag);
	}

	$scope.getKeyForUpdateTransportQualified = function(getkey){
		getKeyForUpdateTransportQualified =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyTransportQualified" class="p-getkey">` + getkey + `</span>`;
    	$("#addTransportQualified").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateTime = function(getkey){
		getKeyForUpdateTime =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyUpdateTime" class="p-getkey">` + getkey + `</span>`;
    	$("#addTime").find(".modal-body-getkey").html(parag);
	}

	$scope.getKeyForUpdateAbattoirName = function(getkey){
		getKeyForUpdateAbattoirName =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyAbattoirName" class="p-getkey">` + getkey + `</span>`;
    	$("#addAbattoirName").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateAbattoirTroubleSolution = function(getkey){
		getKeyForUpdateAbattoirTroubleSolution =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyAbattoirTroubleSolution" class="p-getkey">` + getkey + `</span>`;
    	$("#addAbattoirTroubleSolution").find(".modal-body-getkey").html(parag);
	}

	$scope.getKeyForUpdateAbattoirLocation = function(getkey){
		getKeyForUpdateAbattoirLocation =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyAbattoirLocation" class="p-getkey">` + getkey + `</span>`;
    	$("#addAbattoirLocation").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateAbattoirQualified = function(getkey){
		getKeyForUpdateAbattoirQualified =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyAbattoirQualified" class="p-getkey">` + getkey + `</span>`;
    	$("#addAbattoirQualified").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdatePeckTime = function(getkey){
		getKeyForUpdatePeckTime =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyPeckTime" class="p-getkey">` + getkey + `</span>`;
    	$("#addPeckTime").find(".modal-body-getkey").html(parag);
	}

	$scope.getKeyForUpdateSupermarketName = function(getkey){
		getKeyForUpdateSupermarketName =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeySupermarketName" class="p-getkey">` + getkey + `</span>`;
		$("#addSupermarketName").find(".modal-body-getkey").html(parag);
		console.log('getkeyupdateSupermargetkeyetkeyupdateSupermarketNamegetkeyupdateSupermarketName'+getkey)
	}

	$scope.getKeyForUpdateSupermarketTroubleSolution = function(getkey){
		getKeyForUpdateSupermarketTroubleSolution =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeySupermarketTroubleSolution" class="p-getkey">` + getkey + `</span>`;
    	$("#addSupermarketTroubleSolution").find(".modal-body-getkey").html(parag);
	}

	$scope.getKeyForUpdateSupermarketQualified = function(getkey){
		getKeyForUpdateSupermarketQualified =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeySupermarketQualified" class="p-getkey">` + getkey + `</span>`;
    	$("#addSupermartketQualified").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdatePrice = function(getkey){
		getKeyForUpdatePrice =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyPrice " class="p-getkey">` + getkey + `</span>`;
    	$("#addPrice").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateQuantityRemaining = function(getkey){
		getKeyForUpdateQuantityRemaining =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyQuantityRemaining" class="p-getkey">` + getkey + `</span>`;
    	$("#addSupermartketQuantityRemaining").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateMFG = function(getkey){
		getKeyForUpdateMFG =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyMFG" class="p-getkey">` + getkey + `</span>`;
    	$("#addMFG").find(".modal-body-getkey").html(parag);
	}
	$scope.getKeyForUpdateEXP = function(getkey){
		getKeyForUpdateEXP =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyEXP" class="p-getkey">` + getkey + `</span>`;
    	$("#addEXP").find(".modal-body-getkey").html(parag);
	}

	// $scope.getKeyForUpdateWhenUpdateAvat = function(){
	// 	var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho ID người dùng: </label>`+`<span class="p-getkey">` + getkey + `</span>`;
	// 	$("#editPassword").find(".modal-body-getkey").html(parag);
	// }

	$scope.getKeyForUpdateWhenUpdatePassword = function(getkey){
		// getKeyForUpdateWhenUpdatePassword =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+` `+`<span id="getKeyPassword" class="p-getkey">` + getkey + `</span>`;
		$("#editPassword").find(".modal-body-getkey").html(parag);
	}

	$scope.getKeyForUpdateWhenUpdateEmail = function(getkey){
		// getKeyForUpdateWhenUpdateEmail =getkey;
		var parag = `<label class="lb-getkey"> Bạn muốn cập nhật cho người dùng có ID: </label>`+ ` `+`<span id="getKeyPassword" class="p-getkey">` + getkey + `</span>`;
		$("#editEmail").find(".modal-body-getkey").html(parag);
		
	}

	$scope.deleteUser = function () {
		alert('Bạn chắc chắn?');
		var getkey = $('#deleteUser .modal-body-getkey span').text();
		var getIndex = getkey
		console.log("getIndex:"+getIndex);
		// var x = parseInt(index);
		var x = getIndex.substring(4,6);
		console.log("x:"+x);

        var user = $scope.all_user[x-1];
        console.log(user);
        appFactory.deleteUser(user, function (data) {
			console.log("user obrisan");
			$timeout(function () {
				angular.element('#queryAllUser').triggerHandler('click');
			}, 2000);
        });
    }

	

	$scope.updateSickCure = function(getkey){
		// getKeyUpdateSickCure =getkey;
		var Job = "Cập nhật bệnh & chữa trị ở giai đoạn nông trại";
		appFactory.updateSickCure($scope.farm, function(data){
			$scope.update_sick_cure = data;
			if ($scope.update_sick_cure == "Error: no sick_cure found"){
				$("#error_update_sick_cure").show();
				$("#success_update_sick_cure").hide();
			} else{
				$("#success_update_sick_cure").show();
				$("#error_update_sick_cure").hide();
			}
			$timeout(function () {
				// $('#addSickCure').modal('toggle');
				// angular.element('#queryFarm').triggerHandler('click');
				angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
	
				appFactory.addHistoryTxID(data, Job, function(data){
				$scope.create_history = data;
				$("#success_create").show();
				
				// alert('Hoàn thành.');
				
				
				});
				
				
			}, 0);
		});
		
	}

	

	//updateFarmAccount
	$scope.updateFarmAccount = function(){

		// getKeyUpdateSpecies = getkey;

		appFactory.updateFarmAccount($scope.farm, function(data){
			$scope.update_farm_account = data;
			if ($scope.update_farm_account == "Error: no farm found"){
				$("#error_update_farm_account").show();
				$("#success_update_farm_account").hide();
			} else{
				$("#success_update_farm_account").show();
				$("#error_update_farm_account").hide();
			}
			$timeout(function () {
				// $('#addSpecies').modal('toggle');
				angular.element('#queryAllPig').triggerHandler('click');
				angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
	
				
				
				
			}, 0);
			
		});
		

	}

	$scope.updateFarmQualified = function(){
		var Job = "Cập nhật chất lượng nông trại";
		// getKeyUpdateFamer = getkey;
		// console.log('getkey update famer: '+getkey);
		appFactory.updateFarmQualified($scope.farm, function(data){
			$scope.update_farm_qualified = data;
			if ($scope.update_farm_qualified == "Error: no farm found"){
				$("#error_update_farm_qualified").show();
				$("#success_update_farm_qualified").hide();
			} else{
				$("#success_update_farm_qualified").show();
				$("#error_update_farm_qualified").hide();
			}
			$timeout(function () {
				angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}
	
	$scope.updateFamer = function(){
		var Job = "Cập nhật tên nông dân ở giai đoạn nông trại";
		// getKeyUpdateFamer = getkey;
		// console.log('getkey update famer: '+getkey);
		appFactory.updateFamer($scope.farm, function(data){
			$scope.update_famer = data;
			if ($scope.update_famer == "Error: no farm found"){
				$("#error_update_famer").show();
				$("#success_update_famer").hide();
			} else{
				$("#success_update_famer").show();
				$("#error_update_famer").hide();
			}
			$timeout(function () {
				angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateSpecies
	$scope.updateSpecies = function(getkey){

		// getKeyUpdateSpecies = getkey;


		appFactory.updateSpecies($scope.farm, function(data){
			$scope.update_species = data;
			console.log('update giong: ' + data)
			if ($scope.update_species == "Error: no farm found"){
				$("#error_update_species").show();
				$("#success_update_species").hide();
			} else{
				$("#success_update_species").show();
				$("#error_update_species").hide();
			}
			var Job = "Cập nhật giống"
			console.log('Job1:' +Job)


			$timeout(function () {
				// $('#addSpecies').modal('toggle');
				// angular.element('#queryFarm').triggerHandler('click');
				angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');

				appFactory.addHistoryTxID(data, Job, function(data){
				$scope.create_history = data;
				$("#success_create").show();
				
				alert('Hoàn thành.');
				
				});
			}, 0);
			
		});
		


	}

	//updateFood
	$scope.updateFood = function(getkey){

		// getKeyUpdateFood = getkey;
		var Job = "Cập nhật thức ăn ở giai đoạn nông trại"

		appFactory.updateFood($scope.farm, function(data){
			$scope.update_food = data;
			if ($scope.update_food == "Error: no farm found"){
				$("#error_update_food").show();
				$("#success_update_food").hide();
			} else{
				$("#success_update_food").show();
				$("#error_update_food").hide();
			}
			$timeout(function () {
				// $('#addFood').modal('toggle');
				// angular.element('#queryFarm').triggerHandler('click');
				angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateLocation
	$scope.updateLocation = function(getkey){

		var Job = "Cập nhật địa chỉ ở giai đoạn nông trại"
		// getKeyUpdateLocation = getkey;

		appFactory.updateLocation($scope.farm, function(data){
			$scope.update_location = data;
			if ($scope.update_location == "Error: no farm found"){
				$("#error_update_location").show();
				$("#success_update_location").hide();
			} else{
				$("#success_update_location").show();
				$("#error_update_location").hide();
			}
			$timeout(function () {
				// $('#addLocation').modal('toggle');
				// angular.element('#queryFarm').triggerHandler('click');
				angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
					
			}, 0);
			
		});
		

	}

	//updateStartDate
	$scope.updateStartDate = function(getkey){
		
		// getKeyUpdateStartDate = getkey;
		var Job = "Cập nhật ngày nuôi ở giai đoạn nông trại"
		

		appFactory.updateStartDate($scope.farm, function(data){
			$scope.update_start_date = data;
			if ($scope.update_start_date == "Error: no farm found"){
				$("#error_update_start_date").show();
				$("#success_update_start_date").hide();
			} else{
				$("#success_update_start_date").show();
				$("#error_update_start_date").hide();
			}
			$timeout(function () {
				// $('#addStartDate').modal('toggle');
				// angular.element('#queryFarm').triggerHandler('click');
				angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
				
			}, 0);
			
		});
		

	}

	//updateEndDate
	$scope.updateEndDate = function(getkey){

		// getKeyUpdateEndDate = getkey;
		var Job = "Cập nhật ngày bán ở giai đoạn nông trại"
		
		appFactory.updateEndDate($scope.farm, function(data){
			$scope.update_end_date = data;
			if ($scope.update_end_date == "Error: no farm found"){
				$("#error_update_end_date").show();
				$("#success_update_end_date").hide();
			} else{
				$("#success_update_end_date").show();
				$("#error_update_end_date").hide();
			}
			$timeout(function () {
				// $('#addEndDate').modal('toggle');
				// angular.element('#queryFarm').triggerHandler('click');
				angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
				
			}, 0);
			
		});
		

	}

	//updateTransportAccount
	$scope.updateTransportAccount = function(){

		appFactory.updateTransportAccount($scope.transport, function(data){
			$scope.update_transport_account = data;
			if ($scope.update_transport_account == "Error: no transport found"){
				$("#error_update_transport_account").show();
				$("#success_update_transport_account").hide();
			} else{
				$("#success_update_transport_account").show();
				$("#error_update_transport_account").hide();
			}
			
		});
		$timeout(function () {
			// $('#addCompany').modal('toggle');
			angular.element('#queryAllUser').triggerHandler('click');
			
			
			
		}, 0);

	}

	//updateCompany
	$scope.updateCompany = function(getkey){
		// getKeyUpdateCompany = getkey
		var Job = "Cập nhật tên công ty ở giai đoạn vận chuyển"

		appFactory.updateCompany($scope.transport, function(data){
			$scope.update_company = data;
			if ($scope.update_company == "Error: no transport found"){
				$("#error_update_company").show();
				$("#success_update_company").hide();
			} else{
				$("#success_update_company").show();
				$("#error_update_company").hide();
			}
			$timeout(function () {
				// $('#addCompany').modal('toggle');
				// angular.element('#queryTransport').triggerHandler('click');
				angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateTransporter
	$scope.updateTransporter = function(getkey){
		// getKeyUpdateTransporter = getkey
		var Job = "Cập nhật người vận chuyển ở giai đoạn vận chuyển"

		appFactory.updateTransporter($scope.transport, function(data){
			$scope.update_transporter = data;
			if ($scope.update_transporter == "Error: no transport found"){
				$("#error_update_transporter").show();
				$("#success_update_transporter").hide();
			} else{
				$("#success_update_transporter").show();
				$("#error_update_transporter").hide();
			}
			$timeout(function () {
				// $('#addTransporter').modal('toggle');
				// angular.element('#queryTransport').triggerHandler('click');
				angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateVehicle
	$scope.updateVehicle = function(getkey){
		// getKeyUpdateVehicle = getkey
		var Job = "Cập nhật phương tiện ở giai đoạn vận chuyển"

		appFactory.updateVehicle($scope.transport, function(data){
			$scope.update_vehicle = data;
			if ($scope.update_vehicle == "Error: no transport found"){
				$("#error_update_vehicle").show();
				$("#success_update_vehicle").hide();
			} else{
				$("#success_update_vehicle").show();
				$("#error_update_vehicle").hide();
			}
			$timeout(function () {
				// $('#addVehicle').modal('toggle');
				angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateVehicle
	$scope.updateTrouble = function(){
		// getKeyUpdateTrouble = getkey 
		var Job = "Cập nhật vấn đề ở giai đoạn vận chuyển"

		appFactory.updateTrouble($scope.transport, function(data){
			$scope.update_trouble = data;
			if ($scope.update_trouble == "Error: no transport found"){
				$("#error_update_trouble").show();
				$("#success_update_trouble").hide();
			} else{
				$("#success_update_trouble").show();
				$("#error_update_trouble").hide();
			}
			$timeout(function () {
				// $('#addTrouble').modal('toggle');
				angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateSolution
	$scope.updateSolution = function(getkey){
		// getKeyUpdateSolution = getkey
		var Job = "Cập nhật cách giải quyết ở giai đoạn vận chuyển"

		appFactory.updateSolution($scope.transport, function(data){
			$scope.update_solution = data;
			if ($scope.update_solution == "Error: no transport found"){
				$("#error_update_solution").show();
				$("#success_update_solution").hide();
			} else{
				$("#success_update_solution").show();
				$("#error_update_solution").hide();
			}
			$timeout(function () {
				// $('#addSolution').modal('toggle');
				angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateTransportQualified
	$scope.updateTransportQualified = function(){
		// getKeyUpdateTransportQualified = getkey
		var Job = "Cập nhật chất lượng vận chuyển ở giai đoạn vận chuyển"

		appFactory.updateTransportQualified($scope.transport, function(data){
			$scope.update_transportqualified = data;
			if ($scope.update_transportqualified == "Error: no transport found"){
				$("#error_update_transportqualified").show();
				$("#success_update_transportqualified").hide();
			} else{
				$("#success_update_transportqualified").show();
				$("#error_update_transportqualified").hide();
			}
			$timeout(function () {
				// $('#addTransportQualified').modal('toggle');
				angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateTime
	$scope.updateTime = function(getkey){
		// getKeyUpdateTime = getkey
		var Job = "Cập nhật thời gian vận chuyển ở giai đoạn vận chuyển"

		appFactory.updateTime($scope.transport, function(data){
			$scope.update_time = data;
			if ($scope.update_time == "Error: no transport found"){
				$("#error_update_time").show();
				$("#success_update_time").hide();
			} else{
				$("#success_update_time").show();
				$("#error_update_time").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//update abattoir info
	//updateAbattoirAccount
	$scope.updateAbattoirAccount = function(){

		appFactory.updateAbattoirAccount($scope.abattoir, function(data){
			$scope.update_abattoir_account = data;
			if ($scope.update_abattoir_account == "Error: no transport found"){
				$("#error_update_abattoir_account").show();
				$("#success_update_abattoir_account").hide();
			} else{
				$("#success_update_abattoir_account").show();
				$("#error_update_abattoir_account").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPig').triggerHandler('click');
	
				
			}, 4000);
			
		});
		

	}

	//updateAbattoirName
	$scope.updateAbattoirName = function(){
		var Job = "Cập nhật tên lò mổ ở giai đoạn lò mổ"

		appFactory.updateAbattoirName($scope.abattoir, function(data){
			$scope.update_abattoir_name = data;
			if ($scope.update_abattoir_name == "Error: no transport found"){
				$("#error_update_abattoir_name").show();
				$("#success_update_abattoir_name").hide();
			} else{
				$("#success_update_abattoir_name").show();
				$("#error_update_abattoir_name").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPigWithAccountAbattoir').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
	
				
			}, 0);
			
		});
		

	}

	$scope.updateAbattoirTrouble = function(){
		// getKeyUpdateTrouble = getkey 
		var Job = "Cập nhật vấn đề ở giai đoạn lò mổ"

		appFactory.updateAbattoirTrouble($scope.abattoir, function(data){
			$scope.update_abattoir_trouble = data;
			if ($scope.update_abattoir_trouble == "Error: no abattoir found"){
				$("#error_update_abattoir_trouble").show();
				$("#success_update_abattoir_trouble").hide();
			} else{
				$("#success_update_abattoir_trouble").show();
				$("#error_update_abattoir_trouble").hide();
			}
			$timeout(function () {
				// $('#addTrouble').modal('toggle');
				angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateAbattoirLocation
	$scope.updateAbattoirLocation = function(){
		var Job = "Cập nhật địa chỉ ở giai đoạn lò mổ"

		appFactory.updateAbattoirLocation($scope.abattoir, function(data){
			$scope.update_abattoir_location = data;
			if ($scope.update_abattoir_location == "Error: no transport found"){
				$("#error_update_abattoir_location").show();
				$("#success_update_abattoir_location").hide();
			} else{
				$("#success_update_abattoir_location").show();
				$("#error_update_abattoir_location").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPigWithAccountAbattoir').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateAbattoirQualified
	$scope.updateAbattoirQualified = function(){
		var Job = "Cập nhật chất lượng ở giai đoạn lò mổ"

		appFactory.updateAbattoirQualified($scope.abattoir, function(data){
			$scope.update_abattoir_qualified = data;
			if ($scope.update_abattoir_qualified == "Error: no transport found"){
				$("#error_update_abattoir_qualified").show();
				$("#success_update_abattoir_qualified").hide();
			} else{
				$("#success_update_abattoir_qualified").show();
				$("#error_update_abattoir_qualified").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPigWithAccountAbattoir').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
			}, 0);
			
		});
		

	}

	//updateAbattoirPeckTime
	$scope.updateAbattoirPeckTime = function(){
		var Job = "Cập nhật thời gian mổ ở giai đoạn lò mổ"

		appFactory.updateAbattoirPeckTime($scope.abattoir, function(data){
			$scope.update_abattoir_peck_time = data;
			if ($scope.update_abattoir_peck_time == "Error: no transport found"){
				$("#error_update_abattoir_peck_time").show();
				$("#success_update_abattoir_peck_time").hide();
			} else{
				$("#success_update_abattoir_peck_time").show();
				$("#error_update_abattoir_peck_time").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPigWithAccountAbattoir').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//update supermarket info
	//updateSupermarketAccount
	$scope.updateSupermarketAccount = function(){

		appFactory.updateSupermarketAccount($scope.supermarket, function(data){
			$scope.update_supermarket_account = data;
			if ($scope.update_supermarket_account == "Error: no supermarket found"){
				$("#error_update_supermarket_account").show();
				$("#success_update_supermarket_account").hide();
			} else{
				$("#success_update_supermarket_account").show();
				$("#error_update_supermarket_account").hide();
			}
			
		});
		$timeout(function () {
			// $('#addTime').modal('toggle');
			angular.element('#queryAllUser').triggerHandler('click');
			angular.element('#queryAllPig').triggerHandler('click');
			
		}, 0);

	}

	//updateSupermarketName
	$scope.updateSupermarketName = function(){
		var Job = "Cập nhật tên siêu thị ở giai đoạn siêu thị"

		appFactory.updateSupermarketName($scope.supermarket, function(data){
			$scope.update_supermarket_name = data;
			if ($scope.update_supermarket_name == "Error: no supermarket found"){
				$("#error_update_supermarket_name").show();
				$("#success_update_supermarket_name").hide();
			} else{
				$("#success_update_supermarket_name").show();
				$("#error_update_supermarket_name").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPigWithAccountSupermarket').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	$scope.updateSupermarketTroubleSolution = function(){
		// getKeyUpdateTrouble = getkey 
		var Job = "Cập nhật vấn đề ở giai đoạn siêu thị"

		appFactory.updateSupermarketTroubleSolution($scope.supermarket, function(data){
			$scope.update_supermarket_trouble = data;
			if ($scope.update_supermarket_trouble == "Error: no supermarket found"){
				$("#error_update_supermarket_trouble").show();
				$("#success_update_supermarket_trouble").hide();
			} else{
				$("#success_update_supermarket_trouble").show();
				$("#error_update_supermarket_trouble").hide();
			}
			$timeout(function () {
				// $('#addTrouble').modal('toggle');
				angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateSupermarketQualified
	$scope.updateSupermarketQualified = function(){
		var Job = "Cập nhật chất lượng siêu thị ở giai đoạn siêu thị"

		appFactory.updateSupermarketQualified($scope.supermarket, function(data){
			$scope.update_supermarket_qualified = data;
			if ($scope.update_supermarket_qualified == "Error: no supermarket found"){
				$("#error_update_supermarket_qualified").show();
				$("#success_update_supermarket_qualified").hide();
			} else{
				$("#success_update_supermarket_qualified").show();
				$("#error_update_supermarket_qualified").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPigWithAccountSupermarket').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateSupermarketPrice
	$scope.updateSupermarketPrice = function(){
		var Job = "Cập nhật giá sản phẩm ở giai đoạn siêu thị"

		appFactory.updateSupermarketPrice($scope.supermarket, function(data){
			$scope.update_supermarket_price = data;
			if ($scope.update_supermarket_price == "Error: no supermarket found"){
				$("#error_update_supermarket_price").show();
				$("#success_update_supermarket_price").hide();
			} else{
				$("#success_update_supermarket_price").show();
				$("#error_update_supermarket_price").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPigWithAccountSupermarket').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateSupermarketQuantityRemaining
	$scope.updateSupermarketQuantityRemaining = function(){
		var Job = "Cập nhật số lượng sản phẩm còn lại ở giai đoạn siêu thị"

		appFactory.updateSupermarketQuantityRemaining($scope.supermarket, function(data){
			$scope.update_supermarket_quantity_remaining = data;
			if ($scope.update_supermarket_quantity_remaining == "Error: no supermarket found"){
				$("#error_update_supermarket_quantity_remaining").show();
				$("#success_update_supermarket_quantity_remaining").hide();
			} else{
				$("#success_update_supermarket_quantity_remaining").show();
				$("#error_update_supermarket_quantity_remaining").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPigWithAccountSupermarket').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateSupermarketMFG
	$scope.updateSupermarketMFG = function(){
		var Job = "Cập nhật ngày sản xuất ở giai đoạn siêu thị"

		appFactory.updateSupermarketMFG($scope.supermarket, function(data){
			$scope.update_supermarket_mfg = data;
			if ($scope.update_supermarket_mfg == "Error: no supermarket found"){
				$("#error_update_supermarket_mfg").show();
				$("#success_update_supermarket_mfg").hide();
			} else{
				$("#success_update_supermarket_mfg").show();
				$("#error_update_supermarket_mfg").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPigWithAccountSupermarket').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}

	//updateSupermarketEXP
	$scope.updateSupermarketEXP = function(){
		var Job = "Cập nhật hạng sử dụng ở giai đoạn siêu thị"

		appFactory.updateSupermarketEXP($scope.supermarket, function(data){
			$scope.update_supermarket_exp = data;
			if ($scope.update_supermarket_exp == "Error: no supermarket found"){
				$("#error_update_supermarket_exp").show();
				$("#success_update_supermarket_exp").hide();
			} else{
				$("#success_update_supermarket_exp").show();
				$("#error_update_supermarket_exp").hide();
			}
			$timeout(function () {
				// $('#addTime').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				angular.element('#queryAllPigWithAccountSupermarket').triggerHandler('click');
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
					
					});
				
			}, 0);
			
		});
		

	}
	
	$scope.sendIdDeleteUser = function (getkey){
		var parag = `<label class="lb-getkey"> Bạn muốn duyệt cho người dùng có ID: </label>`+ ` `+`<span id="getKeyApprove" class="p-getkey">` + getkey + `</span>`;
		$("#deleteUser").find(".modal-body-getkey").html(parag);
		
		// getkeyapprove = getkey;
		// getusernameapprove = getusername;
		// getchainidapprove = getchainid
		// console.log('changeApprove when get role: '+ getchainidapprove)
		// getroleapprove = getrole;
		// getstateapproveapprove = getstateapprove;



	}


	$scope.sendDataApprove = function (getkey, getusername, getchainid, getrole, getstateapprove){
		var parag = `<label class="lb-getkey"> Bạn muốn duyệt cho người dùng có ID: </label>`+ ` `+`<span id="getKeyApprove" class="p-getkey">` + getkey + `</span>`
		+ ` `+`<input id="getUsernameApprove" type="hidden" class="p-getkey" value="` + getusername + `">`
		+ ` `+`<input id="getChainIdApprove" type="hidden" class="p-getkey" value="` + getchainid + `">`
		+ ` `+`<input id="getRolesApprove" type="hidden" class="p-getkey" value="` + getrole + `">`
		+ ` `+`<input id="getStatusApprove" type="hidden" class="p-getkey" value="` + getstateapprove + `">`;
		$("#approveUser").find(".modal-body-getkey").html(parag);
		
		// getkeyapprove = getkey;
		// getusernameapprove = getusername;
		// getchainidapprove = getchainid
		// console.log('changeApprove when get role: '+ getchainidapprove)
		// getroleapprove = getrole;
		// getstateapproveapprove = getstateapprove;



	}

	//changeApprove
	$scope.changeApprove = function (){

		// var getkey = angular.element('#getKeyApprove').val();
		var getkey = $('#approveUser .modal-body-getkey span').text();
		var getusername = angular.element('#getUsernameApprove').val();
		var getchainid = angular.element('#getChainIdApprove').val();
		var getrole =  angular.element('#getRolesApprove').val();
		var getstateapprove = angular.element('#getStatusApprove').val();
		console.log('----------------------------------------------------------'+getkey+getusername+getchainid+getrole+getstateapprove)
		
		getkeyapprove = getkey;
		getusernameapprove = getusername;
		getchainidapprove = getchainid
		console.log('changeApprove when get role: '+ getchainidapprove)
		getroleapprove = getrole;
		getstateapproveapprove = getstateapprove;

		$scope.approveUser(getkey, getusername, getchainid, getrole, getstateapprove);
		// alert("Chờ xử lý ...")

		// reload data 
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

	$scope.approveUser = function(getkey, getusername, getchainid, getrole, getstateapprove){
		// var resultCountChain  = 0;
		var Job = "Duyệt người dùng: " + getusername;
		appFactory.queryAllUser( function(data){
			var resultCountChain  = 0;
			// console.log('next addChain')
			// var lengthChain = 0;
			
				// for (var i = 0; i < data.length; i++){
					// var lengthChain = (data.length)-1;
					
					console.log('getrole:======================'+getrole);
			if (  getrole != 'Z.Farm' ){
				// $timeout(function () {
					// console.log('next trc for2')
					resultCountChain = 0;
					console.log('countchain err khong tao chuoi: '+ resultCountChain)
					
					// break;
				// }, 5000);
				// resultCountChain = 1;
				// break;
			} else if(  getrole == 'Z.Farm' && getstateapprove == 'WAITTING' ){
				
				console.log('role=farm resultCountChain: '+resultCountChain)
				resultCountChain = 1;
				// break;
			// } else if( getroleapprove == 'Y.Transport' && getstateapproveapprove == 'WAITTING') {
			// 	console.log('role=transport resultCountChain: '+resultCountChain)
			// 	resultCountChain = 2;
			// } else if( getroleapprove == 'X.Abattoir' && getstateapproveapprove == 'WAITTING') {
			// 	console.log('role=Abattoir resultCountChain: '+resultCountChain)
			// 	resultCountChain = 3;
			// } else if( getroleapprove == 'W.Supermarket' && getstateapproveapprove == 'WAITTING') {
			// 	console.log('role=Supermarket resultCountChain: '+resultCountChain)
			// 	resultCountChain = 4;
			}
				// }
			if (resultCountChain == 1){
				appFactory.queryAllPig( function(data){
					console.log('next addChain queryAllpig')
						for (var i = 0; i < data.length; i++){
									$localStorage.countChain = data.length+1;
									countChain = $localStorage.countChain;

									getKeyLength = data[data.length-1].Key
									console.log("--------------------------------------------getKeyLength: "+getKeyLength)
									
									resultCountChain = 1;
									
									console.log('countChain after for: '+countChain)
									
						}
						resultCountChain = 1;
				});
				
				resultCountChain = 1;
				console.log('countchain if: '+countChain);
				
					$timeout(function () {
						
						$scope.addChain(getkey, getusername, getchainid, getrole, getstateapprove);
						// alert('Add chain');
						console.log('add chain success');
					}, 1000);
			// } else if (resultCountChain == 2) {
			// 	$timeout(function () {
						
			// 		$scope.updateTransportAccount();
			// 		alert('Success updateTransportAccount ');
			// 		console.log('Success updateTransportAccount');
			// 	}, 4000);
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
					appFactory.approveUser(getkey, getusername, getchainid, getrole, getstateapprove, function(data){
						$scope.edit_approve = data;
						if ($scope.approve_user == "Error: no user found"){
							$("#error_approveUser").show();
							$("#success_editApprove").hide();
						} else{
							$("#success_editApprove").show();
							$("#error_approveUser").hide();
							// alert('Duyệt thành công: '+ getkeyapprove);
							
			
						}
						$timeout(function () {

							appFactory.addHistoryTxID(data, Job, function(data){
							$scope.create_history = data;
							$("#success_create").show();
							
							alert('Hoàn thành.');
							
							});
						}, 2000);
						console.log('approve user successful')
						//adddChain
						// angular.element('#queryAllPig').triggerHandler('click');
						$scope.timeoutApproveUser();
						
					});
				}, 3000);
			} else if (checkApprove == 0) {
				// $scope.cancelApproveUser();
				// alert('Đã hũy duyệt')
				alert('Người dùng đã được duyệt');
			}
				
				
				
		});

		

	}
	$scope.timeoutApproveUser = function(){
		$timeout(function() {
			angular.element('#queryAllPig').triggerHandler('click');
			angular.element('#queryAllUser').triggerHandler('click');
			angular.element('#queryAllHistoryTxID').triggerHandler('click');
			console.log('timeoutApproveUser')
			
		}, 5000)
	}

	//cancelApproveUser
	$scope.cancelApproveUser = function(){
		appFactory.cancelApproveUser($scope.user, function(data){
			$scope.cancel_approve_user = data;
			if ($scope.cancel_approve_user == "Error: no user found"){
				$("#error_cancel_approve_user").show();
				$("#success_editApprove").hide();
			} else{
				$("#success_editApprove").show();
				$("#error_cancel_approve_user").hide();
				alert('Hủy thành công: '+ getkeyapprove);
				

			}
			console.log('cancel approve user successful')
			
			
		});
	}

	//changeChainID
	$scope.changeChainID = function (){
		
		// getKeyEditChainID = getkey;
		// getUsernameWhenUpdateChainid = getusername
		// getRoleWhenUpdateChainid = getroles
		// getChainidWhenUpdateChainid = getchainid

		// getChainidWhenUpdateChainid = $scope.user.editchainid;
		// console.log('getchainid: '+getChainidWhenUpdateChainid );
		// console.log('getuser: '+getUsernameWhenUpdateChainid );

		$scope.editChainID();
		// alert("Chờ xử lý...")


		//reload data 
		$scope.load();

		//close modal
		
		
	}
	

	$scope.editChainID = function(){
		var Job = "Cập nhật mã quá trình cho người dùng"
		appFactory.editChainID($scope.user, function(data){
			$scope.edit_chainid = data;
			if ($scope.edit_chainid == "Error: no user found"){
				$("#error_editChainID").show();
				$("#success_editChainID").hide();

			} else{
				$("#success_editChainID").show();
				$("#error_editChainID").hide();

			}
			$timeout(function () {
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
				
				});
			}, 10000);

			$timeout(function () {
				console.log('updateTransportAccount getrole when update chainid : '+getRoleWhenUpdateChainid)
				if (getRoleWhenUpdateChainid == 'Y.Transport'){
					// $('#editChainID').modal('toggle');
					$scope.updateTransportAccount();
					console.log('== Y.Transport , updateTransportAccount')
					$scope.timeoutLoadUpdateTransportAccount();
				} else if (getRoleWhenUpdateChainid == 'Z.Farm'){
					console.log('== Z.Farm , updateFarmAccount')
				} else if (getRoleWhenUpdateChainid == 'X.Abattoir'){
					$scope.updateAbattoirAccount();
	
					console.log('== X.Abattoir , updateAbattoirAccount')
					$scope.timeoutLoadUpdateTransportAccount();
				} else if (getRoleWhenUpdateChainid == 'W.Supermarket'){
					$scope.updateSupermarketAccount();
					console.log('== W.Supermarket , updateSupermarketAccount')
					$scope.timeoutLoadUpdateTransportAccount();
				}
				// angular.element('#queryAllPig').triggerHandler('click');
				
				
			}, 6000);
				
		});
		
		
	}

	$scope.timeoutLoadUpdateTransportAccount = function(){
		$timeout(function () {
			// $('#editChainID').modal('toggle');
			// $scope.updateTransportAccount();
			
			angular.element('#queryAllUser').triggerHandler('click');
			angular.element('#queryAllPig').triggerHandler('click');
			angular.element('#queryAllHistoryTxID').triggerHandler('click');
			console.log('timeoutLoadUpdateTransportAccount queryalluser')
			
		}, 9000);
	}

	//changePassword
	$scope.changePassword = function (){
		var Job = "Cập nhật mật khẩu"
		if ($scope.user.password == $scope.repeatPass){
			$scope.editPassword();
			// alert("Chờ xử lý...")

			//reload data 
			$scope.load();

			//close modal
			$timeout(function () {
				// $('#editPassword').modal('toggle');
				angular.element('#queryAllUser').triggerHandler('click');
				
				
			}, 5000);
		} else{
			alert('Mật khẩu không trùng khớp.')
		}
		
	}


	$scope.editPassword = function(){
		var Job = "Cập nhật mật khẩu"
		
		appFactory.editPassword($scope.user, function(data){
			$scope.edit_password = data;

			
			
			
				if ($scope.edit_password == "Error: no user found"){
					$("#error_editPassword").show();
					$("#success_editPassword").hide();

				} else{
					$("#success_editPassword").show();
					$("#error_editPassword").hide();

				}
				$timeout(function () {
					appFactory.addHistoryTxID(data, Job, function(data){
						$scope.create_history = data;
						$("#success_create").show();
						alert('Hoàn thành.');
					
					});
				}, 0);
				
			
		});
		
	}

	//changeImg
	$scope.changeImg = function (){
		
		$scope.editImg();
		alert("Chờ xử lý...")

		//reload data 
		$scope.load();

		//close modal
		$timeout(function () {
			// $('#editEmail').modal('toggle');
			angular.element('#queryAllUser').triggerHandler('click');
			angular.element('#queryAllHistoryTxID').triggerHandler('click');
			
		}, 5000);
		
	}


	$scope.editImg = function(){
		var Job = "Cập nhật Avatar"
		
		appFactory.editImg($scope.user, function(data){
			$scope.edit_img = data;
			if ($scope.edit_img == "Error: no user found"){
				$("#error_editImg").show();
				$("#success_editImg").hide();

			} else{
				$("#success_editImg").show();
				$("#error_editImg").hide();

			}
			$timeout(function () {
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
				});
			}, 0);
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
			angular.element('#queryAllHistoryTxID').triggerHandler('click');
			
		}, 5000);
		
	}


	$scope.editEmail = function(){
		var Job = "Cập nhật email"
		
		appFactory.editEmail($scope.user, function(data){
			$scope.edit_email = data;
			if ($scope.edit_email == "Error: no user found"){
				$("#error_editEmail").show();
				$("#success_editEmail").hide();

			} else{
				$("#success_editEmail").show();
				$("#error_editEmail").hide();

			}
			$timeout(function () {
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
				});
			}, 0);
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
		var Job = "Cập nhật mật khẩu"
		
		appFactory.editRoles($scope.user, function(data){
			$scope.edit_roles = data;
			if ($scope.edit_roles == "Error: no user found"){
				$("#error_editRoles").show();
				$("#success_editRoles").hide();

			} else{
				$("#success_editRoles").show();
				$("#error_editRoles").hide();

			}
			$timeout(function () {
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
				});
			}, 0);
		});
		
	}

	//changeStatus
	$scope.changeStatus = function (){
		
		// getKeyEditStatus = getkey;

		$scope.editStatus();
		alert("Chờ xử lý...")

		//reload data 
		

		//close modal
		$timeout(function () {
			// $('#editStatus').modal('toggle');
			$scope.load();
			
		}, 7000);
		
	}

	$scope.editStatus = function(){
		var Job = "Cập nhật mật khẩu"
		
		appFactory.editStatus($scope.user,  function(data){
			$scope.edit_status = data;
			if ($scope.edit_status == "Error: no user found"){
				$("#error_holder").show();
				$("#success_holder").hide();

			} else{
				$("#success_holder").show();
				$("#error_holder").hide();

			}
			$timeout(function () {
				appFactory.addHistoryTxID(data, Job, function(data){
					$scope.create_history = data;
					$("#success_create").show();
					alert('Hoàn thành.');
				});
			}, 0);
		});
		
	}
	
	$scope.load = function() {

		$timeout(function () {
			angular.element('#queryAllUser').triggerHandler('click');
			angular.element('#queryViewUser').triggerHandler('click');
			angular.element('#queryAllHistoryTxID').triggerHandler('click');

			// angular.element('#queryAllUser').triggerHandler('click');
			console.log('queried all pig');
			// $('#approveUser').modal('toggle');
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
		var Job = "Đăng ký người dùng"
			
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
						// alert('Chờ xử lý giao dịch!...');
						appFactory.registerUser(usernameRegister, function(data){
							console.log('usernameRegister registerUser: '+usernameRegister);
							$timeout(function () {
								
								
								$scope.addUser();
								
								for (var i = 0; i < data.length; i++){
									$localStorage.datalength = data.length+1;
									countUser = $localStorage.datalength;
								}
								console.log('countUser: '+countUser);
								// $window.location.reload();
								console.log('localstorage-signup');
							}, 0);
							$timeout(function () {
			
								appFactory.queryAllHistoryTxID( function(data){
									var resultUser = 0;
									for (var i = 0; i < data.length; i++){
										countTxID = data.length+1;
										console.log("countTxID:"+countTxID);
									}
									// $timeout(function () {
									// appFactory.addHistoryTxID(data, Job, function(data){
									// 	$scope.create_history = data;
									// 	$("#success_create").show();
										
									// 	alert('Hoàn thành.');
										
									// 	});
									// }, 5000);
									
				
								});
								
							}, 1000);
							
						});
							
						// alert('Chờ duyệt: ' + usernameRegister);
					} else if (resultUser == 0){
						alert('user enrolled! Please, register new user');
						
					}
					// $window.location.reload();
					
					
			});
			
	};

	// $scope.nowUser = function (username){
	// 	$scope.myTextcurrentUser = username;
	// 	console.log('-----------------------------------------------nowuser'+username)
	// }
	

	$scope.loginUser = function(){
		

		var usernameLogin = $scope.usernameLogin;
		var password = $scope.password;
		
		// var rolesLogin = $scope.rolesLogin;
		// var user = $cookie.get(usernameLogin);

			appFactory.queryAllUser( function(data){
				// console.log('login user2');
				var test = 0;
				var trytest = 0;
				console.log(usernameLogin);
				var resultUser = 0;
				var chainidLocalStorage = 0;
				var iduserLocalStorage = 0;
				for (var i = 0; i < data.length; i++){
					// (data[i].username);
					test = (data[0].Record.username);
					// trytest = (data[1].Record.username);
					// console.log('test array: '+ test);
					// console.log('test array: '+ trytest);
					if  (usernameLogin == (data[i].Record.username) && 
						password == (data[i].Record.password) && 
						(data[i].Record.roles) == 'Admin' &&
						(data[i].Record.status) == 'ENABLE' &&
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

						countUser = data.length;
						console.log('.....................'+countUser)
						
						// $('#curentUser').attr('value', data[i].Record.username);
						
						
						// $rootScope.loggedIn = true; //tam

						// $location.path('/roleadmin') //tam
						// $('#curentUser').attr('src', data[i].Record.username);
						// console.log('=======================================================')
						
						// $scope.isDisabled = true;
						// let getHashImg = document.getElementById("curentUser");
						// getHashImg.textContent = data[i].Record.username;
						
						
						
					} else if( usernameLogin == (data[i].Record.username) && 
						password == (data[i].Record.password) &&
						(data[i].Record.roles) == 'Z.Farm' &&
						(data[i].Record.status) == 'ENABLE' &&
						(data[i].Record.approve) == 'APPROVED') {
						console.log('Farm');
						console.log('xin chao: ' + data[i].Record.username);
						resultUser = 2;
						$localStorage.chainidLocalStorage = (data[i].Record.chainid);
						chainidLocalStorage = $localStorage.chainidLocalStorage;
						idLocalStorage =chainidLocalStorage;
						console.log('.........................................chainidLocalStorage ' + chainidLocalStorage);
						console.log('roles farm');
						//viewuser
						$localStorage.iduserLocalStorage = (data[i].Key);
						iduserLocalStorage = $localStorage.iduserLocalStorage;
						idUserLocalStorage = iduserLocalStorage
					} else if( usernameLogin == (data[i].Record.username) && 
						password == (data[i].Record.password) &&
						(data[i].Record.roles) == 'Y.Transport' &&
						(data[i].Record.status) == 'ENABLE' &&
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
						(data[i].Record.status) == 'ENABLE' &&
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
						(data[i].Record.status) == 'ENABLE' &&
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
						password != (data[i].Record.password)) {
						
						resultUser = 7;
						
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
					getUsernameLogin = $localStorage.message

					

					// $localStorage.chainidLocalStorage = chainidLocalStorage;
					$location.path('/roleadmin') //tam

					
					// let getHashImg = document.getElementById("acurrentUser");
					// 	getHashImg.textContent = usernameLogin
					
					// console.log('localstorage2');
					// $localStorage.message = usernameLogin;
					$scope.isDisabled = true;
					alert('Successful login: ' + usernameLogin);
					// var el =angular.element('#acurrentUser');
					// el.attr('href', usernameLogin);
					// $('#acurrentUser').attr('href', usernameLogin);
					
					$timeout(function () {
						angular.element('#currentUser').attr('value', usernameLogin);
						angular.element('#chainIdUser').attr('value', chainidLocalStorage);
						angular.element('#getIdUserCurrent').attr('value', iduserLocalStorage);
						

					}, 1000);
					// console.log('--------------------'+el)

					// console.log('test array: '+ test + trytest);
					// return usernameLogin;
				} else if (resultUser == 2) {
					$rootScope.loggedIn = true; //tam
					console.log('localstorage');
					$localStorage.message = usernameLogin;
					getUsernameLogin = $localStorage.message


					$location.path('/rolefarm') //tam
					$scope.isDisabled = true;
					alert('Successful login: ' + usernameLogin);
					
					$timeout(function () {
						angular.element('#currentUser').attr('value', usernameLogin);
						angular.element('#chainIdUser').attr('value', chainidLocalStorage);
						angular.element('#getIdUserCurrent').attr('value', iduserLocalStorage);
						
					}, 1000);
					// $timeout(function () {
					// 	angular.element('#queryFarm').triggerHandler('click');
					// }, 3000);
				} else if (resultUser == 3) {
					$rootScope.loggedIn = true; //tam
					console.log('localstorageTransport');
					$localStorage.message = usernameLogin;
					getUsernameLogin = $localStorage.message


					$location.path('/roletransport') //tam
					$scope.isDisabled = true;
					alert('Successful login: ' + usernameLogin);
					$timeout(function () {
						angular.element('#currentUser').attr('value', usernameLogin);
						angular.element('#chainIdUser').attr('value', chainidLocalStorage);
						angular.element('#getIdUserCurrent').attr('value', iduserLocalStorage);
					}, 1000);
					// $timeout(function () {
					// 	angular.element('#queryTransport').triggerHandler('click');
					// }, 0);
				} else if (resultUser == 4) {
					$rootScope.loggedIn = true; //tam
					console.log('localstorageAbattoir');
					$localStorage.message = usernameLogin;
					getUsernameLogin = $localStorage.message

					$location.path('/roleabattoir') //tam
					$scope.isDisabled = true;
					alert('Successful login: ' + usernameLogin);
					// $timeout(function () {
					// 	angular.element('#queryAbattoir').triggerHandler('click');
					// }, 3000);
					$timeout(function () {
						angular.element('#currentUser').attr('value', usernameLogin);
						angular.element('#chainUser').attr('value', chainidLocalStorage);
						angular.element('#getIdUserCurrent').attr('value', iduserLocalStorage);
					}, 1000);
				} else if (resultUser == 5) {
					$rootScope.loggedIn = true; //tam
					console.log('localstorageSupermarket');
					$localStorage.message = usernameLogin;
					getUsernameLogin = $localStorage.message


					$location.path('/rolesupermarket') //tam
					$scope.isDisabled = true;
					alert('Successful login: ' + usernameLogin);
					$timeout(function () {
						angular.element('#currentUser').attr('value', usernameLogin);
						angular.element('#chainUser').attr('value', chainidLocalStorage);
						angular.element('#getIdUserCurrent').attr('value', iduserLocalStorage);
					}, 1000);
					// $timeout(function () {
					// 	angular.element('#querySupermarket').triggerHandler('click');
					// }, 3000);
				} else if (resultUser == 6) {
					// $rootScope.loggedIn = true; //tam
					// console.log('localstorage1');
					// $localStorage.message = usernameLogin;
					// $location.path('/user') //tam
					alert('Vui lòng chờ admin chấp thuận: ' + usernameLogin);
				} else if (resultUser == 7) {
					// $rootScope.loggedIn = true; //tam
					// console.log('localstorage1');
					// $localStorage.message = usernameLogin;
					// $location.path('/user') //tam
					// alert('Sai mật khẩu.');
					$("#success_login").show();
					$("#error_user_erroled").hide();

				} else if (resultUser == 0){
					$("#error_user_erroled").show();
					$("#success_login").hide();
					// alert('Người dùng chưa đăng ký !');

					
				}

				appFactory.loginUser(usernameLogin, function(data){
				});
				$timeout(function () {
			
					appFactory.queryAllHistoryTxID( function(data){
						var resultUser = 0;
						for (var i = 0; i < data.length; i++){
							countTxID = data.length+1;
							console.log("countTxID:"+countTxID);
						}

					});
					download();
					
				}, 1000);

			});
			
	}

	$scope.loadCurrentUser = function() {
		$scope.message = $localStorage.message;
		$scope.chainidLocalStorage = $localStorage.chainidLocalStorage;
		$scope.iduserLocalStorage = $localStorage.iduserLocalStorage;
		
		$timeout(function () {
			// angular.element('#clickCurrentUser').triggerHandler('click');
			// angular.element('#queryViewUser').triggerHandler('click');
			download();
		}, 1000);
		
		
		
	}

	

	$("#success_login").hide();
	$("#error_user_erroled").hide();

	$("#success_query").hide();
	$("#success_upload").hide();

	$("#success_update_sick_cure").hide();
	$("#success_create").hide();
	$("#error_update_sick_cure").hide();
	$("#error_query").hide();

	$("#success_update_farm_qualified").hide();
	$("#success_create").hide();
	$("#error_update_farm_qualified").hide();
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

	$("#success_update_company").hide();
	$("#success_create").hide();
	$("#error_update_company").hide();
	$("#error_query").hide();

	$("#success_update_transporter").hide();
	$("#success_create").hide();
	$("#error_update_transporter").hide();
	$("#error_query").hide();

	$("#success_update_vehicle").hide();
	$("#success_create").hide();
	$("#error_update_vehicle").hide();
	$("#error_query").hide();

	$("#success_update_trouble").hide();
	$("#success_create").hide();
	$("#error_update_trouble").hide();
	$("#error_query").hide();

	$("#success_update_solution").hide();
	$("#success_create").hide();
	$("#error_update_solution").hide();
	$("#error_query").hide();

	$("#success_update_time").hide();
	$("#success_create").hide();
	$("#error_update_time").hide();
	$("#error_query").hide();

	$("#success_update_transportqualified").hide();
	$("#success_create").hide();
	$("#error_update_transportqualified").hide();
	$("#error_query").hide();

	$("#success_update_abattoir_name").hide();
	$("#success_create").hide();
	$("#error_update_abattoir_name").hide();
	$("#error_query").hide();

	$("#success_update_abattoir_location").hide();
	$("#success_create").hide();
	$("#error_update_abattoir_location").hide();
	$("#error_query").hide();

	$("#success_update_abattoir_qualified").hide();
	$("#success_create").hide();
	$("#error_update_abattoir_qualified").hide();
	$("#error_query").hide();

	$("#success_update_abattoir_pecktime").hide();
	$("#success_create").hide();
	$("#error_update_abattoir_pecktime").hide();
	$("#error_query").hide();

	$("#success_update_supermarket_name").hide();
	$("#success_create").hide();
	$("#error_update_supermarket_name").hide();
	$("#error_query").hide();

	$("#success_update_supermarket_qualified").hide();
	$("#success_create").hide();
	$("#error_update_supermarket_name").hide();
	$("#error_query").hide();

	$("#success_update_price").hide();
	$("#success_create").hide();
	$("#error_update_price").hide();
	$("#error_query").hide();

	$("#success_update_supermarket_quantity_remaining").hide();
	$("#success_create").hide();
	$("#error_update_supermarket_quantity_remaining").hide();
	$("#error_query").hide();

	$("#success_update_supermarket_mfg").hide();
	$("#success_create").hide();
	$("#error_update_supermarket_mfg").hide();
	$("#error_query").hide();

	$("#success_update_supermarket_exp").hide();
	$("#success_create").hide();
	$("#error_update_supermarket_exp").hide();
	$("#error_query").hide();

	$("#success_holder").hide();
	$("#success_create").hide();
	$("#error_holder").hide();
	$("#error_query").hide();

	$("#success_editChainID").hide();
	$("#success_create").hide();
	$("#error_editChainID").hide();
	$("#error_query").hide();

	$("#success_editApprove").hide();
	$("#success_create").hide();
	$("#error_editApprove").hide();
	$("#error_query").hide();

	$("#success_editEmail").hide();
	$("#success_create").hide();
	$("#error_editEmail").hide();
	$("#error_query").hide();
	
	$("#success_editRoles").hide();
	$("#success_create").hide();
	$("#error_editRoles").hide();
	$("#error_query").hide();

	$("#success_editStatus").hide();
	$("#success_create").hide();
	$("#error_editStatus").hide();
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

	$("#success_chain").hide();
	$("#success_create").hide();
	$("#error_chain").hide();
	$("#error_query").hide();

	$("#success_chain_farm_add_pig").hide();
	$("#success_create").hide();
	$("#error_chain_farm_add_pig").hide();
	$("#error_query").hide();

	$("#success_chain_transport_add").hide();
	$("#success_create").hide();
	$("#error_chain_transport_add").hide();
	$("#error_query").hide();

	
	$scope.addUser = function(){
		var usernameRegister = $scope.user.username;
		var Job = (usernameRegister +" :Chờ duyệt.");

		appFactory.addUser($scope.user, function(data){
			$scope.create_tuna = data;
			$("#success_create").show();
			
			// alert('Successfull! Chờ admin duyệt.');
			$timeout(function () {

				appFactory.addHistoryTxID(data, Job, function(data){
				$scope.create_history = data;
				$("#success_create").show();
				
				alert('Hoàn thành.');
				// $localStorage.timeAgo = getTimeAgo;

				// againGetTimeAgo = $localStorage.timeAgo

				// 					console.log('timeAgo: '+ getTimeAgo);
				});
			}, 0);
			
			
		});
	}

	$scope.addHistoryTxID = function(){

		appFactory.addHistoryTxID(txid, job, function(data){
			$scope.create_history = data;
			$("#success_create").show();
			
			alert('Hoàn thành.');
			
		});
	}

	$scope.addChain = function(getkey, getusername, getchainid, getrole, getstateapprove){
		var Job = "Tạo chuỗi cho tài khoản Nông trại " +getusername;
		appFactory.addChain(getkey, getusername, getchainid, getrole, getstateapprove, function(data){
			$scope.create_chain = data;
			$("#success_create").show();
			
			// alert('Đã tạo chuỗi mới: '+countChain+' cho ID: '+ getkeyapprove +' có vai trò Farm ');
			$timeout(function () {

				appFactory.addHistoryTxID(data, Job, function(data){
				$scope.create_history = data;
				$("#success_create").show();
				
				alert('Hoàn thành.');
				
				});
			}, 8000);
			
		});
		$timeout(function () {
			appFactory.editChainIDWhenApprove(getkey, getusername, getchainid, getrole, getstateapprove, function(data){
				$scope.edit_chainid = data;
				if ($scope.edit_chainid == "Error: no user found"){
					$("#error_editChainID").show();
					$("#success_editChainID").hide();
	
				} else{
					$("#success_editChainID").show();
					$("#error_editChainID").hide();
	
				}
				console.log('add chain when approve: ' + getkeyapprove);
				
				// $scope.timeoutqueryAllUser();
				
			});
			
		}, 9000);
		

	}

	$scope.timeoutqueryAllUser = function() {
		$timeout(function () {
			angular.element('#queryAllUser').triggerHandler('click');
			console.log('cai gi do')
		}, 10000);
	} 

	
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

	$scope.queryAllHistoryTxID = function(){

		appFactory.queryAllHistoryTxID(function(data){
			var array = [];
			
			for (var i = 1; i < data.length; i++){
				(data[i].Key);
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
			$scope.all_history_txid = array;
			
		});
		// alert('Successfull');
	}


	$scope.queryAllPig = function(){

		appFactory.queryAllPig(function(data){
			var array = [];
			for (var i = 1; i < data.length; i++){
				(data[i].Key);
				// data[i].Record.Key = parseInt(data[i].Key);

				


				data[i].Record.Key = (data[i].Key);

				//
				// var getChainIdYyyyMmDd = a.Key;
				// var valueOfgetChainIdYyyyMmDd = getChainIdYyyyMmDd.valueOf();
				// console.log('valueOfgetChainIdYyyyMmDd: '+valueOfgetChainIdYyyyMmDd)
				// var splitgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.split('.');
				// console.log('splitgetChainIdYyyyMmDd: '+splitgetChainIdYyyyMmDd)
				// var searchgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.search(",");
				// console.log('searchgetChainIdYyyyMmDd: '+searchgetChainIdYyyyMmDd)
				// var slicegetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.slice(0, searchgetChainIdYyyyMmDd);
				// console.log('slicegetChainIdYyyyMmDd: '+slicegetChainIdYyyyMmDd)
				// var replaceNullgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.replace(".","");
				// console.log('replaceNullgetChainIdYyyyMmDd: '+replaceNullgetChainIdYyyyMmDd)
				// var replaceNullgetChainIdYyyyMmDda = replaceNullgetChainIdYyyyMmDd.replace(".","");
				// console.log('replaceNullgetChainIdYyyyMmDda: '+replaceNullgetChainIdYyyyMmDda)
				// var ymdhmsgetChainIdYyyyMmDd = replaceNullgetChainIdYyyyMmDda.substring(14,18);
				// console.log('ymdhmsgetChainIdYyyyMmDd: '+ymdhmsgetChainIdYyyyMmDd)
				//
				array.push(data[i].Record);
				console.log('================================================================:' +data[i].Key)
				getKeyLength = data[data.length-1].Key
					console.log("--------------------------------------------getKeyLength: "+getKeyLength)
			}
			array.sort(function(a, b) {
				//
				var getChainIdYyyyMmDd = a.Key;
				var valueOfgetChainIdYyyyMmDd = getChainIdYyyyMmDd.valueOf();
				console.log('valueOfgetChainIdYyyyMmDd: '+valueOfgetChainIdYyyyMmDd)
				var splitgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.split('.');
				console.log('splitgetChainIdYyyyMmDd: '+splitgetChainIdYyyyMmDd)
				var searchgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.search(",");
				console.log('searchgetChainIdYyyyMmDd: '+searchgetChainIdYyyyMmDd)
				var slicegetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.slice(0, searchgetChainIdYyyyMmDd);
				console.log('slicegetChainIdYyyyMmDd: '+slicegetChainIdYyyyMmDd)
				var replaceNullgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.replace(".","");
				console.log('replaceNullgetChainIdYyyyMmDd: '+replaceNullgetChainIdYyyyMmDd)
				var replaceNullgetChainIdYyyyMmDda = replaceNullgetChainIdYyyyMmDd.replace(".","");
				console.log('replaceNullgetChainIdYyyyMmDda: '+replaceNullgetChainIdYyyyMmDda)
				var ymdhmsgetChainIdYyyyMmDd = replaceNullgetChainIdYyyyMmDda.substring(14,18);
				console.log('ymdhmsgetChainIdYyyyMmDd: '+ymdhmsgetChainIdYyyyMmDd)
				//

				//
				var getChainIdYyyyMmDdz = b.Key;
				var valueOfgetChainIdYyyyMmDdz = getChainIdYyyyMmDdz.valueOf();
				console.log('valueOfgetChainIdYyyyMmDdz: '+valueOfgetChainIdYyyyMmDdz)
				var splitgetChainIdYyyyMmDdz = valueOfgetChainIdYyyyMmDdz.split('.');
				console.log('splitgetChainIdYyyyMmDdz: '+splitgetChainIdYyyyMmDdz)
				var searchgetChainIdYyyyMmDdz = valueOfgetChainIdYyyyMmDdz.search(",");
				console.log('searchgetChainIdYyyyMmDdz: '+searchgetChainIdYyyyMmDdz)
				var slicegetChainIdYyyyMmDdz = valueOfgetChainIdYyyyMmDdz.slice(0, searchgetChainIdYyyyMmDdz);
				console.log('slicegetChainIdYyyyMmDdz: '+slicegetChainIdYyyyMmDdz)
				var replaceNullgetChainIdYyyyMmDdz = valueOfgetChainIdYyyyMmDdz.replace(".","");
				console.log('replaceNullgetChainIdYyyyMmDdz: '+replaceNullgetChainIdYyyyMmDdz)
				var replaceNullgetChainIdYyyyMmDdzz = replaceNullgetChainIdYyyyMmDdz.replace(".","");
				console.log('replaceNullgetChainIdYyyyMmDdzz: '+replaceNullgetChainIdYyyyMmDdzz)
				var ymdhmsgetChainIdYyyyMmDdz = replaceNullgetChainIdYyyyMmDdzz.substring(14,18);
				console.log('ymdhmsgetChainIdYyyyMmDdz: '+ymdhmsgetChainIdYyyyMmDdz)


				var h = parseInt(ymdhmsgetChainIdYyyyMmDd);
				var l = parseInt(ymdhmsgetChainIdYyyyMmDdz);
				//
				// console.log('~~~~~~~~~~~~~~~a.Key~~~~~~~~~~~~~~b.Key~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'+ parseInt(ymdhmsgetChainIdYyyyMmDd) +'~~~~~~~~~'+ parseInt(ymdhmsgetChainIdYyyyMmDdz) )
			    return l - h
			});
			$scope.all_pig = array;
			// alert('Successfull');
			
		});
		
	}

	$scope.queryAllPigWithAccountFarm = function(){

		appFactory.queryAllPigWithAccountFarm(function(data){
			var array = [];
			var result = 0;
			for (var i = 0; i < data.length; i++){
				if(data[i].Record.farm_account != getUsernameLogin){
					result = 0;
					getKeyLength = data[data.length-1].Key

					// getKeyLengthz = data[data.length].Key
					// console.log("--------------------------------------------getKeyLengthz: "+getKeyLengthz)
					console.log("--------------------------------------------getKeyLength: "+getKeyLength)
					continue;
				} else if ( data[i].Record.farm_account == getUsernameLogin) {
					(data[i].Key);
					data[i].Record.Key = (data[i].Key);
					array.push(data[i].Record);
					result =1;
					console.log('queryAllFarmWithUser: '+ result)
					getKeyLength = data[data.length-1].Key
					console.log("--------------------------------------------getKeyLength: "+getKeyLength)
					continue;
				}
				
			}
			array.sort(function(a, b) {

				//
				var getChainIdYyyyMmDd = a.Key;
				var valueOfgetChainIdYyyyMmDd = getChainIdYyyyMmDd.valueOf();
				console.log('valueOfgetChainIdYyyyMmDd: '+valueOfgetChainIdYyyyMmDd)
				var splitgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.split('.');
				console.log('splitgetChainIdYyyyMmDd: '+splitgetChainIdYyyyMmDd)
				var searchgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.search(",");
				console.log('searchgetChainIdYyyyMmDd: '+searchgetChainIdYyyyMmDd)
				var slicegetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.slice(0, searchgetChainIdYyyyMmDd);
				console.log('slicegetChainIdYyyyMmDd: '+slicegetChainIdYyyyMmDd)
				var replaceNullgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.replace(".","");
				console.log('replaceNullgetChainIdYyyyMmDd: '+replaceNullgetChainIdYyyyMmDd)
				var replaceNullgetChainIdYyyyMmDda = replaceNullgetChainIdYyyyMmDd.replace(".","");
				console.log('replaceNullgetChainIdYyyyMmDda: '+replaceNullgetChainIdYyyyMmDda)
				var ymdhmsgetChainIdYyyyMmDd = replaceNullgetChainIdYyyyMmDda.substring(14,18);
				console.log('ymdhmsgetChainIdYyyyMmDd: '+ymdhmsgetChainIdYyyyMmDd)
				//

				//
				var getChainIdYyyyMmDdz = b.Key;
				var valueOfgetChainIdYyyyMmDdz = getChainIdYyyyMmDdz.valueOf();
				console.log('valueOfgetChainIdYyyyMmDdz: '+valueOfgetChainIdYyyyMmDdz)
				var splitgetChainIdYyyyMmDdz = valueOfgetChainIdYyyyMmDdz.split('.');
				console.log('splitgetChainIdYyyyMmDdz: '+splitgetChainIdYyyyMmDdz)
				var searchgetChainIdYyyyMmDdz = valueOfgetChainIdYyyyMmDdz.search(",");
				console.log('searchgetChainIdYyyyMmDdz: '+searchgetChainIdYyyyMmDdz)
				var slicegetChainIdYyyyMmDdz = valueOfgetChainIdYyyyMmDdz.slice(0, searchgetChainIdYyyyMmDdz);
				console.log('slicegetChainIdYyyyMmDdz: '+slicegetChainIdYyyyMmDdz)
				var replaceNullgetChainIdYyyyMmDdz = valueOfgetChainIdYyyyMmDdz.replace(".","");
				console.log('replaceNullgetChainIdYyyyMmDdz: '+replaceNullgetChainIdYyyyMmDdz)
				var replaceNullgetChainIdYyyyMmDdzz = replaceNullgetChainIdYyyyMmDdz.replace(".","");
				console.log('replaceNullgetChainIdYyyyMmDdzz: '+replaceNullgetChainIdYyyyMmDdzz)
				var ymdhmsgetChainIdYyyyMmDdz = replaceNullgetChainIdYyyyMmDdzz.substring(14,18);
				console.log('ymdhmsgetChainIdYyyyMmDdz: '+ymdhmsgetChainIdYyyyMmDdz)


				var h = parseInt(ymdhmsgetChainIdYyyyMmDd);
				var l = parseInt(ymdhmsgetChainIdYyyyMmDdz);
				//
				// console.log('~~~~~~~~~~~~~~~a.Key~~~~~~~~~~~~~~b.Key~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'+ parseInt(ymdhmsgetChainIdYyyyMmDd) +'~~~~~~~~~'+ parseInt(ymdhmsgetChainIdYyyyMmDdz) )
			    return (l) - (h);
			});
			$scope.all_pig_with_account_farm = array;
		});
	}

	$scope.queryAllPigWithAccountTransport = function(){

		appFactory.queryAllPigWithAccountTransport(function(data){
			var array = [];
			var result = 0;
			for (var i = 0; i < data.length; i++){
				if(data[i].Record.transport_account != getUsernameLogin){
					result = 0;
					continue;
				} else if ( data[i].Record.transport_account == getUsernameLogin) {
					parseInt(data[i].Key);
					data[i].Record.Key = data[i].Key;
					array.push(data[i].Record);
					result =1;
					console.log('queryAllTransportWithUser: '+ result)
					continue;
				}
				
			}
			array.sort(function(a, b) {
			    return a.Key - b.Key;
			});
			$scope.all_pig_with_account_transport = array;
		});
	}

	$scope.queryAllPigWithAccountAbattoir = function(){

		appFactory.queryAllPigWithAccountAbattoir(function(data){
			var array = [];
			var result = 0;
			for (var i = 0; i < data.length; i++){
				if(data[i].Record.abattoir_account != getUsernameLogin){
					result = 0;
					continue;
				} else if ( data[i].Record.abattoir_account == getUsernameLogin) {
					parseInt(data[i].Key);
					data[i].Record.Key = (data[i].Key);
					array.push(data[i].Record);
					result =1;
					console.log('queryAllAbattoirWithUser: '+ result)
					continue;
				}
				
			}
			array.sort(function(a, b) {
			    return (a.Key) - (b.Key);
			});
			$scope.all_pig_with_account_abattoir = array;
		});
	}

	$scope.queryAllPigWithAccountSupermarket = function(){

		appFactory.queryAllPigWithAccountSupermarket(function(data){
			var array = [];
			var result = 0;
			for (var i = 0; i < data.length; i++){
				if(data[i].Record.supermarket_account != getUsernameLogin){
					result = 0;
					continue;
				} else if ( data[i].Record.supermarket_account == getUsernameLogin) {
					parseInt(data[i].Key);
					data[i].Record.Key = (data[i].Key);
					array.push(data[i].Record);
					result =1;
					console.log('queryAllSupermarketWithUser: '+ result)
					continue;
				}
				
			}
			array.sort(function(a, b) {
			    return (a.Key) - (b.Key);
			});
			$scope.all_pig_with_account_supermarket = array;
		});
	}

	// $scope.queryAllFarmWithUser = function(){

	// 	appFactory.queryAllFarmWithUser(function(data){
	// 		var array = [];
	// 		var result = 0;
	// 		for (var i = 0; i < data.length; i++){
	// 			if(data[i].Record.username != getUsernameLogin){
	// 				result = 0;
	// 				continue;
	// 			} else if ( data[i].Record.username == getUsernameLogin) {
	// 				parseInt(data[i].Key);
	// 				data[i].Record.Key = parseInt(data[i].Key);
	// 				array.push(data[i].Record);
	// 				result =1;
	// 				console.log('queryAllFarmWithUser: '+ result)
	// 				continue;
	// 			}
				
	// 		}
	// 		array.sort(function(a, b) {
	// 		    return parseFloat(a.Key) - parseFloat(b.Key);
	// 		});
	// 		$scope.all_pig = array;
	// 		// alert('Successfull');
	// 	});
	// }

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
				$("#success_query").show();

				// alert('Tra cứu thành công! Click vào công đoạn để xem.')
			}
			
		
		});
		
	}
	
	$scope.recordFarm = function(){

		appFactory.recordFarm($scope.pig, function(data){
			$scope.create_tuna = data;
			$("#success_create").show();
			// alert('Successfull');

		});
	}

	$scope.initChainBtn = function(){
		$scope.initChain();
		// $timeout(function () {
		// 	angular.element('#queryAllPig').triggerHandler('click');
			
		// }, 5000);
		// console.log('timeouted')
	}

	$scope.initChainFarmAdd = function(){

		
		var currentUser = angular.element('#currentUser').val();
		console.log('getAccountCurrent1:'+getAccountCurrent)
		var Job = "Tạo mã mới cho heo xảy ra vấn đề"
		var id = $localStorage.chainidLocalStorage;
			
		var getInputChainId = angular.element('#all_pig').val();
		console.log('/////////////////////////getInputChainId/////////////////////: '+getInputChainId)
		var valueOf = getInputChainId.valueOf();
		var split = valueOf.split('.');
		console.log('split: '+split)
		var search = valueOf.search(",");
		console.log('search: '+search)
		var slice = valueOf.slice(0, search);
		console.log('slice: '+slice)
		var replaceNull = valueOf.replace(".","");
		console.log('slice: '+slice)
		var ymdhms = replaceNull.substring(0,14);
		console.log('/////////////////////////ymdhms/////////////////////: '+ymdhms)
		var yyyymmdd = replaceNull.substring(0,8);
		console.log('yyyymmdd: '+yyyymmdd)
		var hmsHash = replaceNull.substring(8,14);
		console.log('hmsHash: '+hmsHash)

		appFactory.queryAllPig( function(data){
			var resultUser  =0;
			console.log('chainidfarmaddpig: '+ id)
			for (var i = data.length-1; i >0 ; i--){

				var getDateIKey = data[i].Key
				var valueOfgetDateIKey = getDateIKey.valueOf();
				var splitgetDateIKey = valueOfgetDateIKey.split('.');
				console.log('splitgetDateIKey: '+splitgetDateIKey)
				var searchgetDateIKey = valueOfgetDateIKey.search(",");
				console.log('searchgetDateIKey: '+searchgetDateIKey)
				var slicegetDateIKey = valueOfgetDateIKey.slice(0, searchgetDateIKey);
				console.log('slicegetDateIKey: '+slicegetDateIKey)
				var replaceNullgetDateIKey = valueOfgetDateIKey.replace(".","");
				console.log('replaceNullgetDateIKey: '+replaceNullgetDateIKey)


				var sttreplaceNullgetDateIKey = replaceNullgetDateIKey.replace(".","");
				console.log('/////sttreplaceNullgetDateIKey//////sttsttreplaceNullgetDateIKey '+sttreplaceNullgetDateIKey)
				var stt =  sttreplaceNullgetDateIKey.substring(14,18);
				console.log('/////sttsttsttsttsttsttsttsttstt//////stt/////////////////////: '+stt)

				var ymdhmsgetDateIKey = replaceNullgetDateIKey.substring(0,14);
				console.log('////////////////////////ymdhmsgetDateIKey/////////////////////: '+ymdhmsgetDateIKey)
				var yyyymmddgetDateIKey = replaceNullgetDateIKey.substring(0,8);
				console.log('yyyymmddgetDateIKey: '+yyyymmddgetDateIKey)
				var hmsHashgetDateIKey = replaceNullgetDateIKey.substring(8,14);

				sendHmsHashgetDateIKey = stt
				console.log('hmsHashgetDateIKey: '+hmsHashgetDateIKey)

				if(  ymdhmsgetDateIKey != ymdhms){
					// console.log('--------------------------data[i].Key---'+data[i].Key)
					// console.log('dk false: '+resultUser); 
					$localStorage.countChain = data.length+1;
					countChain = $localStorage.countChain;
					// getymdhmsgetDateIKey = ymdhmsgetDateIKey
					console.log("--------------------ymdhmsgetDateIKey---" +ymdhmsgetDateIKey+"----===---ymdhms------------id: "+ymdhms)
					
					getKeyLength = data[data.length-1].Key
					console.log("-------------------------initChainFarmAdd-------------------getKeyLength: "+data[i].Key)

					getFamerAddChain = data[i].Record.famer;

					getTransportAccountFarmAddChain = data[i].Record.transport_account;
					getCompanyFarmAddChain = data[i].Record.company;
					console.log('getCompanyFarmAddChain: '+ getCompanyFarmAddChain)
					getTransporterFarmAddChain = data[i].Record.transporter;
					getVehicleFarmAddChain = data[i].Record.vehicle;
					getTransportTroubleSolutionFarmAddChain = data[i].Record.transport_trouble_solution;
					getTransport_qualifiedFarmAddChain = data[i].Record.transport_qualified;
					getTimeFarmAddChain = data[i].Record.time;

					getAbattoirAccountFarmAddChain = data[i].Record.abattoir_account;
					getAbattoirNameFarmAddChain = data[i].Record.abattoir_name;
					getAbattoirTroubleSolutionFarmAddChain = data[i].Record.abattoir_trouble_solution;
					getAbattoirLocatioFarmAddChain = data[i].Record.abattoir_location;
					getAbattoirQualifiedFarmAddChain = data[i].Record.abattoir_qualified;
					getPeckTimeFarmAddChain = data[i].Record.peck_time;

					getSupermarketAccountFarmAddChain = data[i].Record.supermarket_account;
					getSupermarketNameFarmAddChain = data[i].Record.supermarket_name;
					getSupermarketTroubleSolutionFarmAddChain = data[i].Record.supermarket_trouble_solution;
					getSupermarketQualifiedFarmAddChain = data[i].Record.supermarket_qualified;
					getPriceFarmAddChain = data[i].Record.price;
					getQuantityRemainingFarmAddChain = data[i].Record.quantity_remaining;
					getManufacturingDateFarmAddChain = data[i].Record.manufacturing_date;
					getExpiryDateFarmAddChain = data[i].Record.expiry_date;
					
					console.log('data key i: '+data[i].Key);
					console.log('dk true: '+resultUser);

					

					resultUser = 0;
					continue;
				} else if(  ymdhmsgetDateIKey == ymdhms){
					$localStorage.countChain = data.length+1;
					countChain = $localStorage.countChain;
					getymdhmsgetDateIKey = ymdhmsgetDateIKey
					console.log("--------------------ymdhmsgetDateIKey---" +ymdhmsgetDateIKey+"----===---ymdhms------------id: "+ymdhms)

					getKeyLength = data[data.length-1].Key
					console.log("-------------------------initChainFarmAdd-------------------getKeyLength: "+data[i].Key)

					getFamerAddChain = data[i].Record.famer;

					getTransportAccountFarmAddChain = data[i].Record.transport_account;
					getCompanyFarmAddChain = data[i].Record.company;
					console.log('getCompanyFarmAddChain: '+ getCompanyFarmAddChain)
					getTransporterFarmAddChain = data[i].Record.transporter;
					getVehicleFarmAddChain = data[i].Record.vehicle;
					getTransportTroubleSolutionFarmAddChain = data[i].Record.transport_trouble_solution;
					getTransport_qualifiedFarmAddChain = data[i].Record.transport_qualified;
					getTimeFarmAddChain = data[i].Record.time;

					getAbattoirAccountFarmAddChain = data[i].Record.abattoir_account;
					getAbattoirNameFarmAddChain = data[i].Record.abattoir_name;
					getAbattoirTroubleSolutionFarmAddChain = data[i].Record.abattoir_trouble_solution;
					getAbattoirLocatioFarmAddChain = data[i].Record.abattoir_location;
					getAbattoirQualifiedFarmAddChain = data[i].Record.abattoir_qualified;
					getPeckTimeFarmAddChain = data[i].Record.peck_time;

					getSupermarketAccountFarmAddChain = data[i].Record.supermarket_account;
					getSupermarketNameFarmAddChain = data[i].Record.supermarket_name;
					getSupermarketTroubleSolutionFarmAddChain = data[i].Record.supermarket_trouble_solution;
					getSupermarketQualifiedFarmAddChain = data[i].Record.supermarket_qualified;
					getPriceFarmAddChain = data[i].Record.price;
					getQuantityRemainingFarmAddChain = data[i].Record.quantity_remaining;
					getManufacturingDateFarmAddChain = data[i].Record.manufacturing_date;
					getExpiryDateFarmAddChain = data[i].Record.expiry_date;
					
					resultUser = 1;
					console.log('data key i: '+data[i].Key);
					console.log('dk true: '+resultUser);

					
					
					break;
				}
				
				
			}
			if (resultUser == 1){
				console.log('if result=1:')
				
				appFactory.initChainFarmAdd($scope.chain, function(data){
					$scope.create_chain_farm_add_pig = data;
					$("#success_chain_farm_add_pig").show();
					
					$timeout( function () {
						angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
						appFactory.addHistoryTxID(data, Job, function(data){
							$scope.create_history = data;
							$("#success_create").show();
							
							alert('Hoàn thành.');
							
						});
					}, 4000)
					
					
					
				});
			} else if (resultUser == 0){
				// alert('loi initChainFarmAdd');
				appFactory.initChainFarmAdd($scope.chain, function(data){
					$scope.create_chain_farm_add_pig = data;
					$("#success_chain_farm_add_pig").show();
					
					$timeout( function () {
						angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
						appFactory.addHistoryTxID(data, Job, function(data){
							$scope.create_history = data;
							$("#success_create").show();
							
							alert('Hoàn thành.');
							
						});
					}, 4000)
					
					
					
				});
				
			}
		});

		$timeout( function () {
			angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
			angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
			angular.element('#queryAllPigWithAccountAbattoir').triggerHandler('click');
			angular.element('#queryAllPigWithAccountSupermarket').triggerHandler('click');
		}, 5000)
		
		
	}


	$scope.initChain = function(){
		var Job = "Khởi tạo chuỗi mới"
		var chainID = $scope.chain.id;
		appFactory.queryAllPig( function(data){
			var resultUser  =0;
					for (var i = 0; i < data.length; i++){
						if (chainID == (data[i].Key)){
							resultUser = 0;
							getKeyLength = data[data.length-1].Key
					console.log("--------------------------------------------getKeyLength: "+getKeyLength)
							break;
						} else if (chainID != (data[i].Key)){
							resultUser = 1;
							getKeyLength = data[data.length-1].Key
					console.log("--------------------------------------------getKeyLength: "+getKeyLength)
							continue;
						}
						console.log(resultUser);
					}
					if (resultUser == 1){
						// alert('Chờ xử lý giao dịch!...');


						appFactory.initChain($scope.chain, function(data){
							$scope.create_chain = data;
							$("#success_chain").show();
							$timeout(function () {
								appFactory.addHistoryTxID(data, Job, function(data){
									$scope.create_history = data;
									$("#success_create").show();
									
									alert('Hoàn thành.');
									
								});
							}, 4000);
							
							
						});
						$timeout(function () {
							angular.element('#queryAllPig').triggerHandler('click');
							angular.element('#queryAllPigWithAccountFarm').triggerHandler('click');
							angular.element('#queryAllPigWithAccountTransport').triggerHandler('click');
							angular.element('#queryAllPigWithAccountAbattoir').triggerHandler('click');
							angular.element('#queryAllPigWithAccountSupermarket').triggerHandler('click');
							
						}, 4000);

						// alert('Tạo thành công chuỗi. ID là: '+chainID);
					} else if (resultUser == 0){
						alert('ID chuỗi đã tồn tại. Nhập ID mới');
						
					}
					
		});
		
		
	}

	

	$scope.recordTransport = function(){

		appFactory.recordTransport($scope.pig, function(data){
			$scope.create_transport = data;
			$("#success_create").show();
			// alert('Successfull');
		});
	}

	

	$scope.insertAbattoir = function(){

		appFactory.insertAbattoir($scope.abattoir, function(data){
			$scope.insert_abattoir = data;
			if ($scope.insert_abattoir == "Error: no abattoir found"){
				$("#error_holder").show();
				$("#success_holder").hide();
				// alert('Successfull');
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
				// alert('Successfull');
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

	// $scope.getKeyQueryViewUser = function(){
	// 	var getkey = angular.element('#getIdUserCurrent').val();
	// 	$scope.queryViewUser(getkey);
	// }

	//queryViewUser
	$scope.queryViewUser = function(){
		var getFamer = $scope.getFamer;
		var id = $localStorage.iduserLocalStorage;
		var getkey = angular.element('#getIdUserCurrent').val();
		console.log("==========getkey======queryViewUser==="+ getkey);
		console.log("==========getrole queryviewuser========="+id);

		appFactory.queryViewUser(getkey, function(data){
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
				// alert('Successfull');
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

	factory.deleteUser = function (data, callback) {
        console.log("uslo u deleteUser");
        console.log(data);
		var user = data.Key + "-" + data.msg + "-" + data.username + "-" + data.password + "-" + data.email + "-" + data.chainid + "-" + data.roles + "-" + data.status + "-" + data.approve;
        $http.get('/delete_user/' + user).success(function (output) {
            callback(output);
        });
    }

	factory.logOut = function (callback) {
        $http.get('/logout').success(function (output) {
            callback(output);
        });
    }


	

	// update info farm 
	factory.updateFarmAccount = function(data, callback){
		
		var farm = getChainidWhenUpdateChainid + "-" + getUsernameWhenUpdateChainid;

    	$http.get('/update_farm_account/'+farm).success(function(output){
			callback(output)
		});
	}
	
	factory.updateFamer = function(data, callback){
		var getkey = $('#addFamer .modal-body-getkey span').text();
		
		var farm = getkey + "-" + data.famer;

    	$http.get('/update_famer/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateSpecies = function(data, callback){
		var getkey = $('#addSpecies .modal-body-getkey span').text();
		
		// var farm = getKeyUpdateSpecies + "-" + data.editspecies;
		var farm = getkey + "-" + data.species;
		

    	$http.get('/update_species/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateFood = function(data, callback){
		var getkey = $('#addFood .modal-body-getkey span').text();
		var farm = getkey + "-" + getFoodForUpdateFood+ ", " + data.food;

    	$http.get('/update_food/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateSickCure = function(data, callback){
		var getkey = $('#addSickCure .modal-body-getkey span').text();

		var farm = getkey + "-" + getSickCureForUpdateSickCure + ", " +data.sickcure;

    	$http.get('/update_sick_cure/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateFarmQualified = function(data, callback){
		var getkey = $('#addFarmQualified .modal-body-getkey span').text();

		var farm = getkey + "-" + data.farmqualified;

    	$http.get('/update_farm_qualified/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateLocation = function(data, callback){

		var getkey = $('#addLocation .modal-body-getkey span').text();
		var farm = getkey + "-" + data.location;

    	$http.get('/update_location/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateStartDate = function(data, callback){

		var getkey = $('#addStartDate .modal-body-getkey span').text();
		var convertEndDate = new Date(data.startdate).toString()
		var getValueEndDate = convertEndDate.valueOf();

		var EndDateArrat = getValueEndDate.split('/');

		var convertEndDate = new Date(EndDateArrat[0]+'-'+EndDateArrat[1]+'-'+EndDateArrat[2]);
		console.log('convertEndDate: '+convertEndDate)


		var endDate = getValueEndDate.search(",");

		var resultEndDate = getValueEndDate.slice(0, endDate);
		
		var newEndDate = new Date(resultEndDate)


		var monthNames = [
			"January", "February", "March",
			"April", "May", "June", "July",
			"August", "September", "October",
			"November", "December"
		];

		var minutes = newEndDate.getMinutes();
		var hours = newEndDate.getHours();
		var endday = newEndDate.getDate();
		var enddatemonthIndex = newEndDate.getMonth();
		var enddateyear = newEndDate.getFullYear();

		var converDateSuccess = monthNames[enddatemonthIndex] + ' ' + endday + ' ' + enddateyear;
		console.log('converDateSuccess: '+converDateSuccess)
		
		var farm = getkey + "-" + converDateSuccess;

    	$http.get('/update_start_date/'+farm).success(function(output){
			callback(output)
		});
	}

	factory.updateEndDate = function(data, callback){

		var getkey = $('#addEndDate .modal-body-getkey span').text();
		var convertEndDate = new Date(data.enddate).toString()
		var getValueEndDate = convertEndDate.valueOf();

		var EndDateArrat = getValueEndDate.split('/');

		var convertEndDate = new Date(EndDateArrat[0]+'-'+EndDateArrat[1]+'-'+EndDateArrat[2]);
		console.log('convertEndDate: '+convertEndDate)


		var endDate = getValueEndDate.search(",");

		var resultEndDate = getValueEndDate.slice(0, endDate);
		
		var newEndDate = new Date(resultEndDate)


		var monthNames = [
			"January", "February", "March",
			"April", "May", "June", "July",
			"August", "September", "October",
			"November", "December"
		];

		var minutes = newEndDate.getMinutes();
		var hours = newEndDate.getHours();
		var endday = newEndDate.getDate();
		var enddatemonthIndex = newEndDate.getMonth();
		var enddateyear = newEndDate.getFullYear();

		var converDateSuccess = monthNames[enddatemonthIndex] + ' ' + endday + ' ' + enddateyear;
		console.log('converDateSuccess: '+converDateSuccess)
		
		var farm = getkey + "-" + converDateSuccess;

    	$http.get('/update_end_date/'+farm).success(function(output){
			callback(output)
		});
	}

	// update info transport 
	factory.updateTransportAccount = function(data, callback){
		
		var transport = getChainidWhenUpdateChainid + "-" + getUsernameWhenUpdateChainid;

    	$http.get('/update_transport_account/'+transport).success(function(output){
			callback(output)
		});
	}


	factory.updateCompany = function(data, callback){
		
		var getkey = $('#addCompany .modal-body-getkey span').text();
		var transport = getkey + "-" + data.company;

    	$http.get('/update_company/'+transport).success(function(output){
			callback(output)
		});
	}

	factory.updateTransporter = function(data, callback){
		
		var getkey = $('#addTransporter .modal-body-getkey span').text();
		var transport = getkey + "-" + data.transporter;

    	$http.get('/update_transporter/'+transport).success(function(output){
			callback(output)
		});
	}

	factory.updateVehicle = function(data, callback){
		
		var getkey = $('#addVehicle .modal-body-getkey span').text();
		var transport = getkey + "-" + data.vehicle;

    	$http.get('/update_vehicle/'+transport).success(function(output){
			callback(output)
		});
	}
	factory.updateTrouble = function(data, callback){
		
		var getkey = $('#addTransportTroubleSolution .modal-body-getkey span').text();
		var transport = getkey + "-" + data.trouble;

    	$http.get('/update_trouble/'+transport).success(function(output){
			callback(output)
		});
	}

	factory.updateTransportQualified = function(data, callback){
		
		var getkey = $('#addTransportQualified .modal-body-getkey span').text();
		var transport = getkey + "-" + data.transport_qualified;

    	$http.get('/update_transport_qualified/'+transport).success(function(output){
			callback(output)
		});
	}
	factory.updateTime= function(data, callback){

		var getkey = $('#addTime .modal-body-getkey span').text();
		var convertEndDate = new Date(data.time).toString()
		var getValueEndDate = convertEndDate.valueOf();

		var EndDateArrat = getValueEndDate.split('/');

		var convertEndDate = new Date(EndDateArrat[0]+'-'+EndDateArrat[1]+'-'+EndDateArrat[2]+'-'+EndDateArrat[3]+'-'+EndDateArrat[4]);
		console.log('convertEndDate: '+convertEndDate)


		var endDate = getValueEndDate.search(",");

		var resultEndDate = getValueEndDate.slice(0, endDate);
		
		var newEndDate = new Date(resultEndDate)


		var monthNames = [
			"January", "February", "March",
			"April", "May", "June", "July",
			"August", "September", "October",
			"November", "December"
		];

		var minutes = newEndDate.getMinutes();
		var hours = newEndDate.getHours();
		var endday = newEndDate.getDate();
		var enddatemonthIndex = newEndDate.getMonth();
		var enddateyear = newEndDate.getFullYear();

		var converDateSuccess = monthNames[enddatemonthIndex] + ' ' + endday + ' ' + enddateyear + ' ' + hours + 'H:' + minutes;
		console.log('converDateSuccess: '+converDateSuccess)
		
		var transport = getkey + "-" + converDateSuccess;

    	$http.get('/update_time/'+transport).success(function(output){
			callback(output)
		});
	}
	//update abattoir info
	factory.updateAbattoirAccount = function(data, callback){
		
		console.log('new getChainidWhenUpdateChainid:'+getChainidWhenUpdateChainid)
		var abattoir = getChainidWhenUpdateChainid + "-" + getUsernameWhenUpdateChainid;

    	$http.get('/update_abattoir_account/'+abattoir).success(function(output){
			callback(output)
		});
	}
	factory.updateAbattoirName = function(data, callback){
		
		var getkey = $('#addAbattoirName .modal-body-getkey span').text();
		var abattoir = getkey + "-" + data.abattoir_name;

    	$http.get('/update_abattoir_name/'+abattoir).success(function(output){
			callback(output)
		});
	}

	factory.updateAbattoirTrouble = function(data, callback){
		
		var getkey = $('#addAbattoirTroubleSolution .modal-body-getkey span').text();
		var abattoir = getkey + "-" + data.abattoirtrouble;

    	$http.get('/update_abattoir_trouble_solution/'+abattoir).success(function(output){
			callback(output)
		});
	}

	factory.updateAbattoirLocation = function(data, callback){
		
		var getkey = $('#addAbattoirLocation .modal-body-getkey span').text();
		var abattoir = getkey + "-" + data.abattoirlocation;

    	$http.get('/update_abattoir_location/'+abattoir).success(function(output){
			callback(output)
		});
	}
	factory.updateAbattoirQualified = function(data, callback){
		
		var getkey = $('#addAbattoirQualified .modal-body-getkey span').text();
		var abattoir = getkey + "-" + data.abattoirqualified;

    	$http.get('/update_abattoir_qualified/'+abattoir).success(function(output){
			callback(output)
		});
	}
	factory.updateAbattoirPeckTime = function(data, callback){

		var getkey = $('#addPeckTime .modal-body-getkey span').text();
		var convertEndDate = new Date(data.pecktime).toString()
		var getValueEndDate = convertEndDate.valueOf();

		var EndDateArrat = getValueEndDate.split('/');

		var convertEndDate = new Date(EndDateArrat[0]+'-'+EndDateArrat[1]+'-'+EndDateArrat[2]+'-'+EndDateArrat[3]+'-'+EndDateArrat[4]);
		console.log('convertEndDate: '+convertEndDate)


		var endDate = getValueEndDate.search(",");

		var resultEndDate = getValueEndDate.slice(0, endDate);
		
		var newEndDate = new Date(resultEndDate)


		var monthNames = [
			"January", "February", "March",
			"April", "May", "June", "July",
			"August", "September", "October",
			"November", "December"
		];

		var minutes = newEndDate.getMinutes();
		var hours = newEndDate.getHours();
		var endday = newEndDate.getDate();
		var enddatemonthIndex = newEndDate.getMonth();
		var enddateyear = newEndDate.getFullYear();

		var converDateSuccess = monthNames[enddatemonthIndex] + ' ' + endday + ' ' + enddateyear+ ' ' + hours+ 'H:' + minutes;
		console.log('converDateSuccess: '+converDateSuccess)

		
		var abattoir = getkey + "-" + converDateSuccess;

    	$http.get('/update_abattoir_peck_time/'+abattoir).success(function(output){
			callback(output)
		});
	}

	//update supermarket info
	factory.updateSupermarketAccount = function(data, callback){
		
		var supermarket = getChainidWhenUpdateChainid + "-" + getUsernameWhenUpdateChainid;

    	$http.get('/update_supermarket_account/'+supermarket).success(function(output){
			callback(output)
		});
	}
	factory.updateSupermarketName = function(data, callback){

		var getkeyupdat = $('#addSupermarketName .modal-body-getkey span').text();
		
		var supermarket = getkeyupdat + "-" + data.supermarket_name;
		console.log('getkeyupdateSupermarketNamegetkeyupdateSupermarketNamegetkeyupdateSupermarketNamegetkeyupdateSupermarketName'+getkeyupdat)

    	$http.get('/update_supermarket_name/'+supermarket).success(function(output){
			callback(output)
		});
	}
	factory.updateSupermarketTroubleSolution = function(data, callback){

		var getkey = $('#addSupermarketTroubleSolution .modal-body-getkey span').text();
		
		var supermarket = getkey + "-" + data.trouble;

    	$http.get('/update_supermarket_trouble_solution/'+supermarket).success(function(output){
			callback(output)
		});
	}
	factory.updateSupermarketQualified = function(data, callback){
		

		var getkey = $('#addSupermartketQualified .modal-body-getkey span').text();
		var supermarket = getkey + "-" + data.supermarketqualified;

    	$http.get('/update_supermarket_qualified/'+supermarket).success(function(output){
			callback(output)
		});
	}
	factory.updateSupermarketPrice = function(data, callback){
		
		var getkey = $('#addPrice .modal-body-getkey span').text();
		var supermarket = getkey + "-" + data.price;

    	$http.get('/update_supermarket_price/'+supermarket).success(function(output){
			callback(output)
		});
	}
	factory.updateSupermarketQuantityRemaining = function(data, callback){
		
		var getkey = $('#addSupermartketQuantityRemaining .modal-body-getkey span').text();
		var supermarket = getkey + "-" + data.supermarketquantityremaining;

    	$http.get('/update_supermarket_quantity_remaining/'+supermarket).success(function(output){
			callback(output)
		});
	}
	factory.updateSupermarketMFG = function(data, callback){

		var getkey = $('#addMFG .modal-body-getkey span').text();
		var convertEndDate = new Date(data.supermarketmfg).toString()
		var getValueEndDate = convertEndDate.valueOf();

		var EndDateArrat = getValueEndDate.split('/');

		var convertEndDate = new Date(EndDateArrat[0]+'-'+EndDateArrat[1]+'-'+EndDateArrat[2]);
		console.log('convertEndDate: '+convertEndDate)


		var endDate = getValueEndDate.search(",");

		var resultEndDate = getValueEndDate.slice(0, endDate);
		
		var newEndDate = new Date(resultEndDate)


		var monthNames = [
			"January", "February", "March",
			"April", "May", "June", "July",
			"August", "September", "October",
			"November", "December"
		];

		var minutes = newEndDate.getMinutes();
		var hours = newEndDate.getHours();
		var endday = newEndDate.getDate();
		var enddatemonthIndex = newEndDate.getMonth();
		var enddateyear = newEndDate.getFullYear();

		var converDateSuccess = monthNames[enddatemonthIndex] + ' ' + endday + ' ' + enddateyear;
		console.log('converDateSuccess: '+converDateSuccess)
		
		var supermarket = getkey + "-" + converDateSuccess;

    	$http.get('/update_supermarket_mfg/'+supermarket).success(function(output){
			callback(output)
		});
	}
	factory.updateSupermarketEXP = function(data, callback){

		var getkey = $('#addEXP .modal-body-getkey span').text();
		var convertEndDate = new Date(data.supermarketexp).toString()
		var getValueEndDate = convertEndDate.valueOf();

		var EndDateArrat = getValueEndDate.split('/');

		var convertEndDate = new Date(EndDateArrat[0]+'-'+EndDateArrat[1]+'-'+EndDateArrat[2]);
		console.log('convertEndDate: '+convertEndDate)


		var endDate = getValueEndDate.search(",");

		var resultEndDate = getValueEndDate.slice(0, endDate);
		
		var newEndDate = new Date(resultEndDate)


		var monthNames = [
			"January", "February", "March",
			"April", "May", "June", "July",
			"August", "September", "October",
			"November", "December"
		];

		var minutes = newEndDate.getMinutes();
		var hours = newEndDate.getHours();
		var endday = newEndDate.getDate();
		var enddatemonthIndex = newEndDate.getMonth();
		var enddateyear = newEndDate.getFullYear();

		var converDateSuccess = monthNames[enddatemonthIndex] + ' ' + endday + ' ' + enddateyear;
		console.log('converDateSuccess: '+converDateSuccess)
		
		var supermarket = getkey + "-" + converDateSuccess;

    	$http.get('/update_supermarket_exp/'+supermarket).success(function(output){
			callback(output)
		});
	}

	factory.editPassword = function(data, callback){
		// var getUserId = angular.element('#idUser').val();

		var getkey = $('#editPassword .modal-body-getkey span').text();
		// var getkey = angular.element("#getKeyPassword").val();

		console.log('---------------------------------getkeyeditPassword: '+getkey)
		var user = getkey + "-" + data.password  ;

    	$http.get('/edit_password/'+user).success(function(output){
			callback(output)
		});
	}

	factory.editEmail = function(data, callback){

		var ok = document.getElementById("hashImg").value;
		console.log('---------------------------------getElementById: '+ok)
		var getkey = $('#editEmail .modal-body-getkey span').text();
		// var getkey = document.getElementById("getKeyEmail").value;

		var user = getkey + "-" + data.email  ;

    	$http.get('/edit_email/'+user).success(function(output){
			callback(output)
		});
	}

	factory.editImg = function(data, callback){

		var img = document.getElementById("hashImg").value;
		console.log('---------------------------------getElementById: '+img)

		var getkey = angular.element('#getIdUserCurrent').val();

		var user = getkey + "-" + img  ;

    	$http.get('/edit_img/'+user).success(function(output){
			callback(output)
		});
	}

	factory.editChainID = function(data, callback){

		var getkey = $('#editChainID .modal-body-getkey span').text();

		var user = getkey + "-" + data.chainid  ;
		getChainidWhenUpdateChainid = data.chainid;


    	$http.get('/edit_chainid/'+user).success(function(output){
			callback(output)
		});
	}

	factory.editChainIDWhenApprove = function(getkey, getusername, getchainid, getrole, getstateapprove, callback){

		var convertEndDate = new Date(Date.now()).toString()
		
		var getValueEndDate = convertEndDate.valueOf();

		var EndDateArrat = getValueEndDate.split('/');

		var convertEndDate = new Date(EndDateArrat[2]);
		console.log('convertEndDate: '+convertEndDate)


		var endDate = getValueEndDate.search(",");

		var resultEndDate = getValueEndDate.slice(0, endDate);
		
		var newEndDate = new Date(resultEndDate)


		var monthNames = [
			"01", "02", "03",
			"04", "05", "06", "07",
			"08", "09", "10",
			"11", "12"
		];

		var minutes = newEndDate.getMinutes();
		var hours = newEndDate.getHours();
		var endday = newEndDate.getDate();
		var enddatemonthIndex = newEndDate.getMonth();
		var enddateyear = newEndDate.getFullYear();
		var second = newEndDate.getSeconds();

		if (endday < 10) {
			endday = "0" + endday;
			
		} else if (hours <10){
			hours = "0" + hours;
		} else if (minutes<10){
			minutes = "0" + minutes;
		} else if (second<10){
			second = "0" + second;
		}

		// var takeChainId = angular.element('#')

		var create_time = enddateyear +''+ monthNames[enddatemonthIndex]  +''+ endday;
		console.log('createID: '+create_time)
		var hms =  hours +''+ minutes +''+ second

		console.log('----------------------------------- getkeygetkeygetkeygetkeygetkeygetkey'+getkey)
		
		var user = getkey + "-" +create_time +"."+gethms+".000"+ 1  ;
		console.log(getkey + ' : ' + create_time+".000"+(countChain))

    	$http.get('/edit_chainid/'+user).success(function(output){
			callback(output)
		});
	}

	factory.editRoles = function(data, callback){
		var getkey = $('#editRoles .modal-body-getkey span').text();

		var user = getkey + "-" + data.role  ;

    	$http.get('/edit_roles/'+user).success(function(output){
			callback(output)
		});
	}

	factory.editStatus = function(data,  callback){
		var getkey = $('#editStatus .modal-body-getkey span').text();

		console.log('----------------------------------- getkeyeditStatus'+getkey)
		var user = getkey + "-" + data.status  ;

    	$http.get('/edit_status/'+user).success(function(output){
			callback(output)
		});
	}

	factory.approveUser = function(getkey, getusername, getchainid, getrole, getstateapprove, callback){

		var user = getkey + "-" + "ENABLE" + "-" + "APPROVED" ;

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
		// console.log('password :'+password)
    	$http.get('/sign_up/'+username).success(function(output){
			callback(output)
		});
	}

	factory.addUser = function(data, callback){

		var user = "user"+countUser + "-"  + "img" + "-" + data.username + "-" + data.password + "-" + data.email + "-" + "NULL" + "-" + data.roles + "-" + "DISABLE" + "-" + "WAITTING";

    	$http.get('/add_user/'+user).success(function(output){
			callback(output)
		});
	}

	factory.addHistoryTxID = function(txid, job, callback){
		var Job =job
		console.log('Job:'+Job)
		// var dateNoew = new Date(Date.now());
		// var create_time = dateNoew.toString();

		var convertEndDate = new Date(Date.now()).toString()
		var timeago = new Date(Date.now()).toLocaleString()
		var getValueEndDate = convertEndDate.valueOf();

		var EndDateArrat = getValueEndDate.split('/');

		var convertEndDate = new Date(EndDateArrat[0]+'-'+EndDateArrat[1]+'-'+EndDateArrat[2]+'-'+EndDateArrat[3]+'-'+EndDateArrat[4]);
		console.log('convertEndDate: '+convertEndDate)


		var endDate = getValueEndDate.search(",");

		var resultEndDate = getValueEndDate.slice(0, endDate);
		
		var newEndDate = new Date(resultEndDate)


		var monthNames = [
			"January", "February", "March",
			"April", "May", "June", "July",
			"August", "September", "October",
			"November", "December"
		];

		var minutes = newEndDate.getMinutes();
		var hours = newEndDate.getHours();
		var endday = newEndDate.getDate();
		var enddatemonthIndex = newEndDate.getMonth();
		var enddateyear = newEndDate.getFullYear();

		var create_time = monthNames[enddatemonthIndex] + ' ' + endday + ' ' + enddateyear + ' ' + hours + 'H:' + minutes;
		console.log('converDateSuccess: '+create_time)

		var time_ago = moment(timeago).fromNow();
		console.log('time_ago: '+time_ago)
		timeAgo = time_ago;
		// getFarmAccountForUpdateSpecies
		
		var history = "history"+countTxID + "-" + txid + "-" + getUsernameLogin + "-" + Job + "-" + create_time;
		countTxID++;
		console.log('countTxIDcountTxID:'+countTxID)

    	$http.get('/add_history_txid/'+history).success(function(output){
			callback(output)
		});
	}

	factory.addChain = function(getkey, getusername, getchainid, getrole, getstateapprove, callback){

		var convertEndDate = new Date(Date.now()).toString()
		
		var getValueEndDate = convertEndDate.valueOf();

		var EndDateArrat = getValueEndDate.split('/');

		var convertEndDate = new Date(EndDateArrat[2]);
		console.log('convertEndDate: '+convertEndDate)


		var endDate = getValueEndDate.search(",");

		var resultEndDate = getValueEndDate.slice(0, endDate);
		
		var newEndDate = new Date(resultEndDate)


		var monthNames = [
			"01", "02", "03",
			"04", "05", "06", "07",
			"08", "09", "10",
			"11", "12"
		];

		
		var minutes = newEndDate.getMinutes();
		var hours = newEndDate.getHours();
		var endday = newEndDate.getDate();
		var enddatemonthIndex = newEndDate.getMonth();
		var enddateyear = newEndDate.getFullYear();
		var second = newEndDate.getSeconds();

		if (endday < 10) {
			endday = "0" + endday;
			
		} else if (hours <10){
			hours = "0" + hours;
		} else if (minutes <10){
			minutes = "0" + minutes;
		} else if (second <10){
			second = "0" + second;
		}

		console.log('=============================================================farm add: '+getKeyLength)
		var convetPigID = getKeyLength.valueOf();
		
		var splitPigID = convetPigID.split('.');
		console.log('splitPigID: '+splitPigID)
		var c = convetPigID.search(",");
		var r = convetPigID.slice(0, c);
		console.log('r: '+r)
		var replace = convetPigID.replace(".","");
		console.log('replace: '+replace)
		// var ok = replace.valueOf()
		var x = replace.substring(15,19);
		console.log('x: '+x)
		var pigID = parseInt(x);
		console.log('pigID: '+pigID)
		pigID = pigID +1;


		var create_time = enddateyear +''+ monthNames[enddatemonthIndex]+''+ endday;
		console.log('createID: '+create_time)
		var hms =   hours +''+ minutes +''+ second;
		gethms=hms;
		///chú ý

		if ( pigID >0 && pigID < 10) {
			console.log('======================0<pigID1<10 : chain id cuối cùng====================================='+pigID)
			var a = angular.element('#chainIdUser').val();
		// 	console.log('======================a: ====================================='+a)
			var chain = (create_time +"."+hms+".000"+1)+ "-" + getusername + "-" + "null" + "-" + "null" + "-" + "null"+ "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null";


			console.log('======================pigID2 after add: ====================================='+pigID)
		} else if ( pigID > 9 && pigID < 100) {
			console.log('======================9<pigID1<100 : chain id cuối cùng====================================='+pigID)
			var chain = (create_time +"."+hms+".00"+countChain)+ "-" + getusername + "-" + "null" + "-" + "null" + "-" + "null"+ "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null";


		} else if ( pigID > 99 && pigID < 1000) {
			var chain = (create_time +"."+hms+".0"+countChain)+ "-" + getusername + "-" + "null" + "-" + "null" + "-" + "null"+ "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null";


		} else if ( pigID > 999 && pigID < 10000) {
			var chain = (create_time +"."+hms+"."+countChain)+ "-" + getusername + "-" + "null" + "-" + "null" + "-" + "null"+ "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null";


		} else if ( pigID > 9999) {
			pigID = pigID -9999;
			console.log('======================getidLocalStoragePigID1: ================>9999====================='+idLocalStorage)
			var convertEndDate = new Date(Date.now()).toString()
	
			var getValueEndDate = convertEndDate.valueOf();

			var EndDateArrat = getValueEndDate.split('/');

			var convertEndDate = new Date(EndDateArrat[2]);
			console.log('convertEndDate: '+convertEndDate)


			var endDate = getValueEndDate.search(",");

			var resultEndDate = getValueEndDate.slice(0, endDate);
			
			var newEndDate = new Date(resultEndDate)


			var monthNames = [
				"01", "02", "03",
				"04", "05", "06", "07",
				"08", "09", "10",
				"11", "12"
			];

			var minutes = newEndDate.getMinutes();
			var hours = newEndDate.getHours();
			var endday = newEndDate.getDate();
			var enddatemonthIndex = newEndDate.getMonth();
			var enddateyear = newEndDate.getFullYear();
			var secondEnd = newEndDate.getSeconds();

			if (endday < 10) {
				endday = "0" + endday;
				
			} else if (hours <10){
				hours = "0" + hours;
			} else if (minutes<10){
				minutes = "0" + minutes;
			} else if (secondEnd<10){
				secondEnd = "0" + secondEnd;
			}

			var createID = enddateyear +''+ monthNames[enddatemonthIndex]+''+endday;
			var hms = hours +''+minutes +''+ secondEnd;
			console.log('createID: '+createID)
			var chain = (createID +"."+hms+"."+countChain)+ "-" + getusernameapprove + "-" + "null" + "-" + "null" + "-" + "null"+ "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null";


		}


	


		//sửa ở đây
		
    	$http.get('/add_chain/'+chain).success(function(output){
			callback(output)
		});
	}

	factory.queryAllUser = function(callback){

    	$http.get('/get_all_user/').success(function(output){
			callback(output)
		});
	}

	factory.queryAllHistoryTxID = function(callback){

    	$http.get('/get_all_history_txid/').success(function(output){
			callback(output)
		});
	}

	factory.queryAllPig = function(callback){

    	$http.get('/get_all_pig/').success(function(output){
			callback(output)
		});
	}

	factory.queryAllPigWithAccountFarm = function(callback){

    	$http.get('/get_all_pig/').success(function(output){
			callback(output)
		});
	}

	factory.queryAllPigWithAccountTransport = function(callback){

    	$http.get('/get_all_pig/').success(function(output){
			callback(output)
		});
	}

	factory.queryAllPigWithAccountAbattoir = function(callback){

    	$http.get('/get_all_pig/').success(function(output){
			callback(output)
		});
	}

	factory.queryAllPigWithAccountSupermarket = function(callback){

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

	

	factory.recordFarm = function(data, callback){

		var pig = data.id + "-"+ data.farm_account + "-"  + data.famer + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_qualified + "-" + data.farm_location + "-" + data.start_date_of_farming + "-" + data.end_date_of_farming;

    	$http.get('/add_pig/'+pig).success(function(output){
			callback(output)
		});
	}

	factory.initChain = function(data, callback){

		var chain = data.id + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-"+ "null" + "-" + "null" + "-" + "null";


    	$http.get('/init_chain/'+chain).success(function(output){
			callback(output)
		});
	}

	factory.initChainFarmAdd = function(data, callback){
		console.log('======================idLocalStorage: ====================================='+idLocalStorage)
		var convertStartDate = new Date(data.start_date_of_farming).toLocaleString()
		var convertEndDate = new Date(Date.now()).toString()
		console.log('convertEndDate: '+convertStartDate)
		var hihii = convertStartDate.valueOf();
		var getValueEndDate = convertEndDate.valueOf();

		var dateArray = hihii.split('/');
		var EndDateArrat = getValueEndDate.split('/');

		var convertedDate = new Date(dateArray[0]+'-'+dateArray[1]+'-'+dateArray[2]);
		var convertEndDate = new Date(EndDateArrat[2]);

		console.log('convertedDate: '+convertedDate)

		var n = hihii.search(",");
		var endDate = getValueEndDate.search(",");

		var result = hihii.slice(0, n);
		var resultEndDate = getValueEndDate.slice(0, endDate);
		
		var newDate = new Date(result)
		var newEndDate = new Date(resultEndDate)

		


		var monthNames = [
			"01", "02", "03",
			"04", "05", "06", "07",
			"08", "09", "10",
			"11", "12"
		];

		var monthNamesStart = [
			"January", "February", "March",
			"April", "May", "June", "July",
			"August", "September", "October",
			"November", "December"
		];

		var minutes = newDate.getMinutes();
		var hours = newDate.getHours();
		var day = newDate.getDate();
		var monthIndex = newDate.getMonth();
		var year = newDate.getFullYear();


		var minutesEnd = newEndDate.getMinutes();
		var hoursEnd = newEndDate.getHours();
		var endday = newEndDate.getDate();
		var enddatemonthIndex = newEndDate.getMonth();
		var enddateyear = newEndDate.getFullYear();
		var secondEnd = newEndDate.getSeconds();

		if (day < 10) {
			day = "0" + day;
			
		} else if (hoursEnd <10){
			hoursEnd = "0" + hoursEnd;
		} else if (minutesEnd<10){
			minutesEnd = "0" + minutesEnd;
		} else if (secondEnd<10){
			secondEnd = "0" + secondEnd;
		}

		var converStartDateSuccess =  monthNamesStart[monthIndex]+ ' ' + day + ' ' + year;
		console.log('converDateSuccess: '+converStartDateSuccess)
		
		console.log('getAccountCurrent: '+getAccountCurrent)

		//lấy mã đàn người dùng input vào
		var getInputChainId = angular.element('#all_pig').val();
		var valueOf = getInputChainId.valueOf();
		var split = valueOf.split('.');
		console.log('split: '+split)
		var search = valueOf.search(",");
		console.log('search: '+search)
		var slice = valueOf.slice(0, search);
		console.log('slice: '+slice)
		var replaceNull = valueOf.replace(".","");
		var ymdhms = replaceNull.substring(0,14);
		var startDate = ymdhms;
		var yyyymmdd = replaceNull.substring(0,8);
		var hmsHash = replaceNull.substring(8,14);
		// console.log('--------------------getInputChainId============================================='+getInputChainId)
		var createID = year +''+monthNames[monthIndex] +''+ day; //thay = getInputChainId


		var hms = hoursEnd +''+minutesEnd +''+ secondEnd;
		console.log('createID: '+createID)
		console.log('hms: '+hms)

		
		// var getIdChain = angular.element('#chainIdUser').val();
		console.log('=============================================================farm add: '+getKeyLength)
		var convetPigID = getKeyLength.valueOf();
		
		var splitPigID = convetPigID.split('.');
		console.log('splitPigID: '+splitPigID)
		var c = convetPigID.search(",");
		var r = convetPigID.slice(0, c);
		console.log('r: '+r)
		var replace = convetPigID.replace(".","");
		console.log('replace: '+replace)
		// var ok = replace.valueOf()
		var x = replace.substring(15,19);
		console.log('x: '+x)
		var pigID = parseInt(x);
		console.log('pigID: '+pigID)
		pigID = pigID +1;

		var givehms = replace.substring(8,14);

		console.log('givehms: '+givehms)
		var getChainIdYyyyMmDd = angular.element('#chainIdUser').val();
		var valueOfgetChainIdYyyyMmDd = getChainIdYyyyMmDd.valueOf();
		var splitgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.split('.');
		console.log('splitgetChainIdYyyyMmDd: '+splitgetChainIdYyyyMmDd)
		var searchgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.search(",");
		console.log('searchgetChainIdYyyyMmDd: '+searchgetChainIdYyyyMmDd)
		var slicegetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.slice(0, searchgetChainIdYyyyMmDd);
		console.log('slicegetChainIdYyyyMmDd: '+slicegetChainIdYyyyMmDd)
		var replaceNullgetChainIdYyyyMmDd = valueOfgetChainIdYyyyMmDd.replace(".","");
		var ymdhmsgetChainIdYyyyMmDd = replaceNullgetChainIdYyyyMmDd.substring(0,14);
		var yyyymmddgetChainIdYyyyMmDd = replaceNullgetChainIdYyyyMmDd.substring(0,7);
		var hmsHashgetChainIdYyyyMmDd = replaceNullgetChainIdYyyyMmDd.substring(8,14);
		var hihi = parseInt(getChainIdYyyyMmDd) //YYYYMMDD
		
		var currentUser = angular.element('#currentUser').val();
		console.log('======================hihi: ====idLocalStorage================================='+hihi)

		
		var parseIntSendHmsHashgetDateIKey = parseInt(sendHmsHashgetDateIKey) +1

		// if( parseIntSendHmsHashgetDateIKey==10){
		// 	parseIntSendHmsHashgetDateIKey =parseIntSendHmsHashgetDateIKey+1
		// }
		console.log('======================hihi: ====parseIntSendHmsHashgetDateIKey================================='+parseIntSendHmsHashgetDateIKey)
		var lastPigID = parseInt(parseIntSendHmsHashgetDateIKey)
		console.log('======================sendHmsHashgetDateIKey: ====sendHmsHashgetDateIKey================================='+sendHmsHashgetDateIKey)
		if( getymdhmsgetDateIKey == startDate) {
			//YYYMMDD == ngày bắt đầu nuôi
			console.log('=========getymdhmsgetDateIKey========='+getymdhmsgetDateIKey+'====startDate: ====================================='+startDate)
			

			if ( lastPigID >0 && lastPigID < 10) {
				console.log('======================0<lastPigID<10 : chain id cuối cùng====================================='+lastPigID)
				var a = angular.element('#chainIdUser').val();
				console.log('======================a: ====================================='+a)
				// console.log('======================IDLon1: ====================================='+IDLon)
				var chain = (yyyymmdd +"."+hmsHash+".000"+(parseIntSendHmsHashgetDateIKey)) + "-" + currentUser + "-" + getFamerAddChain + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_qualified + "-" + data.farm_location + "-" + converStartDateSuccess + "-" + "null" + "-" + getTransportAccountFarmAddChain + "-" + getCompanyFarmAddChain + "-" + getTransporterFarmAddChain + "-" + getVehicleFarmAddChain + "-" + getTransportTroubleSolutionFarmAddChain + "-" + getTransport_qualifiedFarmAddChain + "-" + getTimeFarmAddChain + "-" + getAbattoirAccountFarmAddChain + "-" + getAbattoirNameFarmAddChain + "-" + getAbattoirTroubleSolutionFarmAddChain + "-" + getAbattoirLocatioFarmAddChain + "-" + getAbattoirQualifiedFarmAddChain + "-" + getPeckTimeFarmAddChain + "-" + getSupermarketAccountFarmAddChain + "-" + getSupermarketNameFarmAddChain + "-" + getSupermarketTroubleSolutionFarmAddChain + "-" + getSupermarketQualifiedFarmAddChain + "-" + getPriceFarmAddChain + "-" + getQuantityRemainingFarmAddChain + "-" + getManufacturingDateFarmAddChain + "-" + getExpiryDateFarmAddChain;

				console.log('======================piglastPigIDID2 after add: ====================================='+lastPigID)
				// console.log('======================IDLon2: ====================================='+IDLon)
			} else if ( lastPigID > 9 && lastPigID < 100) {
				console.log('======================9<lastPigID<100 : chain id cuối cùng====================================='+lastPigID)
				var chain = (yyyymmdd +"."+hmsHash+".00"+(parseIntSendHmsHashgetDateIKey)) + "-" + currentUser + "-" + getFamerAddChain + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_qualified + "-" + data.farm_location + "-" + converStartDateSuccess + "-" + "null" + "-" + getTransportAccountFarmAddChain + "-" + getCompanyFarmAddChain + "-" + getTransporterFarmAddChain + "-" + getVehicleFarmAddChain + "-" + getTransportTroubleSolutionFarmAddChain + "-" + getTransport_qualifiedFarmAddChain + "-" + getTimeFarmAddChain + "-" + getAbattoirAccountFarmAddChain + "-" + getAbattoirNameFarmAddChain + "-" + getAbattoirTroubleSolutionFarmAddChain + "-" + getAbattoirLocatioFarmAddChain + "-" + getAbattoirQualifiedFarmAddChain + "-" + getPeckTimeFarmAddChain + "-" + getSupermarketAccountFarmAddChain + "-" + getSupermarketNameFarmAddChain + "-" + getSupermarketTroubleSolutionFarmAddChain + "-" + getSupermarketQualifiedFarmAddChain + "-" + getPriceFarmAddChain + "-" + getQuantityRemainingFarmAddChain + "-" + getManufacturingDateFarmAddChain + "-" + getExpiryDateFarmAddChain;
				// IDLon = IDLon + 1;
			} else if ( lastPigID > 99 && lastPigID < 1000) {
				var chain = (yyyymmdd +"."+hmsHash+".0"+(parseIntSendHmsHashgetDateIKey)) + "-" + currentUser + "-" + getFamerAddChain + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_qualified + "-" + data.farm_location + "-" + converStartDateSuccess + "-" + "null" + "-" + getTransportAccountFarmAddChain + "-" + getCompanyFarmAddChain + "-" + getTransporterFarmAddChain + "-" + getVehicleFarmAddChain + "-" + getTransportTroubleSolutionFarmAddChain + "-" + getTransport_qualifiedFarmAddChain + "-" + getTimeFarmAddChain + "-" + getAbattoirAccountFarmAddChain + "-" + getAbattoirNameFarmAddChain + "-" + getAbattoirTroubleSolutionFarmAddChain + "-" + getAbattoirLocatioFarmAddChain + "-" + getAbattoirQualifiedFarmAddChain + "-" + getPeckTimeFarmAddChain + "-" + getSupermarketAccountFarmAddChain + "-" + getSupermarketNameFarmAddChain + "-" + getSupermarketTroubleSolutionFarmAddChain + "-" + getSupermarketQualifiedFarmAddChain + "-" + getPriceFarmAddChain + "-" + getQuantityRemainingFarmAddChain + "-" + getManufacturingDateFarmAddChain + "-" + getExpiryDateFarmAddChain;
				// IDLon = IDLon + 1;
			} else if ( lastPigID > 999 && lastPigID < 10000) {
				

				var chain = (yyyymmdd +"."+hmsHash+"."+(parseIntSendHmsHashgetDateIKey)) + "-" + currentUser + "-" + getFamerAddChain + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_qualified + "-" + data.farm_location + "-" + converStartDateSuccess + "-" + "null" + "-" + getTransportAccountFarmAddChain + "-" + getCompanyFarmAddChain + "-" + getTransporterFarmAddChain + "-" + getVehicleFarmAddChain + "-" + getTransportTroubleSolutionFarmAddChain + "-" + getTransport_qualifiedFarmAddChain + "-" + getTimeFarmAddChain + "-" + getAbattoirAccountFarmAddChain + "-" + getAbattoirNameFarmAddChain + "-" + getAbattoirTroubleSolutionFarmAddChain + "-" + getAbattoirLocatioFarmAddChain + "-" + getAbattoirQualifiedFarmAddChain + "-" + getPeckTimeFarmAddChain + "-" + getSupermarketAccountFarmAddChain + "-" + getSupermarketNameFarmAddChain + "-" + getSupermarketTroubleSolutionFarmAddChain + "-" + getSupermarketQualifiedFarmAddChain + "-" + getPriceFarmAddChain + "-" + getQuantityRemainingFarmAddChain + "-" + getManufacturingDateFarmAddChain + "-" + getExpiryDateFarmAddChain;
				// IDLon = IDLon + 1;
			} else if ( lastPigID > 9999) {
				lastPigID = lastPigID -9999;
				console.log('======================getidLocalStoragePigID1: ================>9999====================='+idLocalStorage)
				var convertEndDate = new Date(Date.now()).toString()
		
				var getValueEndDate = convertEndDate.valueOf();

				var EndDateArrat = getValueEndDate.split('/');

				var convertEndDate = new Date(EndDateArrat[2]);
				console.log('convertEndDate: '+convertEndDate)


				var endDate = getValueEndDate.search(",");

				var resultEndDate = getValueEndDate.slice(0, endDate);
				
				var newEndDate = new Date(resultEndDate)


				var monthNames = [
					"01", "02", "03",
					"04", "05", "06", "07",
					"08", "09", "10",
					"11", "12"
				];

				var minutes = newEndDate.getMinutes();
				var hours = newEndDate.getHours();
				var endday = newEndDate.getDate();
				var enddatemonthIndex = newEndDate.getMonth();
				var enddateyear = newEndDate.getFullYear();
				var secondEnd = newEndDate.getSeconds();

				if (endday < 10) {
					endday = "0" + endday;
					
				} else if (hours <10){
					hours = "0" + hours;
				} else if (minutes<10){
					minutes = "0" + minutes;
				} else if (secondEnd<10){
					secondEnd = "0" + secondEnd;
				}

				var createID = enddateyear +''+ monthNames[enddatemonthIndex]+''+endday;
				var hms = hours +''+minutes +''+ secondEnd;
				console.log('createID: '+createID)

				var currentUser = angular.element('#currentUser').val();

				var chain = (createID +"."+hms+".000"+pigID) + "-" + currentUser + "-" + getFamerAddChain + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_qualified + "-" + data.farm_location + "-" + converStartDateSuccess + "-" + "null" + "-" + getTransportAccountFarmAddChain + "-" + getCompanyFarmAddChain + "-" + getTransporterFarmAddChain + "-" + getVehicleFarmAddChain + "-" + getTransportTroubleSolutionFarmAddChain + "-" + getTransport_qualifiedFarmAddChain + "-" + getTimeFarmAddChain + "-" + getAbattoirAccountFarmAddChain + "-" + getAbattoirNameFarmAddChain + "-" + getAbattoirTroubleSolutionFarmAddChain + "-" + getAbattoirLocatioFarmAddChain + "-" + getAbattoirQualifiedFarmAddChain + "-" + getPeckTimeFarmAddChain + "-" + getSupermarketAccountFarmAddChain + "-" + getSupermarketNameFarmAddChain + "-" + getSupermarketTroubleSolutionFarmAddChain + "-" + getSupermarketQualifiedFarmAddChain + "-" + getPriceFarmAddChain + "-" + getQuantityRemainingFarmAddChain + "-" + getManufacturingDateFarmAddChain + "-" + getExpiryDateFarmAddChain;

			}


		} else if ( getymdhmsgetDateIKey != startDate) {

				console.log('======================hihi(idLocalStorage) : ============!========================='+hihi )
				lastPigID = 1;

				var convertEndDate = new Date(data.start_date_of_farming).toLocaleString()
				var dn = new Date(Date.now()).toString()
		
				var getValueEndDate = convertEndDate.valueOf();
				var valedn = dn.valueOf();

				var EndDateArrat = getValueEndDate.split('/');
				var dnArrat = valedn.split('/');

				var convertEndDate = new Date(EndDateArrat[2]);
				console.log('convertEndDate: '+convertEndDate)
				var newdn = new Date(dnArrat[2]);


				var endDate = getValueEndDate.search(",");
				var dndn = valedn.search(",");

				var resultEndDate = getValueEndDate.slice(0, endDate);
				var resultdn = valedn.slice(0, dndn);
				
				var newEndDate = new Date(resultEndDate)
				var newsdn= new Date(resultdn)


				var monthNames = [
					"01", "02", "03",
					"04", "05", "06", "07",
					"08", "09", "10",
					"11", "12"
				];

				var minutes = newEndDate.getMinutes();
				var hours = newEndDate.getHours();
				var endday = newEndDate.getDate();
				var enddatemonthIndex = newEndDate.getMonth();
				var enddateyear = newEndDate.getFullYear();
				var secondEnd = newEndDate.getSeconds();

				var minutesdn = newsdn.getMinutes();
				var hoursdn = newsdn.getHours();
				var enddaydn = newsdn.getDate();
				var enddatemonthIndexdn = newsdn.getMonth();
				var enddateyeardn = newsdn.getFullYear();
				var secondEnddn = newsdn.getSeconds();



				if (enddaydn < 10) {
					enddaydn = "0" + enddaydn;
					
				} else if (hoursdn <10){
					hoursdn = "0" + hoursdn;
				} else if (minutesdn<10){
					minutesdn = "0" + minutesdn;
				} else if (secondEnddn<10){
					secondEnddn = "0" + secondEnddn;
				}

				var hms = hoursdn +''+minutesdn +''+ secondEnddn;

				var createID = enddateyeardn +''+ monthNames[enddatemonthIndexdn] +'' +enddaydn;

				var currentUser = angular.element('#currentUser').val();
				console.log('createID: '+createID)
				var chain = (createID +"."+hms+".000"+lastPigID) + "-" + currentUser + "-" + getFamerAddChain + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_qualified + "-" + data.farm_location + "-" + converStartDateSuccess + "-" + "null" + "-" + getTransportAccountFarmAddChain + "-" + getCompanyFarmAddChain + "-" + getTransporterFarmAddChain + "-" + getVehicleFarmAddChain + "-" + getTransportTroubleSolutionFarmAddChain + "-" + getTransport_qualifiedFarmAddChain + "-" + getTimeFarmAddChain + "-" + getAbattoirAccountFarmAddChain + "-" + getAbattoirNameFarmAddChain + "-" + getAbattoirTroubleSolutionFarmAddChain + "-" + getAbattoirLocatioFarmAddChain + "-" + getAbattoirQualifiedFarmAddChain + "-" + getPeckTimeFarmAddChain + "-" + getSupermarketAccountFarmAddChain + "-" + getSupermarketNameFarmAddChain + "-" + getSupermarketTroubleSolutionFarmAddChain + "-" + getSupermarketQualifiedFarmAddChain + "-" + getPriceFarmAddChain + "-" + getQuantityRemainingFarmAddChain + "-" + getManufacturingDateFarmAddChain + "-" + getExpiryDateFarmAddChain;
				
		}
		
		console.log('countchain: '+countChain)
    	$http.get('/init_chain_farm_add/'+chain).success(function(output){
			callback(output)
		});
	}

	factory.initChainTransportAdd = function(data, callback){


		var chain = countChain + "-" + getFarmAccountAddChain + "-" + getFamerAddChain + "-" + getSpeciesAddChain + "-" + getFoodAddChain + "-" + getSickCureAddChain + "-" + getFarmQualifiedAccountAddChain + "-" + getFarmLocationAddChain + "-" + getStartDateAddChain + "-" + getEndDateAddChain + "-" + data.transport_account + "-" + data.company + "-" + data.transporter + "-" + data.vehicle + "-" + data.trouble + "-" + data.solution + "-" + data.transport_qualified + "-" + data.time + "-" + getAbattoirAccountFarmAddChain + "-" + getAbattoirNameFarmAddChain + "-" + getAbattoirLocatioFarmAddChain + "-" + getAbattoirQualifiedFarmAddChain + "-" + getPeckTimeFarmAddChain + "-" + getSupermarketAccountFarmAddChain + "-" + getSupermarketNameFarmAddChain + "-" + getSupermarketQualifiedFarmAddChain + "-" + getPriceFarmAddChain + "-" + getQuantityRemainingFarmAddChain + "-" + getManufacturingDateFarmAddChain + "-" + getExpiryDateFarmAddChain;
		console.log('countchain: '+countChain)
    	$http.get('/init_chain_transport_add/'+chain).success(function(output){
			callback(output)
		});
	}

	factory.initChainWithFarm = function(data, callback){

		var chain = data.id + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null" + "-" + "null";

    	$http.get('/init_chain/'+chain).success(function(output){
			callback(output)
		});
	}

	

	factory.recordTransport = function(data, callback){

		var pig = data.id + "-" + data.transport_account + "-" + data.company + "-" + data.transporter + "-" + data.vehicle + "-" + data.trouble + "-" + data.solution + "-" + data.transport_qualified + "-" + data.time;

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
		
		var farm = idLocalStorage + "-" + "null" + "-" + data.farm_account + "-" + data.famer + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_location + "-" + data.start_date_of_farming + "-" + data.end_date_of_farming;

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

		var transport = idLocalStorage + "-" + data.transport_account + "-" + data.company + "-" + data.transporter + "-" + data.vehicle + "-" + data.trouble + "-" + data.solution + "-" + data.transport_qualified + "-" + data.time;

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

		var abattoir = idLocalStorage + "-" + data.abattoir_account + "-" + data.abattoir_name + "-" + data.abattoir_location + "-" + data.abattoir_qualified + "-" + data.peck_time;

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

		var supermarket = idLocalStorage + "-" + data.supermarket_account + "-" + data.supermarket_name + "-" + data.supermarket_qualified + "-" + data.price + "-" + data.quantity_remaining + "-" + data.manufacturing_date + "-" + data.expiry_date;

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


//profle user
app.directive("ngFileSelect", function(fileReader, $timeout) {
    return {
		scope: {
			ngModel: '='
		},
		link: function($scope, el) {
			function getFile(file) {
			fileReader.readAsDataUrl(file, $scope)
				.then(function(result) {
				$timeout(function() {
					$scope.ngModel = result;
				});
				});
			}

			el.bind("change", function(e) {
			var file = (e.srcElement || e.target).files[0];
			getFile(file);
			});
		}
    };
});

app.factory("fileReader", function($q, $log) {
	var onLoad = function(reader, deferred, scope) {
		return function() {
		scope.$apply(function() {
			deferred.resolve(reader.result);
		});
		};
	};

	var onError = function(reader, deferred, scope) {
		return function() {
		scope.$apply(function() {
			deferred.reject(reader.result);
		});
		};
	};

	var onProgress = function(reader, scope) {
		return function(event) {
		scope.$broadcast("fileProgress", {
			total: event.total,
			loaded: event.loaded
		});
		};
	};

	var getReader = function(deferred, scope) {
		var reader = new FileReader();
		reader.onload = onLoad(reader, deferred, scope);
		reader.onerror = onError(reader, deferred, scope);
		reader.onprogress = onProgress(reader, scope);
		return reader;
	};

	var readAsDataURL = function(file, scope) {
		var deferred = $q.defer();

		var reader = getReader(deferred, scope);
		reader.readAsDataURL(file);

		return deferred.promise;
	};

	return {
		readAsDataUrl: readAsDataURL
	};
});



//uploadImg
function upload($scope) {

	const reader = new FileReader();
	reader.onloadend = function() {


		const photo = document.getElementById("photo");
		const fileType = photo.files[0].type;

		const prefix = `data:${fileType};base64,`;
		const buf = buffer.Buffer(reader.result);
		const base64buf = prefix + base64ArrayBuffer(buf);
		// Convert data into buffer
		ipfs.add(base64buf, (err, result) => { // Upload buffer to IPFS
		if (err) {
			console.error(err)
			return
		}
		
		let url = `https://ipfs.io/ipfs/${result}`
		let hashImg= `${result}`

		let hashBtn = document.getElementById("hash");
		hashBtn.innerHTML = url;
		hashBtn.href= url;
		hashBtn.value= url;

		let getHashImg = document.getElementById("hashImg");
		getHashImg.innerHTML = hashImg;
		getHashImg.value= hashImg;
		console.log(`Url --> ${url}`)

			$('#blah').attr('href', url);
			$('#blah2').attr('href', url);
			

		setTimeout(function(){ 
			download();
			$("#success_upload").show();
			angular.element('#clickAddImg').triggerHandler('click');

		}, 2000);
		

		})
	}
	const photo = document.getElementById("photo");
	reader.readAsArrayBuffer(photo.files[0]); // Read Provided File
}

  //loadImg
function download() {
	let hashBtn = document.getElementById("hash") || this;
	// let url = hashBtn.innerHTML;
	let url = hashBtn.value;
	if (!url) return;


	const req = new XMLHttpRequest();
	req.responseType = "text";

	req.onload = function(e) {
		var img = new Image();
		img.onload = function onload() {
		// document.body.appendChild(img);
		$('#blah').attr('src', img.src);
	$('#blah2').attr('src', img.src);
		};
		
	img.src = this.response;


	}

	req.open('GET', url, true);
	req.send();
}




var sendHmsHashgetDateIKey;

var getKeyLength

var IDLon = 3;
var IDHeo;
var getPigID;


var getymdhmsgetDateIKey;


var getAccountCurrent;
var timeAgo;
var countTxID;

var getUsernameLogin;
var countUser;
var countChain;
var idLocalStorage;
var idUserLocalStorage;

var getUsernameWhenUpdateChainid
var getChainidWhenUpdateChainid

var getkeyapprove;
var getusernameapprove;
var getchainidapprove;
var getroleapprove;
var getstateapproveapprove;
var getKeyEditChainID;
var getKeyEditRole;
var getKeyEditStatus;

var getFood;

var getFarmQualifiedAccountAddChain
var getFarmAccountAddChain
var getFamerAddChain
var getSpeciesAddChain
var getFoodAddChain
var getSickCureAddChain
var getFarmLocationAddChain
var getStartDateAddChain
var getEndDateAddChain



var getTransportAccountFarmAddChain 
var getCompanyFarmAddChain;
var getTransporterFarmAddChain;
var getVehicleFarmAddChain;
var getTransportTroubleSolutionFarmAddChain
var getTransport_qualifiedFarmAddChain; 
var getTimeFarmAddChain;

var getAbattoirAccountFarmAddChain 
var getAbattoirNameFarmAddChain;
var getAbattoirTroubleSolutionFarmAddChain
var getAbattoirLocatioFarmAddChain;
var getAbattoirQualifiedFarmAddChain;
var getPeckTimeFarmAddChain;

var getSupermarketAccountFarmAddChain
var getSupermarketNameFarmAddChain;
var getSupermarketTroubleSolutionFarmAddChain
var getSupermarketQualifiedFarmAddChain;
var getPriceFarmAddChain;
var getQuantityRemainingFarmAddChain;
var getManufacturingDateFarmAddChain;
var getExpiryDateFarmAddChain;


var getKeyUpdateFamer;
var getKeyUpdateSpecies;
var getKeyUpdateFood;
var getKeyUpdateSickCure;
var getKeyUpdateLocation;
var getKeyUpdateStartDate;
var getKeyUpdateEndDate;

var getKeyUpdateCompany;
var getKeyUpdateTransporter;
var getKeyUpdateVehicle;
var getKeyUpdateTrouble;
var getKeyUpdateSolution;
var getKeyUpdateTransportQualified;
var getKeyUpdateTime;

var getRoleWhenUpdateChainid;

var getKeyForUpdateChainId;
var getKeyForUpdateRoles;
var getKeyForUpdateStatus;

var getKeyForUpdateFamer
var getKeyForUpdateSpecies
var getFarmAccountForUpdateSpecies
var getKeyForUpdateFood
var getFoodForUpdateFood
var getKeyForUpdateSickCure
var getSickCureForUpdateSickCure
var getKeyForUpdateFarmQualified
var getKeyForUpdateLocation
var getKeyForUpdateStartDate
var getKeyForUpdateEndDate

var getKeyForUpdateCompany
var getKeyForUpdateTransporter
var getKeyForUpdateVehicle
var getKeyForUpdateTransportTroubleSolution
var getKeyForUpdateTransportQualified
var getKeyForUpdateTime

var getKeyForUpdateAbattoirName
var getKeyForUpdateAbattoirTroubleSolution
var getKeyForUpdateAbattoirLocation
var getKeyForUpdateAbattoirQualified
var getKeyForUpdatePeckTime

var getKeyForUpdateSupermarketName
var getKeyForUpdateSupermarketTroubleSolution
var getKeyForUpdateSupermarketQualified
var getKeyForUpdatePrice
var getKeyForUpdateQuantityRemaining
var getKeyForUpdateMFG
var getKeyForUpdateEXP

var getKeyForUpdateWhenUpdatePassword
var getKeyForUpdateWhenUpdateEmail
 

