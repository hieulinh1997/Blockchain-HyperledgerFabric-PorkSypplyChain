// SPDX-License-Identifier: Apache-2.0

'use strict';

var app = angular.module('application', []);
// (function () {
//     var app = angular.module('application', []);

//     app.controller('appController', function () {
//         this.tab = 1;

//         this.setTab = function (tabId) {
//             this.tab = tabId;
//         };

//         this.isSet = function (tabId) {
//             return this.tab === tabId;
//         };
//     });
// })();
// Angular Controller
(function () {
app.controller('appController', function($scope, appFactory){
	// start tab
	this.tab = 1;

        this.setTab = function (tabId) {
            this.tab = tabId;
        };

        this.isSet = function (tabId) {
            return this.tab === tabId;
		};
	//end tap
	$("#success_holder").hide();
	$("#success_create").hide();
	$("#error_holder").hide();
	$("#error_query").hide();
	
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

		appFactory.queryPig(id, function(data){
			$scope.query_pig = data;

			if ($scope.query_pig == "Could not locate pig"){
				console.log()
				$("#error_query").show();
			} else{
				$("#error_query").hide();
			}
		});
	}

	$scope.chainDelete = function(){

		var id = $scope.delete_id;

		appFactory.chainDelete(id, function(data){
			$scope.delete_pig = data;

			if ($scope.delete_pig == "Could not locate pig"){
				console.log()
				$("#error_query").show();
			} else{
				$("#error_query").hide();
			}
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

	// fghg
	$scope.registerUser = function(){

		var username = $scope.username;

		appFactory.registerUser(username, function(data){
			// $scope.query_tuna = data;

			// if ($scope.query_tuna == "Could not locate tuna"){
			// 	console.log()
			// 	$("#error_query").show();
			// } else{
			// 	$("#error_query").hide();
			// }
		});
	}

	
	$scope.recordFarm = function(){

		appFactory.recordFarm($scope.pig, function(data){
			$scope.create_tuna = data;
			$("#success_create").show();
		});
	}

	$scope.recordTransport = function(){

		appFactory.recordTransport($scope.pig, function(data){
			$scope.create_transport = data;
			$("#success_create").show();
		});
	}

	$scope.insertTransport = function(){

		appFactory.insertTransport($scope.transport, function(data){
			$scope.insert_transport = data;
			if ($scope.insert_transport == "Error: no transport found"){
				$("#error_holder").show();
				$("#success_holder").hide();
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

});
})();

// Angular Factory
app.factory('appFactory', function($http){

	var factory = {};

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

	// vbnbv
	factory.registerUser = function(username, callback){
    	$http.get('/sign_up/'+username).success(function(output){
			callback(output)
		});
	}

	factory.chainDelete = function(id, callback){
    	$http.get('/chain_delete/'+id).success(function(output){
			callback(output)
		});
	}

	factory.queryAllTuna = function(callback){

    	$http.get('/get_all_tuna/').success(function(output){
			callback(output)
		});
	}

	factory.queryTuna = function(id, callback){
    	$http.get('/get_tuna/'+id).success(function(output){
			callback(output)
		});
	}

	factory.recordFarm = function(data, callback){

		var pig = data.id + "-" + data.qrcode + "-" + data.famer + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_location + "-" + data.start_date_of_farming + "-" + data.end_date_of_farming;

    	$http.get('/add_pig/'+pig).success(function(output){
			callback(output)
		});
	}

	factory.insertTransport = function(data, callback){

		var transport = data.id + "-" + data.company + "-" + data.transporter + "-" + data.vehicle + "-" + data.trouble + "-" + data.solution + "-" + data.transport_qualified + "-" + data.time;

    	$http.get('/insert_transport/'+transport).success(function(output){
			callback(output)
		});
	}

	factory.insertAbattoir = function(data, callback){

		var abattoir = data.id + "-" + data.abattoir_name + "-" + data.abattoir_location + "-" + data.abattoir_qualified + "-" + data.peck_time;

    	$http.get('/insert_abattoir/'+abattoir).success(function(output){
			callback(output)
		});
	}

	factory.insertSupermarket = function(data, callback){

		var supermarket = data.id + "-" + data.supermarket_name + "-" + data.supermarket_qualified + "-" + data.price + "-" + data.quantity_remaining + "-" + data.manufacturing_date + "-" + data.expiry_date;

    	$http.get('/insert_supermarket/'+supermarket).success(function(output){
			callback(output)
		});
	}

	// factory.queryTunaHistory = function (id, callback) {
	// 	$http.get('/get_tuna_history/' + id).success(function (output) {
	// 		callback(output)
	// 	});
	// }

	factory.recordTransport = function(data, callback){

		var pig = data.id + "-" + data.company + "-" + data.transporter + "-" + data.vehicle + "-" + data.trouble + "-" + data.solution + "-" + data.transport_qualified + "-" + data.time;

    	$http.get('/add_transport/'+pig).success(function(output){
			callback(output)
		});
	}

	

	factory.insertFarm = function(data, callback){

		var farm = data.id + "-" + data.qrcode + "-" + data.famer + "-" + data.species + "-" + data.food + "-" + data.sick_cure + "-" + data.farm_location + "-" + data.start_date_of_farming + "-" + data.end_date_of_farming;

    	$http.get('/insert_farm/'+farm).success(function(output){
			callback(output)
		});
	}
	
	// factory.changeHolder = function(data, callback){

	// 	var holder = data.id + "-" + data.name;

    // 	$http.get('/change_holder/'+holder).success(function(output){
	// 		callback(output)
	// 	});
	// }

	return factory;
});



