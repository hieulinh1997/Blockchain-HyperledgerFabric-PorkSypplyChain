//SPDX-License-Identifier: Apache-2.0

/*
  This code is based on code written by the Hyperledger Fabric community.
  Original code can be found here: https://github.com/hyperledger/fabric-samples/blob/release/fabcar/query.js
  and https://github.com/hyperledger/fabric-samples/blob/release/fabcar/invoke.js
 */

// call the packages we need
var express       = require('express');        // call express
var app           = express();                 // define our app using express
var bodyParser    = require('body-parser');
var http          = require('http')
var fs            = require('fs');
var Fabric_Client = require('fabric-client');
var path          = require('path');
var util          = require('util');
var os            = require('os');
var url 		  = require('url');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs'); //enkripcija passworda

var log4js = require('log4js');
var logger = log4js.getLogger('Helper');
logger.level = 'debug';

module.exports = (function() {
return{
	update_supermarket_account: function(req, res){
		console.log("=========================================controller -> update update_supermarket_account: =========================================");
		
		var array = req.params.supermarket.split("-");
		console.log(array);
		var key = array[0];
		var supermarket_account = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);
		    // changeTunaHolder - requires 2 args , ex: args: ['1', 'Barry'],
		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateSupermarketAccount',
		        args: [key, supermarket_account],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no farm found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no farm found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no farm found");
		});

	},
	update_abattoir_account: function(req, res){
		console.log("=========================================controller -> update update_abattoir_account: =========================================");
		
		var array = req.params.abattoir.split("-");
		console.log(array);
		var key = array[0];
		var abattoir_account = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);
		    // changeTunaHolder - requires 2 args , ex: args: ['1', 'Barry'],
		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateAbattoirAccount',
		        args: [key, abattoir_account],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no farm found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no farm found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no farm found");
		});

	},
	update_transport_account: function(req, res){
		console.log("=========================================controller -> update_transport_accountsick_cure: =========================================");
		
		var array = req.params.transport.split("-");
		console.log(array);
		var key = array[0];
		var transport_account = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);
		    // changeTunaHolder - requires 2 args , ex: args: ['1', 'Barry'],
		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateTransportAccount',
		        args: [key, transport_account],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no farm found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no farm found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no farm found");
		});

	},
	update_sick_cure: function(req, res){
		console.log("=========================================controller -> update sick_cure: =========================================");
		
		var array = req.params.farm.split("-");
		console.log(array);
		var key = array[0];
		var sick_cure = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);
		    // changeTunaHolder - requires 2 args , ex: args: ['1', 'Barry'],
		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateSickCure',
		        args: [key, sick_cure],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no farm found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no farm found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no farm found");
		});

	},
	//update farm info
	update_farm_account: function(req, res){
		console.log("========================================= controller -> update update_farm_account: =========================================");
		
		var array = req.params.farm.split("-");
		console.log(array);
		var key = array[0];
		var farm_account = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateFarmAccount',
		        args: [key, farm_account],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_farm_qualified: function(req, res){
		console.log("========================================= controller -> update update_farm_qualified: =========================================");
		
		var array = req.params.farm.split("-");
		console.log(array);
		var key = array[0];
		var farm_qualified = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateFarmQualified',
		        args: [key, farm_qualified],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_famer: function(req, res){
		console.log("========================================= controller -> update famer: =========================================");
		
		var array = req.params.farm.split("-");
		console.log(array);
		var key = array[0];
		var famer = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateFamer',
		        args: [key, famer],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_species: function(req, res){
		console.log("=========================================controller -> update update_species: =========================================");
		
		var array = req.params.farm.split("-");
		console.log(array);
		var key = array[0];
		var species = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateSpecies',
		        args: [key, species],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_food: function(req, res){
		console.log("=========================================controller -> update update_food: =========================================");
		
		var array = req.params.farm.split("-");
		console.log(array);
		var key = array[0];
		var food = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateFood',
		        args: [key, food],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_location: function(req, res){
		console.log("=========================================controller -> update update_location: =========================================");
		
		var array = req.params.farm.split("-");
		console.log(array);
		var key = array[0];
		var location = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateLocation',
		        args: [key, location],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_start_date: function(req, res){
		console.log("=========================================controller -> update update_start_date: =========================================");
		
		var array = req.params.farm.split("-");
		console.log(array);
		var key = array[0];
		var start_date_of_farming = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateStartDate',
		        args: [key, start_date_of_farming],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_end_date: function(req, res){
		console.log("=========================================controller -> update update_end_date: ======================================");
		
		var array = req.params.farm.split("-");
		console.log(array);
		var key = array[0];
		var end_date_of_farming = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateEndDate',
		        args: [key, end_date_of_farming],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	//update info transport
	update_company: function(req, res){
		console.log("=========================================controller -> update update_company: ======================================");
		
		var array = req.params.transport.split("-");
		console.log(array);
		var key = array[0];
		var company = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateCompany',
		        args: [key, company],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_transporter: function(req, res){
		console.log("=========================================controller -> update update_transporter: ======================================");
		
		var array = req.params.transport.split("-");
		console.log(array);
		var key = array[0];
		var transporter = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateTransporter',
		        args: [key, transporter],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_vehicle: function(req, res){
		console.log("=========================================controller -> update update_vehicle: ======================================");
		
		var array = req.params.transport.split("-");
		console.log(array);
		var key = array[0];
		var vehicle = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateVehicle',
		        args: [key, vehicle],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_trouble: function(req, res){
		console.log("=========================================controller -> update update_trouble: ======================================");
		
		var array = req.params.transport.split("-");
		console.log(array);
		var key = array[0];
		var trouble = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateTransportTroubleSolution',
		        args: [key, trouble],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_solution: function(req, res){
		console.log("=========================================controller -> update solution: ======================================");
		
		var array = req.params.transport.split("-");
		console.log(array);
		var key = array[0];
		var solution = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateSolution',
		        args: [key, solution],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_transport_qualified: function(req, res){
		console.log("=========================================controller -> update update_transport_qualified: ======================================");
		
		var array = req.params.transport.split("-");
		console.log(array);
		var key = array[0];
		var transport_qualified = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateTransportQualified',
		        args: [key, transport_qualified],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_time: function(req, res){
		console.log("=========================================controller -> update update_time: ======================================");
		
		var array = req.params.transport.split("-");
		console.log(array);
		var key = array[0];
		var time = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateTime',
		        args: [key, time],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},

	//update abattoir info
	update_abattoir_name: function(req, res){
		console.log("=========================================controller -> update update_abattoir_name: ======================================");
		
		var array = req.params.abattoir.split("-");
		console.log(array);
		var key = array[0];
		var abattoir_name = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateAbattoirName',
		        args: [key, abattoir_name],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_abattoir_location: function(req, res){
		console.log("=========================================controller -> update update_abattoir_location: ======================================");
		
		var array = req.params.abattoir.split("-");
		console.log(array);
		var key = array[0];
		var abattoir_location = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateAbattoirLocation',
		        args: [key, abattoir_location],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_abattoir_qualified: function(req, res){
		console.log("=========================================controller -> update update_abattoir_qualified: ======================================");
		
		var array = req.params.abattoir.split("-");
		console.log(array);
		var key = array[0];
		var abattoir_qualified = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateAbattoirQualified',
		        args: [key, abattoir_qualified],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_abattoir_trouble_solution: function(req, res){
		console.log("=========================================controller -> update update_abattoir_trouble_solution: ======================================");
		
		var array = req.params.abattoir.split("-");
		console.log(array);
		var key = array[0];
		var update_abattoir_trouble_solution = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateAbattoirTroubleSolution',
		        args: [key, update_abattoir_trouble_solution],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_abattoir_peck_time: function(req, res){
		console.log("=========================================controller -> update update_peck_time: ======================================");
		
		var array = req.params.abattoir.split("-");
		console.log(array);
		var key = array[0];
		var peck_time = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updatePeckTime',
		        args: [key, peck_time],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},


	//update supermarket info
	update_supermarket_name: function(req, res){
		console.log("=========================================controller -> update update_supermarket_name: ======================================");
		
		var array = req.params.supermarket.split("-");
		console.log(array);
		var key = array[0];
		var supermarket_name = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateSupermarketName',
		        args: [key, supermarket_name],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_supermarket_qualified: function(req, res){
		console.log("=========================================controller -> update supermarket_qualified: ======================================");
		
		var array = req.params.supermarket.split("-");
		console.log(array);
		var key = array[0];
		var supermarket_qualified = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateSupermarketQualified',
		        args: [key, supermarket_qualified],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_supermarket_trouble_solution: function(req, res){
		console.log("=========================================controller -> update update_supermarket_trouble_solution: ======================================");
		
		var array = req.params.supermarket.split("-");
		console.log(array);
		var key = array[0];
		var update_supermarket_trouble_solution = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateSupermarketTroubleSolution',
		        args: [key, update_supermarket_trouble_solution],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_supermarket_price: function(req, res){
		console.log("=========================================controller -> update update_price: ======================================");
		
		var array = req.params.supermarket.split("-");
		console.log(array);
		var key = array[0];
		var price = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updatePrice',
		        args: [key, price],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_supermarket_quantity_remaining: function(req, res){
		console.log("=========================================controller -> update quantity_remaining: ======================================");
		
		var array = req.params.supermarket.split("-");
		console.log(array);
		var key = array[0];
		var quantity_remaining = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateQuantityRemaining',
		        args: [key, quantity_remaining],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_supermarket_mfg: function(req, res){
		console.log("=========================================controller -> update manufacturing_date: ======================================");
		
		var array = req.params.supermarket.split("-");
		console.log(array);
		var key = array[0];
		var manufacturing_date = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateMFG',
		        args: [key, manufacturing_date],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},
	update_supermarket_exp: function(req, res){
		console.log("=========================================controller -> update expiry_date: ======================================");
		
		var array = req.params.supermarket.split("-");
		console.log(array);
		var key = array[0];
		var expiry_date = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'updateEXP',
		        args: [key, expiry_date],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no sick_cure found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no sick_cure found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no sick_cure found");
		});

	},


	edit_password: function(req, res){
		console.log("controller -> update password: ");
		
		var array = req.params.user.split("-");
		console.log(array);
		var key = array[0];
		var password = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'editPassword',
		        args: [key, password],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no user found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no user found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no user found");
		});

	},
	edit_email: function(req, res){
		console.log("controller -> update email: ");
		
		var array = req.params.user.split("-");
		console.log(array);
		var key = array[0];
		var email = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'editEmail',
		        args: [key, email],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no user found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no user found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no user found");
		});

	},
	edit_img: function(req, res){
		console.log("controller -> update img: ");
		
		var array = req.params.user.split("-");
		console.log(array);
		var key = array[0];
		var img = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'editImg',
		        args: [key, img],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no user found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no user found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no user found");
		});

	},
	edit_roles: function(req, res){
		console.log("controller -> update roles: ");
		
		var array = req.params.user.split("-");
		console.log(array);
		var key = array[0];
		var role = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'editRoles',
		        args: [key, role],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no user found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no user found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no user found");
		});

	},
	edit_chainid: function(req, res){
		console.log("............................................................controller -> edit_chainid...........................................: ");
		
		var array = req.params.user.split("-");
		console.log(array);
		var key = array[0];
		var chainid = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'editChainID',
		        args: [key, chainid],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no user found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				res.send("Error: no user found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			res.send("Error: no user found");
		});

	},
	edit_status: function(req, res){
		console.log("controller -> update status: ");
		
		var array = req.params.user.split("-");
		console.log(array);
		var key = array[0];
		var status = array[1];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'editStatus',
		        args: [key, status],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				res.send("Error: no user found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				//exception, Please enter a valid Id 
				res.send("Error: no user found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			//exception, Please enter a valid Id 
			res.send("Error: no user found");
		});

	},
	approve_user: function(req, res){
		console.log("controller -> update approve: ");
		
		var array = req.params.user.split("-");
		console.log(array);
		var key = array[0];
		var status = array[1];
		var approve = array[2];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'approveUser',
		        args: [key, status, approve],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				//exception, Please enter a valid Id 
				res.send("Error: no user found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				//exception, Please enter a valid Id 
				res.send("Error: no user found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			//exception, Please enter a valid Id 
			res.send("Error: no user found");
		});

	},
	cancel_approve_user: function(req, res){
		console.log("controller -> update cancel approve: ");
		
		var array = req.params.user.split("-");
		console.log(array);
		var key = array[0];
		var status = array[1];
		var approve = array[2];

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);
			console.log(tx_id);

		    // send proposal to endorser
		    var request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'approveUser',
		        args: [key, status, approve],
		        chainId: 'mychannel',
		        txId: tx_id
		    };
			console.log(request);
		    // send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
			
		}).then((results) => {
			var proposalResponses = results[0];
			console.log('proposalResponses = results[0]');
			console.log(proposalResponses);
			var proposal = results[1];
			console.log('proposal = results[1]');
			console.log(proposal);
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				// throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				//exception, Please enter a valid Id 
				res.send("Error: no user found");
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				res.json(tx_id.getTransactionID())
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
				//exception, Please enter a valid Id 
				res.send("Error: no user found");
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				// res.json(tx_id.getTransactionID())
				console.log('Successfull');
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
			//exception, Please enter a valid Id 
			res.send("Error: no user found");
		});

	},
	login: function(req, res){
		console.log('===================================================================login-controller.js')
		var usernameLogin = req.params.username;
		console.log('usernameLogin')
		let token = jwt.sign({ username: usernameLogin }, 'cryptokajmaksecret', { expiresIn: '3h' });
		var expiryDate = new Date(Number(new Date()) + 315360000000);
		res.cookie('token', token, { expires: expiryDate, path: '/' }); //pisanje u cookie
		console.log("Token:" + token);

		var Fabric_Client = require('fabric-client');
		//fabric-ca-client, to interact with the fabric-ca to manage user certificates.
		var Fabric_CA_Client = require('fabric-ca-client');

		var path = require('path');
		var util = require('util');
		var os = require('os');

		//
		var fabric_client = new Fabric_Client();
		var fabric_ca_client = null;
		var admin_user = null;
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log(' Store path:'+store_path);
		// console.log('fail function');
		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		// async function main(username) {
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
			// assign the store to the fabric client
			fabric_client.setStateStore(state_store);
			var crypto_suite = Fabric_Client.newCryptoSuite();
			// use the same location for the state store (where the users' certificate are kept)
			// and the crypto store (where the users' keys are kept)
			var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
			crypto_suite.setCryptoKeyStore(crypto_store);
			fabric_client.setCryptoSuite(crypto_suite);
			var	tlsOptions = {
				trustedRoots: [],
				verify: false
			};
			// be sure to change the http to https when the CA is running TLS enabled
			fabric_ca_client = new Fabric_CA_Client('http://localhost:7054', null , '', crypto_suite);
			// first check to see if the admin is already enrolled
			return fabric_client.getUserContext(usernameLogin, true);
		}).then((user_from_store) => {
			//isEnrolled() Determine if this name has been enrolled
			if (user_from_store && user_from_store.isEnrolled()) {
				console.log(`Successfully loaded ${usernameLogin} from persistence`);
				admin_user = user_from_store;
			} else {
				// alert('Fail login');
				throw new Error('Failed to login.... register User');
				
			}

		}).then(()=>{
			// console.log('window location');
			console.log(`${usernameLogin} was successfully login and is ready to intreact with the fabric network`);
			
			//queryalluser
			// var Fabric_Client = require('fabric-client');
			// var path = require('path');
			// var util = require('util');
			// var os = require('os');
			
			// var fabric_client = new Fabric_Client();
			
			// // setup the fabric network
			// var channel = fabric_client.newChannel('mychannel');
			// var peer = fabric_client.newPeer('grpc://localhost:7051');
			// channel.addPeer(peer);
			
			// //
			// var member_user = null;
			// var store_path = path.join(os.homedir(), '.hfc-key-store');
			// console.log('Store path:'+store_path);
			// var tx_id = null;
			
			// // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
			// Fabric_Client.newDefaultKeyValueStore({ path: store_path
			// }).then((state_store) => {
			// 	// assign the store to the fabric client
			// 	fabric_client.setStateStore(state_store);
			// 	var crypto_suite = Fabric_Client.newCryptoSuite();
			// 	// use the same location for the state store (where the users' certificate are kept)
			// 	// and the crypto store (where the users' keys are kept)
			// 	var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
			// 	crypto_suite.setCryptoKeyStore(crypto_store);
			// 	fabric_client.setCryptoSuite(crypto_suite);
			
			// 	// get the enrolled user from persistence, this user will sign all requests
			// 	return fabric_client.getUserContext('admin', true);
			// }).then((user_from_store) => {
			// 	if (user_from_store && user_from_store.isEnrolled()) {
			// 		console.log('Successfully loaded admin from persistence');
			// 		member_user = user_from_store;
			// 	} else {
			// 		throw new Error('Failed to get admin.... run registerUser.js');
			// 	}
			
			// 	// queryAllTuna - requires no arguments , ex: args: [''],
			// 	const request = {
			// 		chaincodeId: 'pig-app',
			// 		txId: tx_id,
			// 		fcn: 'queryAllUser',
			// 		args: ['']
			// 	};
			
			// 	// send the query proposal to the peer
			// 	return channel.queryByChaincode(request);
			// }).then((query_responses) => {
			// 	console.log("Query has completed, checking results");
			// 	// query_responses could have more than one  results if there multiple peers were used as targets
			// 	if (query_responses && query_responses.length == 1) {
			// 		if (query_responses[0] instanceof Error) {
			// 			console.error("error from query = ", query_responses[0]);
			// 		} else {
			// 			console.log("Response is ", query_responses[0].toString());
			// 			res.json(JSON.parse(query_responses[0].toString()));
			// 		}
			// 	} else {
			// 		console.log("No payloads were returned from query");
			// 	}
			// }).catch((err) => {
			// 	console.error('Failed to query successfully :: ' + err);
			// });
			//endqueryalluser
			
		}).catch((err) => {
			console.log('Login successfull')
			// console.error('Failed to register: ' + err);
			if(err.toString().indexOf('Authorization') > -1) {
				console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
				'Try again after deleting the contents of the store directory '+store_path);
			}
		});
		// window.location.href = "../../index.html";
		// res.redirect(this.login(req));
	}
	
	// }	
	,
	sign_up: function(req, res){
		console.log('=========================================================sign_up------controller.js===========================');
		var username = req.params.username;
		var password = req.params.password;
		var Fabric_Client = require('fabric-client');
		//fabric-ca-client, to interact with the fabric-ca to manage user certificates.
		var Fabric_CA_Client = require('fabric-ca-client');

		var path = require('path');
		var util = require('util');
		var os = require('os');

		//
		var fabric_client = new Fabric_Client();
		var fabric_ca_client = null;
		var admin_user = null;
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log(' Store path:'+store_path);
		// console.log('fail function');
		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		// async function main(username) {
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
			// assign the store to the fabric client
			fabric_client.setStateStore(state_store);
			var crypto_suite = Fabric_Client.newCryptoSuite();
			// use the same location for the state store (where the users' certificate are kept)
			// and the crypto store (where the users' keys are kept)
			var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
			crypto_suite.setCryptoKeyStore(crypto_store);
			fabric_client.setCryptoSuite(crypto_suite);
			var	tlsOptions = {
				trustedRoots: [],
				verify: false
			};
			// be sure to change the http to https when the CA is running TLS enabled
			fabric_ca_client = new Fabric_CA_Client('http://localhost:7054', null , '', crypto_suite);

			// first check to see if the admin is already enrolled
			return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
			//isEnrolled() Determine if this name has been enrolled
			if (user_from_store && user_from_store.isEnrolled()) {
				console.log('Successfully loaded admin from persistence');
				console.log('#############################admin:'+ username);
				admin_user = user_from_store;
			} else {
				throw new Error('Failed to get admin.... run registerAdmin.js');
			}

			// at this point we should have the admin user
			// first need to register the user with the CA server
			console.log('#############################ml:'+ username)
			return fabric_ca_client.register({enrollmentID: username, affiliation: 'org1.department1'}, admin_user);
		}).then((secret) => {
			// next we need to enroll the user with CA server
			// console.log(`password:`+ password);
			
			// var hashedPassword = bcrypt.hashSync(req.params.password, 8);
			// console.log(`hashedPassword:`+ hashedPassword);
			// secrect = hashedPassword;
			console.log(`Successfully registered ${username} - secret:`+ secret);

			return fabric_ca_client.enroll({enrollmentID: username, enrollmentSecret: secret});
		}).then((enrollment) => {
		console.log(`Successfully enrolled member user ${username} `);
		return fabric_client.createUser(
			{username: username,
			mspid: 'Org1MSP',
			cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
			});
		}).then((user) => {
			member_user = user;

			return fabric_client.setUserContext(member_user);
		}).then(()=>{
			console.log(`${username} was successfully registered and enrolled and is ready to intreact with the fabric network`);

			//queryalluser
			var Fabric_Client = require('fabric-client');
			var path = require('path');
			var util = require('util');
			var os = require('os');
			
			var fabric_client = new Fabric_Client();
			
			// setup the fabric network
			var channel = fabric_client.newChannel('mychannel');
			var peer = fabric_client.newPeer('grpc://localhost:7051');
			channel.addPeer(peer);
			
			//
			var member_user = null;
			var store_path = path.join(os.homedir(), '.hfc-key-store');
			console.log('Store path:'+store_path);
			var tx_id = null;
			
			// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
			Fabric_Client.newDefaultKeyValueStore({ path: store_path
			}).then((state_store) => {
				// assign the store to the fabric client
				fabric_client.setStateStore(state_store);
				var crypto_suite = Fabric_Client.newCryptoSuite();
				// use the same location for the state store (where the users' certificate are kept)
				// and the crypto store (where the users' keys are kept)
				var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
				crypto_suite.setCryptoKeyStore(crypto_store);
				fabric_client.setCryptoSuite(crypto_suite);
			
				// get the enrolled user from persistence, this user will sign all requests
				return fabric_client.getUserContext('admin', true);
			}).then((user_from_store) => {
				if (user_from_store && user_from_store.isEnrolled()) {
					console.log('Successfully loaded admin from persistence');
					member_user = user_from_store;
				} else {
					throw new Error('Failed to get admin.... run registerUser.js');
				}
			
				// queryAllTuna - requires no arguments , ex: args: [''],
				const request = {
					chaincodeId: 'pig-app',
					txId: tx_id,
					fcn: 'queryAllUser',
					args: ['']
				};
			
				// send the query proposal to the peer
				return channel.queryByChaincode(request);
			}).then((query_responses) => {
				console.log("Query has completed, checking results");
				// query_responses could have more than one  results if there multiple peers were used as targets
				if (query_responses && query_responses.length == 1) {
					if (query_responses[0] instanceof Error) {
						console.error("error from query = ", query_responses[0]);
					} else {
						console.log("Response is ", query_responses[0].toString());
						res.json(JSON.parse(query_responses[0].toString()));
					}
				} else {
					console.log("No payloads were returned from query");
				}
			}).catch((err) => {
				console.error('Failed to query successfully :: ' + err);
			});
			//endqueryalluser

		}).catch((err) => {
			// console.log('Login successfull')
			// console.error('Failed to register: ' + err);
			// console.log('Failed to register: lll ' + err);
			
			if(err.toString().indexOf('Authorization') > -1) {
				console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
				'Try again after deleting the contents of the store directory '+store_path);
			}
		});



	}
	// }	
	,
	add_user: function(req, res){
		console.log("submit recording of a user: ");
		var array = req.params.user.split("-");
		console.log(array);

		
		var key = array[0]
		var img = array[1]
		var username = array[2]
		var password = array[3]
		var email = array[4]
		var chainid = array[5]
		var roles = array[6]
		var status = array[7]
		var approve = array[8]
		
		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
				member_user = user_from_store;
				// alert('eeerrr');
				
				
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);

		    // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
		    // send proposal to endorser
		    const request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'addUser',
		        args: [key, img, username, password, email, chainid, roles, status, approve],
		        chainId: 'mychannel',
		        txId: tx_id
		    };

		    // send the transaction proposal to the peers
		    return channel.sendTransactionProposal(request);
		}).then((results) => {
			console.log(request);
			var proposalResponses = results[0];
		    var proposal = results[1];
		    let isProposalGood = false;
		    if (proposalResponses && proposalResponses[0].response &&
		        proposalResponses[0].response.status === 200) {
		            isProposalGood = true;
		            console.log('Transaction proposal was good');
		        } else {
		            console.error('Transaction proposal was bad');
		        }
		    if (isProposalGood) {
		        console.log(util.format(
		            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		            proposalResponses[0].response.status, proposalResponses[0].response.message));

		        // build up the request for the orderer to have the transaction committed
		        var request = {
		            proposalResponses: proposalResponses,
		            proposal: proposal
		        };

		        // set the transaction listener and set a timeout of 30 sec
		        // if the transaction did not get committed within the timeout period,
		        // report a TIMEOUT status
		        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
				console.log("error get id transaction")
				console.log(transaction_id_string);
				var sendPromise = channel.sendTransaction(request);
				console.log("err sendPromise");
		        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

		        // get an eventhub once the fabric client has a user assigned. The user
		        // is required bacause the event registration must be signed
				// let event_hub = channel.newChannelEventHub(peer);
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
				console.log("err event_hub.setPeerAddr");
				console.log(event_hub);

		        // using resolve the promise so that result status may be processed
		        // under the then clause rather than having the catch clause process
		        // the status
		        let txPromise = new Promise((resolve, reject) => {
		            let handle = setTimeout(() => {
		                event_hub.disconnect();
		                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
		            }, 3000);
					event_hub.connect();
					console.log("err event_hub.connect");
		            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
		                // this is the callback for transaction event status
		                // first some clean up of event listener
		                clearTimeout(handle);
		                event_hub.unregisterTxEvent(transaction_id_string);
		                event_hub.disconnect();

		                // now let the application know what happened
		                var return_status = {event_status : code, tx_id : transaction_id_string};
		                if (code !== 'VALID') {
		                    console.error('The transaction was invalid, code = ' + code);
		                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
		                } else {

							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
		                    resolve(return_status);
		                }
		            }, (err) => {
		                //this is the callback if something goes wrong with the event registration or processing
		                reject(new Error('There was a problem with the eventhub ::'+err));
		            });
		        });
				promises.push(txPromise);
				console.log("err promises.push()")
				console.log(promises);
				return Promise.all(promises);
		    } else {
		        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		    }
		}).then((results) => {
		    console.log('Send transaction promise and event listener promise have completed');
		    // check the results in the order the promises were added to the promise all list
		    if (results && results[0] && results[0].status === 'SUCCESS') {
		        console.log('Successfully sent transaction to the orderer.');
		        res.send(tx_id.getTransactionID());
		    } else {
		        console.error('Failed to order the transaction. Error code: ' + response.status);
		    }

		    if(results && results[1] && results[1].event_status === 'VALID') {
		        console.log('Successfully committed the change to the ledger by the peer');
				// res.send(tx_id.getTransactionID());
				//k bo dong xanh tren loi console
				console.log('Successful');
		    } else {
		        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
			// return next();
		}).catch((err) => {
		    console.error('Failed to invoke successfully :: ' + err);
		});
	},
	delete_user: function(req, res){
		console.log("=================================================delete user:================================================= ");
		var array = req.params.user.split("-");
		console.log(array);

		var key = array[0]
		var img = array[1]
		var username = array[2]
		var password = array[3]
		var email = array[4]
		var chainid = array[5]
		var roles = array[6]
		var status = array[7]
		var approve = array[8]
		
		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
				member_user = user_from_store;
				// alert('eeerrr');
				
				
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);

		    // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
		    // send proposal to endorser
		    const request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'deleteUser',
		        args: [key, img, username, password, email, chainid, roles, status, approve],
		        chainId: 'mychannel',
		        txId: tx_id
		    };

		    // send the transaction proposal to the peers
		    return channel.sendTransactionProposal(request);
		}).then((results) => {
			console.log(request);
			var proposalResponses = results[0];
		    var proposal = results[1];
		    let isProposalGood = false;
		    if (proposalResponses && proposalResponses[0].response &&
		        proposalResponses[0].response.status === 200) {
		            isProposalGood = true;
		            console.log('Transaction proposal was good');
		        } else {
		            console.error('Transaction proposal was bad');
		        }
		    if (isProposalGood) {
		        console.log(util.format(
		            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		            proposalResponses[0].response.status, proposalResponses[0].response.message));

		        // build up the request for the orderer to have the transaction committed
		        var request = {
		            proposalResponses: proposalResponses,
		            proposal: proposal
		        };

		        // set the transaction listener and set a timeout of 30 sec
		        // if the transaction did not get committed within the timeout period,
		        // report a TIMEOUT status
		        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
				console.log("error get id transaction")
				console.log(transaction_id_string);
				var sendPromise = channel.sendTransaction(request);
				console.log("err sendPromise");
		        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

		        // get an eventhub once the fabric client has a user assigned. The user
		        // is required bacause the event registration must be signed
				// let event_hub = channel.newChannelEventHub(peer);
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
				console.log("err event_hub.setPeerAddr");
				console.log(event_hub);

		        // using resolve the promise so that result status may be processed
		        // under the then clause rather than having the catch clause process
		        // the status
		        let txPromise = new Promise((resolve, reject) => {
		            let handle = setTimeout(() => {
		                event_hub.disconnect();
		                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
		            }, 3000);
					event_hub.connect();
					console.log("err event_hub.connect");
		            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
		                // this is the callback for transaction event status
		                // first some clean up of event listener
		                clearTimeout(handle);
		                event_hub.unregisterTxEvent(transaction_id_string);
		                event_hub.disconnect();

		                // now let the application know what happened
		                var return_status = {event_status : code, tx_id : transaction_id_string};
		                if (code !== 'VALID') {
		                    console.error('The transaction was invalid, code = ' + code);
		                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
		                } else {

							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
		                    resolve(return_status);
		                }
		            }, (err) => {
		                //this is the callback if something goes wrong with the event registration or processing
		                reject(new Error('There was a problem with the eventhub ::'+err));
		            });
		        });
				promises.push(txPromise);
				console.log("err promises.push()")
				console.log(promises);
				return Promise.all(promises);
		    } else {
		        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		    }
		}).then((results) => {
		    console.log('Send transaction promise and event listener promise have completed');
		    // check the results in the order the promises were added to the promise all list
		    if (results && results[0] && results[0].status === 'SUCCESS') {
		        console.log('Successfully sent transaction to the orderer.');
		        res.send(tx_id.getTransactionID());
		    } else {
		        console.error('Failed to order the transaction. Error code: ' + response.status);
		    }

		    if(results && results[1] && results[1].event_status === 'VALID') {
		        console.log('Successfully committed the change to the ledger by the peer');
				// res.send(tx_id.getTransactionID());
				//k bo dong xanh tren loi console
				console.log('Successful');
		    } else {
		        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
			// return next();
		}).catch((err) => {
		    console.error('Failed to invoke successfully :: ' + err);
		});
	},
	add_history_txid: function(req, res){
		console.log("submit recording of a add_history_txid: ");
		var array = req.params.history.split("-");
		console.log(array);

		var key = array[0]
		var txid = array[1]
		var account = array[2]
		var job = array[3]
		var creatte_time =array[4]
		
		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
				member_user = user_from_store;
				// alert('eeerrr');
				
				
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);

		    // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
		    // send proposal to endorser
		    const request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'addHistoryTxID',
		        args: [key, txid, account, job, creatte_time],
		        chainId: 'mychannel',
		        txId: tx_id
		    };

		    // send the transaction proposal to the peers
		    return channel.sendTransactionProposal(request);
		}).then((results) => {
			console.log(request);
			var proposalResponses = results[0];
		    var proposal = results[1];
		    let isProposalGood = false;
		    if (proposalResponses && proposalResponses[0].response &&
		        proposalResponses[0].response.status === 200) {
		            isProposalGood = true;
		            console.log('Transaction proposal was good');
		        } else {
		            console.error('Transaction proposal was bad');
		        }
		    if (isProposalGood) {
		        console.log(util.format(
		            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		            proposalResponses[0].response.status, proposalResponses[0].response.message));

		        // build up the request for the orderer to have the transaction committed
		        var request = {
		            proposalResponses: proposalResponses,
		            proposal: proposal
		        };

		        // set the transaction listener and set a timeout of 30 sec
		        // if the transaction did not get committed within the timeout period,
		        // report a TIMEOUT status
		        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
				console.log("error get id transaction")
				console.log(transaction_id_string);
				var sendPromise = channel.sendTransaction(request);
				console.log("err sendPromise");
		        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

		        // get an eventhub once the fabric client has a user assigned. The user
		        // is required bacause the event registration must be signed
				// let event_hub = channel.newChannelEventHub(peer);
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
				console.log("err event_hub.setPeerAddr");
				console.log(event_hub);

		        // using resolve the promise so that result status may be processed
		        // under the then clause rather than having the catch clause process
		        // the status
		        let txPromise = new Promise((resolve, reject) => {
		            let handle = setTimeout(() => {
		                event_hub.disconnect();
		                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
		            }, 3000);
					event_hub.connect();
					console.log("err event_hub.connect");
		            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
		                // this is the callback for transaction event status
		                // first some clean up of event listener
		                clearTimeout(handle);
		                event_hub.unregisterTxEvent(transaction_id_string);
		                event_hub.disconnect();

		                // now let the application know what happened
		                var return_status = {event_status : code, tx_id : transaction_id_string};
		                if (code !== 'VALID') {
		                    console.error('The transaction was invalid, code = ' + code);
		                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
		                } else {

							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
		                    resolve(return_status);
		                }
		            }, (err) => {
		                //this is the callback if something goes wrong with the event registration or processing
		                reject(new Error('There was a problem with the eventhub ::'+err));
		            });
		        });
				promises.push(txPromise);
				console.log("err promises.push()")
				console.log(promises);
				return Promise.all(promises);
		    } else {
		        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		    }
		}).then((results) => {
		    console.log('Send transaction promise and event listener promise have completed');
		    // check the results in the order the promises were added to the promise all list
		    if (results && results[0] && results[0].status === 'SUCCESS') {
		        console.log('Successfully sent transaction to the orderer.');
		        res.send(tx_id.getTransactionID());
		    } else {
		        console.error('Failed to order the transaction. Error code: ' + response.status);
		    }

		    if(results && results[1] && results[1].event_status === 'VALID') {
		        console.log('Successfully committed the change to the ledger by the peer');
				// res.send(tx_id.getTransactionID());
				//k bo dong xanh tren loi console
				console.log('Successful');
		    } else {
		        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
			// return next();
		}).catch((err) => {
		    console.error('Failed to invoke successfully :: ' + err);
		});
	},
	// add_record_pig: function(req, res){
	// 	console.log("add pig: ");
	// 	var array = req.params.addpig.split("-");
	// 	console.log(array);

	// 	var key = array[0];
	// 	var farm_account = array[1];
	// 	var famer = array[2];
	// 	var species = array[3];
	// 	var food = array[4];
	// 	var sick_cure =  array[5];
	// 	var farm_qualified = array[6];
	// 	var farm_location = array[7];
	// 	var start_date_of_farming = array[8];
	// 	var end_date_of_farming = array[9];
		
	// 	var fabric_client = new Fabric_Client();

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);
	// 	var order = fabric_client.newOrderer('grpc://localhost:7050')
	// 	channel.addOrderer(order);

	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 			member_user = user_from_store;
	// 			// alert('eeerrr');
				
				
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // get a transaction id object based on the current user assigned to fabric client
	// 	    tx_id = fabric_client.newTransactionID();
	// 	    console.log("Assigning transaction_id: ", tx_id._transaction_id);

	// 	    // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
	// 	    // send proposal to endorser
	// 	    const request = {
	// 	        //targets : --- letting this default to the peers assigned to the channel
	// 	        chaincodeId: 'pig-app',
	// 	        fcn: 'addPig',
	// 	        args: [key, farm_account, famer, species, food, sick_cure, farm_qualified, farm_location, start_date_of_farming, end_date_of_farming],
	// 	        chainId: 'mychannel',
	// 	        txId: tx_id
	// 	    };

	// 	    // send the transaction proposal to the peers
	// 	    return channel.sendTransactionProposal(request);
	// 	}).then((results) => {
	// 		console.log(request);
	// 		var proposalResponses = results[0];
	// 	    var proposal = results[1];
	// 	    let isProposalGood = false;
	// 	    if (proposalResponses && proposalResponses[0].response &&
	// 	        proposalResponses[0].response.status === 200) {
	// 	            isProposalGood = true;
	// 	            console.log('Transaction proposal was good');
	// 	        } else {
	// 	            console.error('Transaction proposal was bad');
	// 	        }
	// 	    if (isProposalGood) {
	// 	        console.log(util.format(
	// 	            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
	// 	            proposalResponses[0].response.status, proposalResponses[0].response.message));

	// 	        // build up the request for the orderer to have the transaction committed
	// 	        var request = {
	// 	            proposalResponses: proposalResponses,
	// 	            proposal: proposal
	// 	        };

	// 	        // set the transaction listener and set a timeout of 30 sec
	// 	        // if the transaction did not get committed within the timeout period,
	// 	        // report a TIMEOUT status
	// 	        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
	// 			var promises = [];
	// 			console.log("error get id transaction")
	// 			console.log(transaction_id_string);
	// 			var sendPromise = channel.sendTransaction(request);
	// 			console.log("err sendPromise");
	// 	        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

	// 	        // get an eventhub once the fabric client has a user assigned. The user
	// 	        // is required bacause the event registration must be signed
	// 			// let event_hub = channel.newChannelEventHub(peer);
	// 			// let event_hub = fabric_client.newEventHub();
	// 			// event_hub.setPeerAddr('grpc://localhost:7053');
	// 			let event_hub = channel.newChannelEventHub('localhost:7051');
	// 			console.log("err event_hub.setPeerAddr");
	// 			console.log(event_hub);

	// 	        // using resolve the promise so that result status may be processed
	// 	        // under the then clause rather than having the catch clause process
	// 	        // the status
	// 	        let txPromise = new Promise((resolve, reject) => {
	// 	            let handle = setTimeout(() => {
	// 	                event_hub.disconnect();
	// 	                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
	// 	            }, 3000);
	// 				event_hub.connect();
	// 				console.log("err event_hub.connect");
	// 	            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
	// 	                // this is the callback for transaction event status
	// 	                // first some clean up of event listener
	// 	                clearTimeout(handle);
	// 	                event_hub.unregisterTxEvent(transaction_id_string);
	// 	                event_hub.disconnect();

	// 	                // now let the application know what happened
	// 	                var return_status = {event_status : code, tx_id : transaction_id_string};
	// 	                if (code !== 'VALID') {
	// 	                    console.error('The transaction was invalid, code = ' + code);
	// 	                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
	// 	                } else {

	// 						console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
	// 						// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
	// 	                    resolve(return_status);
	// 	                }
	// 	            }, (err) => {
	// 	                //this is the callback if something goes wrong with the event registration or processing
	// 	                reject(new Error('There was a problem with the eventhub ::'+err));
	// 	            });
	// 	        });
	// 			promises.push(txPromise);
	// 			console.log("err promises.push()")
	// 			console.log(promises);
	// 			return Promise.all(promises);
	// 	    } else {
	// 	        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	    }
	// 	}).then((results) => {
	// 	    console.log('Send transaction promise and event listener promise have completed');
	// 	    // check the results in the order the promises were added to the promise all list
	// 	    if (results && results[0] && results[0].status === 'SUCCESS') {
	// 	        console.log('Successfully sent transaction to the orderer.');
	// 	        res.send(tx_id.getTransactionID());
	// 	    } else {
	// 	        console.error('Failed to order the transaction. Error code: ' + response.status);
	// 	    }

	// 	    if(results && results[1] && results[1].event_status === 'VALID') {
	// 	        console.log('Successfully committed the change to the ledger by the peer');
	// 			// res.send(tx_id.getTransactionID());
	// 			//k bo dong xanh tren loi console
	// 			console.log('Successful');
	// 	    } else {
	// 	        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
	// 		}
	// 		// return next();
	// 	}).catch((err) => {
	// 	    console.error('Failed to invoke successfully :: ' + err);
	// 	});
	// },
	add_chain: function(req, res){
		console.log("==================================================submit add chain when approve farm user================================================== ");
		var array = req.params.chain.split("-");
		console.log(array);

		var key = array[0]

		var farm_account = array[1]
		var famer = array[2]
		var species = array[3]
		var food = array[4]
		var sick_cure = array[5]
		var farm_qualified = array[6]
		var farm_location = array[7]
		var start_date_of_farming = array[8]
		var end_date_of_farming = array[9]

		var transport_account = array[10]
		var company = array[11];
		var transporter = array[12];
		var vehicle = array[13];
		var transport_trouble_solution = array[14];
		var transport_qualified = array[15];
		var time = array[16];

		var abattoir_account = array[17]
		var abattoir_name = array[18];
		var abattoir_trouble_solution = array[19];
		var abattoir_location = array[20];
		var abattoir_qualified = array[21];
		var peck_time = array[22];

		var supermarket_account = array[23]
		var supermarket_name = array[24];
		var supermarket_trouble_solution = array[25];
		var supermarket_qualified = array[26];
		var price = array[27];
		var quantity_remaining = array[28];
		var manufacturing_date = array[29];
		var expiry_date = array[30];
		
		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
				member_user = user_from_store;
				// alert('eeerrr');
				
				
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);

		    // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
		    // send proposal to endorser
		    const request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'initChain',
				args: [key, farm_account, famer, species, food, sick_cure, farm_qualified, farm_location, start_date_of_farming, end_date_of_farming, transport_account, company, transporter, vehicle, transport_trouble_solution, transport_qualified, time, abattoir_account, abattoir_name, abattoir_trouble_solution, abattoir_location, abattoir_qualified, peck_time, supermarket_account, supermarket_name, supermarket_trouble_solution, supermarket_qualified, price, quantity_remaining, manufacturing_date, expiry_date],
		        chainId: 'mychannel',
		        txId: tx_id
		    };

		    // send the transaction proposal to the peers
		    return channel.sendTransactionProposal(request);
		}).then((results) => {
			console.log(request);
			var proposalResponses = results[0];
		    var proposal = results[1];
		    let isProposalGood = false;
		    if (proposalResponses && proposalResponses[0].response &&
		        proposalResponses[0].response.status === 200) {
		            isProposalGood = true;
		            console.log('Transaction proposal was good');
		        } else {
		            console.error('Transaction proposal was bad');
		        }
		    if (isProposalGood) {
		        console.log(util.format(
		            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		            proposalResponses[0].response.status, proposalResponses[0].response.message));

		        // build up the request for the orderer to have the transaction committed
		        var request = {
		            proposalResponses: proposalResponses,
		            proposal: proposal
		        };

		        // set the transaction listener and set a timeout of 30 sec
		        // if the transaction did not get committed within the timeout period,
		        // report a TIMEOUT status
		        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
				console.log("error get id transaction")
				console.log(transaction_id_string);
				var sendPromise = channel.sendTransaction(request);
				console.log("err sendPromise");
		        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

		        // get an eventhub once the fabric client has a user assigned. The user
		        // is required bacause the event registration must be signed
				// let event_hub = channel.newChannelEventHub(peer);
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
				console.log("err event_hub.setPeerAddr");
				console.log(event_hub);

		        // using resolve the promise so that result status may be processed
		        // under the then clause rather than having the catch clause process
		        // the status
		        let txPromise = new Promise((resolve, reject) => {
		            let handle = setTimeout(() => {
		                event_hub.disconnect();
		                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
		            }, 3000);
					event_hub.connect();
					console.log("err event_hub.connect");
		            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
		                // this is the callback for transaction event status
		                // first some clean up of event listener
		                clearTimeout(handle);
		                event_hub.unregisterTxEvent(transaction_id_string);
		                event_hub.disconnect();

		                // now let the application know what happened
		                var return_status = {event_status : code, tx_id : transaction_id_string};
		                if (code !== 'VALID') {
		                    console.error('The transaction was invalid, code = ' + code);
		                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
		                } else {

							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
		                    resolve(return_status);
		                }
		            }, (err) => {
		                //this is the callback if something goes wrong with the event registration or processing
		                reject(new Error('There was a problem with the eventhub ::'+err));
		            });
		        });
				promises.push(txPromise);
				console.log("err promises.push()")
				console.log(promises);
				return Promise.all(promises);
		    } else {
		        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		    }
		}).then((results) => {
		    console.log('Send transaction promise and event listener promise have completed');
		    // check the results in the order the promises were added to the promise all list
		    if (results && results[0] && results[0].status === 'SUCCESS') {
		        console.log('Successfully sent transaction to the orderer.');
		        res.send(tx_id.getTransactionID());
		    } else {
		        console.error('Failed to order the transaction. Error code: ' + response.status);
		    }

		    if(results && results[1] && results[1].event_status === 'VALID') {
		        console.log('Successfully committed the change to the ledger by the peer');
				// res.send(tx_id.getTransactionID());
				//k bo dong xanh tren loi console
				console.log('Successful');
		    } else {
		        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
			// return next();
		}).catch((err) => {
		    console.error('Failed to invoke successfully :: ' + err);
		});
	},
	
	//get_all_user
	get_all_user: function(req, res){
		console.log('=================================================================getAllUser-controller.js')
		console.log("getting all user from database: ");

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);

		//
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // queryAllTuna - requires no arguments , ex: args: [''],
		    const request = {
		        chaincodeId: 'pig-app',
		        txId: tx_id,
		        fcn: 'queryAllUser',
		        args: ['']
		    };

		    // send the query proposal to the peer
		    return channel.queryByChaincode(request);
		}).then((query_responses) => {
		    console.log("Query has completed, checking results");
		    // query_responses could have more than one  results if there multiple peers were used as targets
		    if (query_responses && query_responses.length == 1) {
		        if (query_responses[0] instanceof Error) {
		            console.error("error from query = ", query_responses[0]);
		        } else {
		            console.log("Response is ", query_responses[0].toString());
		            res.json(JSON.parse(query_responses[0].toString()));
		        }
		    } else {
		        console.log("No payloads were returned from query");
		    }
		}).catch((err) => {
		    console.error('Failed to query successfully :: ' + err);
		});
	},

	//get_all_history_txid
	get_all_history_txid: function(req, res){
		console.log('=================================================================get_all_history_txid-controller.js')
		console.log("getting all get_all_history_txid from database: ");

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);

		//
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // queryAllTuna - requires no arguments , ex: args: [''],
		    const request = {
		        chaincodeId: 'pig-app',
		        txId: tx_id,
		        fcn: 'queryAllHistoryTxID',
		        args: ['']
		    };

		    // send the query proposal to the peer
		    return channel.queryByChaincode(request);
		}).then((query_responses) => {
		    console.log("Query has completed, checking results");
		    // query_responses could have more than one  results if there multiple peers were used as targets
		    if (query_responses && query_responses.length == 1) {
		        if (query_responses[0] instanceof Error) {
		            console.error("error from query = ", query_responses[0]);
		        } else {
		            console.log("Response is ", query_responses[0].toString());
		            res.json(JSON.parse(query_responses[0].toString()));
		        }
		    } else {
		        console.log("No payloads were returned from query");
		    }
		}).catch((err) => {
		    console.error('Failed to query successfully :: ' + err);
		});
	},
	
	//get_all_pig
	get_all_pig: function(req, res){
		console.log("=================================================getting all pig from database:=============================================== ");

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);

		//
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // queryAllTuna - requires no arguments , ex: args: [''],
		    const request = {
		        chaincodeId: 'pig-app',
		        txId: tx_id,
		        fcn: 'queryAllPig',
		        args: ['']
		    };

		    // send the query proposal to the peer
		    return channel.queryByChaincode(request);
		}).then((query_responses) => {
		    console.log("Query has completed, checking results");
		    // query_responses could have more than one  results if there multiple peers were used as targets
		    if (query_responses && query_responses.length == 1) {
		        if (query_responses[0] instanceof Error) {
		            console.error("error from query = ", query_responses[0]);
		        } else {
		            console.log("Response is ", query_responses[0].toString());
		            res.json(JSON.parse(query_responses[0].toString()));
		        }
		    } else {
		        console.log("No payloads were returned from query");
		    }
		}).catch((err) => {
		    console.error('Failed to query successfully :: ' + err);
		});
	},

	//get_all_pig_with_account_farm
	get_all_pig_with_account_farm: function(req, res){
		console.log("getting all pig from database: ");

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);

		//
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // queryAllTuna - requires no arguments , ex: args: [''],
		    const request = {
		        chaincodeId: 'pig-app',
		        txId: tx_id,
		        fcn: 'queryAllPig',
		        args: ['']
		    };

		    // send the query proposal to the peer
		    return channel.queryByChaincode(request);
		}).then((query_responses) => {
		    console.log("Query has completed, checking results");
		    // query_responses could have more than one  results if there multiple peers were used as targets
		    if (query_responses && query_responses.length == 1) {
		        if (query_responses[0] instanceof Error) {
		            console.error("error from query = ", query_responses[0]);
		        } else {
		            console.log("Response is ", query_responses[0].toString());
		            res.json(JSON.parse(query_responses[0].toString()));
		        }
		    } else {
		        console.log("No payloads were returned from query");
		    }
		}).catch((err) => {
		    console.error('Failed to query successfully :: ' + err);
		});
	},
	// get_all_pig_with_account_transport: function(req, res){
	// 	console.log("getting get_all_pig_with_account_transport from database: ");

	// 	var fabric_client = new Fabric_Client();

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);

	// 	//
	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // queryAllTuna - requires no arguments , ex: args: [''],
	// 	    const request = {
	// 	        chaincodeId: 'pig-app',
	// 	        txId: tx_id,
	// 	        fcn: 'queryAllPig',
	// 	        args: ['']
	// 	    };

	// 	    // send the query proposal to the peer
	// 	    return channel.queryByChaincode(request);
	// 	}).then((query_responses) => {
	// 	    console.log("Query has completed, checking results");
	// 	    // query_responses could have more than one  results if there multiple peers were used as targets
	// 	    if (query_responses && query_responses.length == 1) {
	// 	        if (query_responses[0] instanceof Error) {
	// 	            console.error("error from query = ", query_responses[0]);
	// 	        } else {
	// 	            console.log("Response is ", query_responses[0].toString());
	// 	            res.json(JSON.parse(query_responses[0].toString()));
	// 	        }
	// 	    } else {
	// 	        console.log("No payloads were returned from query");
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to query successfully :: ' + err);
	// 	});
	// },
	get_all_farm: function(req, res){
		console.log("getting all farm from database: ");

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);

		//
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // queryAll - requires no arguments , ex: args: [''],
		    const request = {
		        chaincodeId: 'pig-app',
		        txId: tx_id,
		        fcn: 'queryAllFarm',
		        args: ['']
		    };

		    // send the query proposal to the peer
		    return channel.queryByChaincode(request);
		}).then((query_responses) => {
		    console.log("Query has completed, checking results");
		    // query_responses could have more than one  results if there multiple peers were used as targets
		    if (query_responses && query_responses.length == 1) {
		        if (query_responses[0] instanceof Error) {
		            console.error("error from query = ", query_responses[0]);
		        } else {
		            console.log("Response is ", query_responses[0].toString());
		            res.json(JSON.parse(query_responses[0].toString()));
		        }
		    } else {
		        console.log("No payloads were returned from query");
		    }
		}).catch((err) => {
		    console.error('Failed to query successfully :: ' + err);
		});
	},
	get_all_transport: function(req, res){
		console.log("getting all transport from database: ");

		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);

		//
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // queryAll - requires no arguments , ex: args: [''],
		    const request = {
		        chaincodeId: 'pig-app',
		        txId: tx_id,
		        fcn: 'queryAllTransport',
		        args: ['']
		    };

		    // send the query proposal to the peer
		    return channel.queryByChaincode(request);
		}).then((query_responses) => {
		    console.log("Query has completed, checking results");
		    // query_responses could have more than one  results if there multiple peers were used as targets
		    if (query_responses && query_responses.length == 1) {
		        if (query_responses[0] instanceof Error) {
		            console.error("error from query = ", query_responses[0]);
		        } else {
		            console.log("Response is ", query_responses[0].toString());
		            res.json(JSON.parse(query_responses[0].toString()));
		        }
		    } else {
		        console.log("No payloads were returned from query");
		    }
		}).catch((err) => {
		    console.error('Failed to query successfully :: ' + err);
		});
	},

	//get_pig
	get_pig: function(req, res){

		var fabric_client = new Fabric_Client();
		var key = req.params.id

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);

		//
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // queryTuna - requires 1 argument, ex: args: ['4'],
		    const request = {
		        chaincodeId: 'pig-app',
		        txId: tx_id,
		        fcn: 'queryPig',
		        args: [key]
			};
			console.log(key);
			console.log("================request===========");
			console.log(request);
		    // send the query proposal to the peer
			return channel.queryByChaincode(request);
		}).then((query_responses) => {
			
			console.log("Query has completed, checking results");
			console.log("loi o day");
		    // query_responses could have more than one  results if there multiple peers were used as targets
		    if (query_responses && query_responses.length == 1) {
		        if (query_responses[0] instanceof Error) {
					console.error("error from query = ", query_responses[0]);
					console.log("send Could not locate pig");
					res.send("Could not locate pig");
		            
		        } else {
		            console.log("Response is ", query_responses[0].toString());
		            res.send(query_responses[0].toString());
		        }
		    } else {
		        console.log("No payloads were returned from query");
		        res.send("Could not locate pig");
		    }
		}).catch((err) => {
		    console.error('Failed to query successfully :: ' + err);
		    res.send("Could not locate pig");
		});
	},

	//query_view_user
	query_view_user: function(req, res){

		var fabric_client = new Fabric_Client();
		var key = req.params.id

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);

		//
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // queryTuna - requires 1 argument, ex: args: ['4'],
		    const request = {
		        chaincodeId: 'pig-app',
		        txId: tx_id,
		        fcn: 'queryViewUser',
		        args: [key]
			};
			console.log(key);
			console.log("================request===========");
			console.log(request);
		    // send the query proposal to the peer
			return channel.queryByChaincode(request);
		}).then((query_responses) => {
			
			console.log("Query has completed, checking results");
			console.log("loi o day");
		    // query_responses could have more than one  results if there multiple peers were used as targets
		    if (query_responses && query_responses.length == 1) {
		        if (query_responses[0] instanceof Error) {
					console.error("error from query = ", query_responses[0]);
					console.log("send Could not locate user");
					res.send("Could not locate user");
		            
		        } else {
		            console.log("Response is ", query_responses[0].toString());
		            res.send(query_responses[0].toString());
		        }
		    } else {
		        console.log("No payloads were returned from query");
		        res.send("Could not locate user");
		    }
		}).catch((err) => {
		    console.error('Failed to query successfully :: ' + err);
		    res.send("Could not locate user");
		});
	},
	// query_farm: function(req, res){

	// 	var fabric_client = new Fabric_Client();
	// 	var key = req.params.id

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);

	// 	//
	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // queryTuna - requires 1 argument, ex: args: ['4'],
	// 	    const request = {
	// 	        chaincodeId: 'pig-app',
	// 	        txId: tx_id,
	// 	        fcn: 'queryFarm',
	// 	        args: [key]
	// 		};
	// 		console.log(key);
	// 		console.log("================request===========");
	// 		console.log(request);
	// 	    // send the query proposal to the peer
	// 		return channel.queryByChaincode(request);
	// 	}).then((query_responses) => {
			
	// 		console.log("Query has completed, checking results");
	// 		console.log("loi o day");
	// 	    // query_responses could have more than one  results if there multiple peers were used as targets
	// 	    if (query_responses && query_responses.length == 1) {
	// 	        if (query_responses[0] instanceof Error) {
	// 				console.error("error from query = ", query_responses[0]);
	// 				console.log("send Could not locate pig");
	// 				res.send("Could not locate pig");
		            
	// 	        } else {
	// 	            console.log("Response is ", query_responses[0].toString());
	// 	            res.send(query_responses[0].toString());
	// 	        }
	// 	    } else {
	// 	        console.log("No payloads were returned from query");
	// 	        res.send("Could not locate pig");
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to query successfully :: ' + err);
	// 	    res.send("Could not locate pig");
	// 	});
	// },
	
	// query_transport: function(req, res){

	// 	var fabric_client = new Fabric_Client();
	// 	var key = req.params.id

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);

	// 	//
	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // queryTuna - requires 1 argument, ex: args: ['4'],
	// 	    const request = {
	// 	        chaincodeId: 'pig-app',
	// 	        txId: tx_id,
	// 	        fcn: 'queryTransport',
	// 	        args: [key]
	// 		};
	// 		console.log(key);
	// 		console.log("================request===========");
	// 		console.log(request);
	// 	    // send the query proposal to the peer
	// 		return channel.queryByChaincode(request);
	// 	}).then((query_responses) => {
			
	// 		console.log("Query has completed, checking results");
	// 		console.log("loi o day");
	// 	    // query_responses could have more than one  results if there multiple peers were used as targets
	// 	    if (query_responses && query_responses.length == 1) {
	// 	        if (query_responses[0] instanceof Error) {
	// 				console.error("error from query = ", query_responses[0]);
	// 				console.log("send Could not locate pig");
	// 				res.send("Could not locate pig");
		            
	// 	        } else {
	// 	            console.log("Response is ", query_responses[0].toString());
	// 	            res.send(query_responses[0].toString());
	// 	        }
	// 	    } else {
	// 	        console.log("No payloads were returned from query");
	// 	        res.send("Could not locate pig");
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to query successfully :: ' + err);
	// 	    res.send("Could not locate pig");
	// 	});
	// },
	// query_abattoir: function(req, res){

	// 	var fabric_client = new Fabric_Client();
	// 	var key = req.params.id

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);

	// 	//
	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // queryTuna - requires 1 argument, ex: args: ['4'],
	// 	    const request = {
	// 	        chaincodeId: 'pig-app',
	// 	        txId: tx_id,
	// 	        fcn: 'queryAbattoir',
	// 	        args: [key]
	// 		};
	// 		console.log(key);
	// 		console.log("================request===========");
	// 		console.log(request);
	// 	    // send the query proposal to the peer
	// 		return channel.queryByChaincode(request);
	// 	}).then((query_responses) => {
			
	// 		console.log("Query has completed, checking results");
	// 		console.log("loi o day");
	// 	    // query_responses could have more than one  results if there multiple peers were used as targets
	// 	    if (query_responses && query_responses.length == 1) {
	// 	        if (query_responses[0] instanceof Error) {
	// 				console.error("error from query = ", query_responses[0]);
	// 				console.log("send Could not locate pig");
	// 				res.send("Could not locate pig");
		            
	// 	        } else {
	// 	            console.log("Response is ", query_responses[0].toString());
	// 	            res.send(query_responses[0].toString());
	// 	        }
	// 	    } else {
	// 	        console.log("No payloads were returned from query");
	// 	        res.send("Could not locate pig");
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to query successfully :: ' + err);
	// 	    res.send("Could not locate pig");
	// 	});
	// },
	// query_supermarket: function(req, res){

	// 	var fabric_client = new Fabric_Client();
	// 	var key = req.params.id

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);

	// 	//
	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // queryTuna - requires 1 argument, ex: args: ['4'],
	// 	    const request = {
	// 	        chaincodeId: 'pig-app',
	// 	        txId: tx_id,
	// 	        fcn: 'querySupermarket',
	// 	        args: [key]
	// 		};
	// 		console.log(key);
	// 		console.log("================request===========");
	// 		console.log(request);
	// 	    // send the query proposal to the peer
	// 		return channel.queryByChaincode(request);
	// 	}).then((query_responses) => {
			
	// 		console.log("Query has completed, checking results");
	// 		console.log("loi o day");
	// 	    // query_responses could have more than one  results if there multiple peers were used as targets
	// 	    if (query_responses && query_responses.length == 1) {
	// 	        if (query_responses[0] instanceof Error) {
	// 				console.error("error from query = ", query_responses[0]);
	// 				console.log("send Could not locate pig");
	// 				res.send("Could not locate pig");
		            
	// 	        } else {
	// 	            console.log("Response is ", query_responses[0].toString());
	// 	            res.send(query_responses[0].toString());
	// 	        }
	// 	    } else {
	// 	        console.log("No payloads were returned from query");
	// 	        res.send("Could not locate pig");
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to query successfully :: ' + err);
	// 	    res.send("Could not locate pig");
	// 	});
	// },
	

	//record_farm
	// add_pig: function(req, res){
	// 	console.log("submit recording of a pig: ");

	// 	var array = req.params.pig.split("-");
	// 	console.log(array);

	// 	var key = array[0];
	// 	var farm_account = array[1];
		
	// 	var famer =array[2];
	// 	var species = array[3];
	// 	var food = array[4];
	// 	var sick_cure = array[5];
	// 	var farm_qualified = array[6];
	// 	var farm_location = array[7];
	// 	var start_date_of_farming = array[8];
	// 	var end_date_of_farming = array[9];

		
	// 	var fabric_client = new Fabric_Client();

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);
	// 	var order = fabric_client.newOrderer('grpc://localhost:7050')
	// 	channel.addOrderer(order);

	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // get a transaction id object based on the current user assigned to fabric client
	// 	    tx_id = fabric_client.newTransactionID();
	// 	    console.log("Assigning transaction_id: ", tx_id._transaction_id);

	// 	    // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
	// 	    // send proposal to endorser
	// 	    const request = {
	// 	        //targets : --- letting this default to the peers assigned to the channel
	// 	        chaincodeId: 'pig-app',
	// 	        fcn: 'recordFarm',
	// 	        args: [key, farm_account, famer, species, food, sick_cure, farm_qualified, farm_location, start_date_of_farming, end_date_of_farming],
	// 	        chainId: 'mychannel',
	// 	        txId: tx_id
	// 	    };

	// 	    // send the transaction proposal to the peers
	// 	    return channel.sendTransactionProposal(request);
	// 	}).then((results) => {
	// 		console.log(request);
	// 		var proposalResponses = results[0];
	// 	    var proposal = results[1];
	// 	    let isProposalGood = false;
	// 	    if (proposalResponses && proposalResponses[0].response &&
	// 	        proposalResponses[0].response.status === 200) {
	// 	            isProposalGood = true;
	// 	            console.log('Transaction proposal was good');
	// 	        } else {
	// 	            console.error('Transaction proposal was bad');
	// 	        }
	// 	    if (isProposalGood) {
	// 	        console.log(util.format(
	// 	            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
	// 	            proposalResponses[0].response.status, proposalResponses[0].response.message));

	// 	        // build up the request for the orderer to have the transaction committed
	// 	        var request = {
	// 	            proposalResponses: proposalResponses,
	// 	            proposal: proposal
	// 	        };

	// 	        // set the transaction listener and set a timeout of 30 sec
	// 	        // if the transaction did not get committed within the timeout period,
	// 	        // report a TIMEOUT status
	// 	        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
	// 			var promises = [];
	// 			// console.log("error get id transaction")
	// 			console.log(transaction_id_string);
	// 			var sendPromise = channel.sendTransaction(request);
	// 			// console.log("err sendPromise");
	// 	        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

	// 	        // get an eventhub once the fabric client has a user assigned. The user
	// 	        // is required bacause the event registration must be signed
	// 			// let event_hub = channel.newChannelEventHub(peer);
	// 			// let event_hub = fabric_client.newEventHub();
	// 			// event_hub.setPeerAddr('grpc://localhost:7053');
	// 			let event_hub = channel.newChannelEventHub('localhost:7051');
	// 			// console.log("err event_hub.setPeerAddr");
	// 			console.log(event_hub);

	// 	        // using resolve the promise so that result status may be processed
	// 	        // under the then clause rather than having the catch clause process
	// 	        // the status
	// 	        let txPromise = new Promise((resolve, reject) => {
	// 	            let handle = setTimeout(() => {
	// 	                event_hub.disconnect();
	// 	                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
	// 	            }, 3000);
	// 				event_hub.connect();
	// 				// console.log("err event_hub.connect");
	// 	            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
	// 	                // this is the callback for transaction event status
	// 	                // first some clean up of event listener
	// 	                clearTimeout(handle);
	// 	                event_hub.unregisterTxEvent(transaction_id_string);
	// 	                event_hub.disconnect();

	// 	                // now let the application know what happened
	// 	                var return_status = {event_status : code, tx_id : transaction_id_string};
	// 	                if (code !== 'VALID') {
	// 	                    console.error('The transaction was invalid, code = ' + code);
	// 	                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
	// 	                } else {
	// 						console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
	// 						// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
	// 	                    resolve(return_status);
	// 	                }
	// 	            }, (err) => {
	// 	                //this is the callback if something goes wrong with the event registration or processing
	// 	                reject(new Error('There was a problem with the eventhub ::'+err));
	// 	            });
	// 	        });
	// 			promises.push(txPromise);
	// 			console.log("err promises.push()")
	// 			console.log(promises);
	// 			return Promise.all(promises);
	// 	    } else {
	// 	        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	    }
	// 	}).then((results) => {
	// 	    console.log('Send transaction promise and event listener promise have completed');
	// 	    // check the results in the order the promises were added to the promise all list
	// 	    if (results && results[0] && results[0].status === 'SUCCESS') {
	// 	        console.log('Successfully sent transaction to the orderer.');
	// 	        res.send(tx_id.getTransactionID());
	// 	    } else {
	// 	        console.error('Failed to order the transaction. Error code: ' + response.status);
	// 	    }

	// 	    if(results && results[1] && results[1].event_status === 'VALID') {
	// 	        console.log('Successfully committed the change to the ledger by the peer');
	// 			res.send(tx_id.getTransactionID());
	// 			console.log('Successful');
	// 	    } else {
	// 	        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to invoke successfully :: ' + err);
	// 	});
	// },
	init_chain: function(req, res){
		console.log("-------------------------------------------farm member add info for chain------------------------------------------- ");

		var array = req.params.chain.split("-");
		console.log(array);

		var key = array[0]
		
		var farm_account = array[1]
		var famer = array[2]
		var species = array[3]
		var food = array[4]
		var sick_cure = array[5]
		var farm_qualified = array[6]
		var farm_location = array[7]
		var start_date_of_farming = array[8]
		var end_date_of_farming = array[9]

		var transport_account = array[10]
		var company = array[11];
		var transporter = array[12];
		var vehicle = array[13];
		var transport_trouble_solution = array[14];
		var transport_qualified = array[15];
		var time = array[16];

		var abattoir_account = array[17]
		var abattoir_name = array[18];
		var abattoir_trouble_solution = array[19];
		var abattoir_location = array[20];
		var abattoir_qualified = array[21];
		var peck_time = array[22];

		var supermarket_account = array[23]
		var supermarket_name = array[24];
		var supermarket_trouble_solution = array[25];
		var supermarket_qualified = array[26];
		var price = array[27];
		var quantity_remaining = array[28];
		var manufacturing_date = array[29];
		var expiry_date = array[30];

		
		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);

		    // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
		    // send proposal to endorser
		    const request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'initChain',
				args: [key, farm_account, famer, species, food, sick_cure, farm_qualified, farm_location, start_date_of_farming, end_date_of_farming, transport_account, company, transporter, vehicle, transport_trouble_solution, transport_qualified, time, abattoir_account, abattoir_name, abattoir_trouble_solution, abattoir_location, abattoir_qualified, peck_time, supermarket_account, supermarket_name, supermarket_trouble_solution, supermarket_qualified, price, quantity_remaining, manufacturing_date, expiry_date],
		        chainId: 'mychannel',
		        txId: tx_id
		    };

		    // send the transaction proposal to the peers
		    return channel.sendTransactionProposal(request);
		}).then((results) => {
			console.log(request);
			var proposalResponses = results[0];
		    var proposal = results[1];
		    let isProposalGood = false;
		    if (proposalResponses && proposalResponses[0].response &&
		        proposalResponses[0].response.status === 200) {
		            isProposalGood = true;
		            console.log('Transaction proposal was good');
		        } else {
		            console.error('Transaction proposal was bad');
		        }
		    if (isProposalGood) {
		        console.log(util.format(
		            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		            proposalResponses[0].response.status, proposalResponses[0].response.message));

		        // build up the request for the orderer to have the transaction committed
		        var request = {
		            proposalResponses: proposalResponses,
		            proposal: proposal
		        };

		        // set the transaction listener and set a timeout of 30 sec
		        // if the transaction did not get committed within the timeout period,
		        // report a TIMEOUT status
		        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
				// console.log("error get id transaction")
				console.log(transaction_id_string);
				var sendPromise = channel.sendTransaction(request);
				// console.log("err sendPromise");
		        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

		        // get an eventhub once the fabric client has a user assigned. The user
		        // is required bacause the event registration must be signed
				// let event_hub = channel.newChannelEventHub(peer);
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
				// console.log("err event_hub.setPeerAddr");
				console.log(event_hub);

		        // using resolve the promise so that result status may be processed
		        // under the then clause rather than having the catch clause process
		        // the status
		        let txPromise = new Promise((resolve, reject) => {
		            let handle = setTimeout(() => {
		                event_hub.disconnect();
		                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
		            }, 3000);
					event_hub.connect();
					// console.log("err event_hub.connect");
		            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
		                // this is the callback for transaction event status
		                // first some clean up of event listener
		                clearTimeout(handle);
		                event_hub.unregisterTxEvent(transaction_id_string);
		                event_hub.disconnect();

		                // now let the application know what happened
		                var return_status = {event_status : code, tx_id : transaction_id_string};
		                if (code !== 'VALID') {
		                    console.error('The transaction was invalid, code = ' + code);
		                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
		                } else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
		                    resolve(return_status);
		                }
		            }, (err) => {
		                //this is the callback if something goes wrong with the event registration or processing
		                reject(new Error('There was a problem with the eventhub ::'+err));
		            });
		        });
				promises.push(txPromise);
				console.log("err promises.push()")
				console.log(promises);
				return Promise.all(promises);
		    } else {
		        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		    }
		}).then((results) => {
		    console.log('Send transaction promise and event listener promise have completed');
		    // check the results in the order the promises were added to the promise all list
		    if (results && results[0] && results[0].status === 'SUCCESS') {
		        console.log('Successfully sent transaction to the orderer.');
		        res.send(tx_id.getTransactionID());
		    } else {
		        console.error('Failed to order the transaction. Error code: ' + response.status);
		    }

		    if(results && results[1] && results[1].event_status === 'VALID') {
		        console.log('Successfully committed the change to the ledger by the peer');
				// res.send(tx_id.getTransactionID());
				console.log('Successful');
		    } else {
		        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
		    }
		}).catch((err) => {
		    console.error('Failed to invoke successfully :: ' + err);
		});
	},
	init_chain_farm_add: function(req, res){
		console.log("---------------------------------------------------------------------submit recording of a farm add pig: --------------------------------------");

		var array = req.params.chain.split("-");
		console.log(array);

		var key = array[0]
		
		var farm_account = array[1]
		var famer = array[2]
		var species = array[3]
		var food = array[4]
		var sick_cure = array[5]
		var farm_qualified = array[6]
		var farm_location = array[7]
		var start_date_of_farming = array[8]
		var end_date_of_farming = array[9]

		var transport_account = array[10]
		var company = array[11];
		var transporter = array[12];
		var vehicle = array[13];
		var transport_trouble_solution = array[14];
		var transport_qualified = array[15];
		var time = array[16];

		var abattoir_account = array[17]
		var abattoir_name = array[18];
		var abattoir_trouble_solution = array[19];
		var abattoir_location = array[20];
		var abattoir_qualified = array[21];
		var peck_time = array[22];

		var supermarket_account = array[23]
		var supermarket_name = array[24];
		var supermarket_trouble_solution = array[25];
		var supermarket_qualified = array[26];
		var price = array[27];
		var quantity_remaining = array[28];
		var manufacturing_date = array[29];
		var expiry_date = array[30];

		
		var fabric_client = new Fabric_Client();

		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
		    // assign the store to the fabric client
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    // use the same location for the state store (where the users' certificate are kept)
		    // and the crypto store (where the users' keys are kept)
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    // get the enrolled user from persistence, this user will sign all requests
		    return fabric_client.getUserContext('admin', true);
		}).then((user_from_store) => {
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded admin from persistence');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get admin.... run registerUser.js');
		    }

		    // get a transaction id object based on the current user assigned to fabric client
		    tx_id = fabric_client.newTransactionID();
		    console.log("Assigning transaction_id: ", tx_id._transaction_id);

		    // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
		    // send proposal to endorser
		    const request = {
		        //targets : --- letting this default to the peers assigned to the channel
		        chaincodeId: 'pig-app',
		        fcn: 'initChain',
				args: [key, farm_account, famer, species, food, sick_cure, farm_qualified, farm_location, start_date_of_farming, end_date_of_farming, transport_account, company, transporter, vehicle, transport_trouble_solution, transport_qualified, time, abattoir_account, abattoir_name, abattoir_trouble_solution, abattoir_location, abattoir_qualified, peck_time, supermarket_account, supermarket_name, supermarket_trouble_solution, supermarket_qualified, price, quantity_remaining, manufacturing_date, expiry_date],
		        chainId: 'mychannel',
		        txId: tx_id
		    };

		    // send the transaction proposal to the peers
		    return channel.sendTransactionProposal(request);
		}).then((results) => {
			console.log(request);
			var proposalResponses = results[0];
		    var proposal = results[1];
		    let isProposalGood = false;
		    if (proposalResponses && proposalResponses[0].response &&
		        proposalResponses[0].response.status === 200) {
		            isProposalGood = true;
		            console.log('Transaction proposal was good');
		        } else {
		            console.error('Transaction proposal was bad');
		        }
		    if (isProposalGood) {
		        console.log(util.format(
		            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		            proposalResponses[0].response.status, proposalResponses[0].response.message));

		        // build up the request for the orderer to have the transaction committed
		        var request = {
		            proposalResponses: proposalResponses,
		            proposal: proposal
		        };

		        // set the transaction listener and set a timeout of 30 sec
		        // if the transaction did not get committed within the timeout period,
		        // report a TIMEOUT status
		        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
				// console.log("error get id transaction")
				console.log(transaction_id_string);
				var sendPromise = channel.sendTransaction(request);
				// console.log("err sendPromise");
		        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

		        // get an eventhub once the fabric client has a user assigned. The user
		        // is required bacause the event registration must be signed
				// let event_hub = channel.newChannelEventHub(peer);
				// let event_hub = fabric_client.newEventHub();
				// event_hub.setPeerAddr('grpc://localhost:7053');
				let event_hub = channel.newChannelEventHub('localhost:7051');
				// console.log("err event_hub.setPeerAddr");
				console.log(event_hub);

		        // using resolve the promise so that result status may be processed
		        // under the then clause rather than having the catch clause process
		        // the status
		        let txPromise = new Promise((resolve, reject) => {
		            let handle = setTimeout(() => {
		                event_hub.disconnect();
		                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
		            }, 3000);
					event_hub.connect();
					// console.log("err event_hub.connect");
		            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
		                // this is the callback for transaction event status
		                // first some clean up of event listener
		                clearTimeout(handle);
		                event_hub.unregisterTxEvent(transaction_id_string);
		                event_hub.disconnect();

		                // now let the application know what happened
		                var return_status = {event_status : code, tx_id : transaction_id_string};
		                if (code !== 'VALID') {
		                    console.error('The transaction was invalid, code = ' + code);
		                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
		                } else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
		                    resolve(return_status);
		                }
		            }, (err) => {
		                //this is the callback if something goes wrong with the event registration or processing
		                reject(new Error('There was a problem with the eventhub ::'+err));
		            });
		        });
				promises.push(txPromise);
				console.log("err promises.push()")
				console.log(promises);
				return Promise.all(promises);
		    } else {
		        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		    }
		}).then((results) => {
		    console.log('Send transaction promise and event listener promise have completed');
		    // check the results in the order the promises were added to the promise all list
		    if (results && results[0] && results[0].status === 'SUCCESS') {
		        console.log('Successfully sent transaction to the orderer.');
		        res.send(tx_id.getTransactionID());
		    } else {
		        console.error('Failed to order the transaction. Error code: ' + response.status);
		    }

		    if(results && results[1] && results[1].event_status === 'VALID') {
		        console.log('Successfully committed the change to the ledger by the peer');
				// res.send(tx_id.getTransactionID());
				console.log('Successful');
		    } else {
		        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
		    }
		}).catch((err) => {
		    console.error('Failed to invoke successfully :: ' + err);
		});
	},
	// init_chain_transport_add: function(req, res){
	// 	console.log("submit recording of a transport add: ");

	// 	var array = req.params.chain.split("-");
	// 	console.log(array);

	// 	var key = array[0]
		
	// 	var farm_account = array[1]
	// 	var famer = array[2]
	// 	var species = array[3]
	// 	var food = array[4]
	// 	var sick_cure = array[5]
	// 	var farm_qualified = array[6]
	// 	var farm_location = array[7]
	// 	var start_date_of_farming = array[8]
	// 	var end_date_of_farming = array[9]

	// 	var transport_account = array[10]
	// 	var company = array[11];
	// 	var transporter = array[12];
	// 	var vehicle = array[13];
	// 	var trouble = array[14];
	// 	var solution = array[15];
	// 	var transport_qualified = array[16];
	// 	var time = array[17];

	// 	var abattoir_account = array[18]
	// 	var abattoir_name = array[19];
	// 	var abattoir_location = array[20];
	// 	var abattoir_qualified = array[21];
	// 	var peck_time = array[22];

	// 	var supermarket_account = array[23]
	// 	var supermarket_name = array[24];
	// 	var supermarket_qualified = array[25];
	// 	var price = array[26];
	// 	var quantity_remaining = array[27];
	// 	var manufacturing_date = array[28];
	// 	var expiry_date = array[29];

		
	// 	var fabric_client = new Fabric_Client();

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);
	// 	var order = fabric_client.newOrderer('grpc://localhost:7050')
	// 	channel.addOrderer(order);

	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // get a transaction id object based on the current user assigned to fabric client
	// 	    tx_id = fabric_client.newTransactionID();
	// 	    console.log("Assigning transaction_id: ", tx_id._transaction_id);

	// 	    // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
	// 	    // send proposal to endorser
	// 	    const request = {
	// 	        //targets : --- letting this default to the peers assigned to the channel
	// 	        chaincodeId: 'pig-app',
	// 	        fcn: 'initChain',
	// 			args: [key, farm_account, famer, species, food, sick_cure, farm_qualified, farm_location, start_date_of_farming, end_date_of_farming, transport_account, company, transporter, vehicle, trouble, solution, transport_qualified, time, abattoir_account, abattoir_name, abattoir_location, abattoir_qualified, peck_time, supermarket_account, supermarket_name, supermarket_qualified, price, quantity_remaining, manufacturing_date, expiry_date],
	// 	        chainId: 'mychannel',
	// 	        txId: tx_id
	// 	    };

	// 	    // send the transaction proposal to the peers
	// 	    return channel.sendTransactionProposal(request);
	// 	}).then((results) => {
	// 		console.log(request);
	// 		var proposalResponses = results[0];
	// 	    var proposal = results[1];
	// 	    let isProposalGood = false;
	// 	    if (proposalResponses && proposalResponses[0].response &&
	// 	        proposalResponses[0].response.status === 200) {
	// 	            isProposalGood = true;
	// 	            console.log('Transaction proposal was good');
	// 	        } else {
	// 	            console.error('Transaction proposal was bad');
	// 	        }
	// 	    if (isProposalGood) {
	// 	        console.log(util.format(
	// 	            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
	// 	            proposalResponses[0].response.status, proposalResponses[0].response.message));

	// 	        // build up the request for the orderer to have the transaction committed
	// 	        var request = {
	// 	            proposalResponses: proposalResponses,
	// 	            proposal: proposal
	// 	        };

	// 	        // set the transaction listener and set a timeout of 30 sec
	// 	        // if the transaction did not get committed within the timeout period,
	// 	        // report a TIMEOUT status
	// 	        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
	// 			var promises = [];
	// 			// console.log("error get id transaction")
	// 			console.log(transaction_id_string);
	// 			var sendPromise = channel.sendTransaction(request);
	// 			// console.log("err sendPromise");
	// 	        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

	// 	        // get an eventhub once the fabric client has a user assigned. The user
	// 	        // is required bacause the event registration must be signed
	// 			// let event_hub = channel.newChannelEventHub(peer);
	// 			// let event_hub = fabric_client.newEventHub();
	// 			// event_hub.setPeerAddr('grpc://localhost:7053');
	// 			let event_hub = channel.newChannelEventHub('localhost:7051');
	// 			// console.log("err event_hub.setPeerAddr");
	// 			console.log(event_hub);

	// 	        // using resolve the promise so that result status may be processed
	// 	        // under the then clause rather than having the catch clause process
	// 	        // the status
	// 	        let txPromise = new Promise((resolve, reject) => {
	// 	            let handle = setTimeout(() => {
	// 	                event_hub.disconnect();
	// 	                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
	// 	            }, 3000);
	// 				event_hub.connect();
	// 				// console.log("err event_hub.connect");
	// 	            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
	// 	                // this is the callback for transaction event status
	// 	                // first some clean up of event listener
	// 	                clearTimeout(handle);
	// 	                event_hub.unregisterTxEvent(transaction_id_string);
	// 	                event_hub.disconnect();

	// 	                // now let the application know what happened
	// 	                var return_status = {event_status : code, tx_id : transaction_id_string};
	// 	                if (code !== 'VALID') {
	// 	                    console.error('The transaction was invalid, code = ' + code);
	// 	                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
	// 	                } else {
	// 						console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
	// 						// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
	// 	                    resolve(return_status);
	// 	                }
	// 	            }, (err) => {
	// 	                //this is the callback if something goes wrong with the event registration or processing
	// 	                reject(new Error('There was a problem with the eventhub ::'+err));
	// 	            });
	// 	        });
	// 			promises.push(txPromise);
	// 			console.log("err promises.push()")
	// 			console.log(promises);
	// 			return Promise.all(promises);
	// 	    } else {
	// 	        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	    }
	// 	}).then((results) => {
	// 	    console.log('Send transaction promise and event listener promise have completed');
	// 	    // check the results in the order the promises were added to the promise all list
	// 	    if (results && results[0] && results[0].status === 'SUCCESS') {
	// 	        console.log('Successfully sent transaction to the orderer.');
	// 	        res.send(tx_id.getTransactionID());
	// 	    } else {
	// 	        console.error('Failed to order the transaction. Error code: ' + response.status);
	// 	    }

	// 	    if(results && results[1] && results[1].event_status === 'VALID') {
	// 	        console.log('Successfully committed the change to the ledger by the peer');
	// 			// res.send(tx_id.getTransactionID());
	// 			console.log('Successful');
	// 	    } else {
	// 	        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to invoke successfully :: ' + err);
	// 	});
	// },
	// insert_transport: function(req, res){
	// 	console.log("changing transport: ");
		
	// 	var array = req.params.transport.split("-");
	// 	console.log(array);
	// 	var key = array[0];
	// 	var transport_account = array[1]
	// 	var company = array[2];
	// 	var transporter = array[3];
	// 	var vehicle = array[4];
	// 	var trouble = array[5];
	// 	var solution = array[6];
	// 	var transport_qualified = array[7];
	// 	var time = array[8];

	// 	var fabric_client = new Fabric_Client();

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);
	// 	var order = fabric_client.newOrderer('grpc://localhost:7050')
	// 	channel.addOrderer(order);

	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // get a transaction id object based on the current user assigned to fabric client
	// 	    tx_id = fabric_client.newTransactionID();
	// 	    console.log("Assigning transaction_id: ", tx_id._transaction_id);
	// 		console.log(tx_id);
	// 	    // insertFarm - requires 8 args 
	// 	    // send proposal to endorser
	// 	    var request = {
	// 	        //targets : --- letting this default to the peers assigned to the channel
	// 	        chaincodeId: 'pig-app',
	// 	        fcn: 'insertTransport',
	// 	        args: [key, transport_account, company, transporter, vehicle, trouble, solution, transport_qualified, time],
	// 	        chainId: 'mychannel',
	// 	        txId: tx_id
	// 	    };
	// 		console.log(request);
	// 	    // send the transaction proposal to the peers
	// 		return channel.sendTransactionProposal(request);
			
	// 	}).then((results) => {
			
	// 		var proposalResponses = results[0];
	// 		console.log(proposalResponses);
	// 	    var proposal = results[1];
	// 	    let isProposalGood = false;
	// 	    if (proposalResponses && proposalResponses[0].response &&
	// 	        proposalResponses[0].response.status === 200) {
	// 	            isProposalGood = true;
	// 	            console.log('Transaction proposal was good');
	// 	        } else {
	// 	            console.error('Transaction proposal was bad');
	// 	        }
	// 	    if (isProposalGood) {
	// 	        console.log(util.format(
	// 	            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
	// 	            proposalResponses[0].response.status, proposalResponses[0].response.message));

	// 	        // build up the request for the orderer to have the transaction committed
	// 	        var request = {
	// 	            proposalResponses: proposalResponses,
	// 	            proposal: proposal
	// 	        };

	// 	        // set the transaction listener and set a timeout of 30 sec
	// 	        // if the transaction did not get committed within the timeout period,
	// 	        // report a TIMEOUT status
	// 	        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
	// 	        var promises = [];

	// 	        var sendPromise = channel.sendTransaction(request);
	// 	        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

	// 	        // get an eventhub once the fabric client has a user assigned. The user
	// 	        // is required bacause the event registration must be signed
	// 	        // let event_hub = fabric_client.newEventHub();
	// 			// event_hub.setPeerAddr('grpc://localhost:7053');
	// 			let event_hub = channel.newChannelEventHub('localhost:7051');

	// 	        // using resolve the promise so that result status may be processed
	// 	        // under the then clause rather than having the catch clause process
	// 	        // the status
	// 	        let txPromise = new Promise((resolve, reject) => {
	// 	            let handle = setTimeout(() => {
	// 	                event_hub.disconnect();
	// 	                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
	// 	            }, 3000);
	// 	            event_hub.connect();
	// 	            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
	// 	                // this is the callback for transaction event status
	// 	                // first some clean up of event listener
	// 	                clearTimeout(handle);
	// 	                event_hub.unregisterTxEvent(transaction_id_string);
	// 	                event_hub.disconnect();

	// 	                // now let the application know what happened
	// 	                var return_status = {event_status : code, tx_id : transaction_id_string};
	// 	                if (code !== 'VALID') {
	// 	                    console.error('The transaction was invalid, code = ' + code);
	// 	                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
	// 	                } else {
	// 						console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());

	// 						// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
	// 	                    resolve(return_status);
	// 	                }
	// 	            }, (err) => {
	// 	                //this is the callback if something goes wrong with the event registration or processing
	// 	                reject(new Error('There was a problem with the eventhub ::'+err));
	// 	            });
	// 	        });
	// 	        promises.push(txPromise);

	// 	        return Promise.all(promises);
	// 	    } else {
	// 	        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	        res.send("Error: no transport found");
	// 	        // throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	    }
	// 	}).then((results) => {
	// 	    console.log('Send transaction promise and event listener promise have completed');
	// 	    // check the results in the order the promises were added to the promise all list
	// 	    if (results && results[0] && results[0].status === 'SUCCESS') {
	// 	        console.log('Successfully sent transaction to the orderer.');
	// 	        res.json(tx_id.getTransactionID())
	// 	    } else {
	// 	        console.error('Failed to order the transaction. Error code: ' + response.status);
	// 	        res.send("Error: no transport found");
	// 	    }

	// 	    if(results && results[1] && results[1].event_status === 'VALID') {
	// 	        console.log('Successfully committed the change to the ledger by the peer');
	// 			// res.json(tx_id.getTransactionID())
	// 			console.log('Successfull');
	// 	    } else {
	// 	        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to invoke successfully :: ' + err);
	// 	    res.send("Error: no transport found");
	// 	});

	// },
	// insert_abattoir: function(req, res){
	// 	console.log("changing abattoir: ");
		
	// 	var array = req.params.abattoir.split("-");
	// 	console.log(array);
	// 	var key = array[0];
	// 	var abattoir_account = array[1]
	// 	var abattoir_name = array[2];
	// 	var abattoir_location = array[3];
	// 	var abattoir_qualified = array[4];
	// 	var peck_time = array[5];

	// 	var fabric_client = new Fabric_Client();

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);
	// 	var order = fabric_client.newOrderer('grpc://localhost:7050')
	// 	channel.addOrderer(order);

	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // get a transaction id object based on the current user assigned to fabric client
	// 	    tx_id = fabric_client.newTransactionID();
	// 	    console.log("Assigning transaction_id: ", tx_id._transaction_id);
	// 		console.log(tx_id);
	// 	    // insertFarm - requires 8 args 
	// 	    // send proposal to endorser
	// 	    var request = {
	// 	        //targets : --- letting this default to the peers assigned to the channel
	// 	        chaincodeId: 'pig-app',
	// 	        fcn: 'insertAbattoir',
	// 	        args: [key, abattoir_account, abattoir_name, abattoir_location, abattoir_qualified, peck_time],
	// 	        chainId: 'mychannel',
	// 	        txId: tx_id
	// 	    };
	// 		console.log(request);
	// 	    // send the transaction proposal to the peers
	// 		return channel.sendTransactionProposal(request);
			
	// 	}).then((results) => {
			
	// 		var proposalResponses = results[0];
	// 		console.log(proposalResponses);
	// 	    var proposal = results[1];
	// 	    let isProposalGood = false;
	// 	    if (proposalResponses && proposalResponses[0].response &&
	// 	        proposalResponses[0].response.status === 200) {
	// 	            isProposalGood = true;
	// 	            console.log('Transaction proposal was good');
	// 	        } else {
	// 	            console.error('Transaction proposal was bad');
	// 	        }
	// 	    if (isProposalGood) {
	// 	        console.log(util.format(
	// 	            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
	// 	            proposalResponses[0].response.status, proposalResponses[0].response.message));

	// 	        // build up the request for the orderer to have the transaction committed
	// 	        var request = {
	// 	            proposalResponses: proposalResponses,
	// 	            proposal: proposal
	// 	        };

	// 	        // set the transaction listener and set a timeout of 30 sec
	// 	        // if the transaction did not get committed within the timeout period,
	// 	        // report a TIMEOUT status
	// 	        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
	// 	        var promises = [];

	// 	        var sendPromise = channel.sendTransaction(request);
	// 	        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

	// 	        // get an eventhub once the fabric client has a user assigned. The user
	// 	        // is required bacause the event registration must be signed
	// 	        // let event_hub = fabric_client.newEventHub();
	// 			// event_hub.setPeerAddr('grpc://localhost:7053');
	// 			let event_hub = channel.newChannelEventHub('localhost:7051');

	// 	        // using resolve the promise so that result status may be processed
	// 	        // under the then clause rather than having the catch clause process
	// 	        // the status
	// 	        let txPromise = new Promise((resolve, reject) => {
	// 	            let handle = setTimeout(() => {
	// 	                event_hub.disconnect();
	// 	                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
	// 	            }, 3000);
	// 	            event_hub.connect();
	// 	            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
	// 	                // this is the callback for transaction event status
	// 	                // first some clean up of event listener
	// 	                clearTimeout(handle);
	// 	                event_hub.unregisterTxEvent(transaction_id_string);
	// 	                event_hub.disconnect();

	// 	                // now let the application know what happened
	// 	                var return_status = {event_status : code, tx_id : transaction_id_string};
	// 	                if (code !== 'VALID') {
	// 	                    console.error('The transaction was invalid, code = ' + code);
	// 	                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
	// 	                } else {
	// 						console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());

	// 						// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
	// 	                    resolve(return_status);
	// 	                }
	// 	            }, (err) => {
	// 	                //this is the callback if something goes wrong with the event registration or processing
	// 	                reject(new Error('There was a problem with the eventhub ::'+err));
	// 	            });
	// 	        });
	// 	        promises.push(txPromise);

	// 	        return Promise.all(promises);
	// 	    } else {
	// 	        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	        res.send("Error: no abattoir found");
	// 	        // throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	    }
	// 	}).then((results) => {
	// 	    console.log('Send transaction promise and event listener promise have completed');
	// 	    // check the results in the order the promises were added to the promise all list
	// 	    if (results && results[0] && results[0].status === 'SUCCESS') {
	// 	        console.log('Successfully sent transaction to the orderer.');
	// 	        res.json(tx_id.getTransactionID())
	// 	    } else {
	// 	        console.error('Failed to order the transaction. Error code: ' + response.status);
	// 	        res.send("Error: no abattoir found");
	// 	    }

	// 	    if(results && results[1] && results[1].event_status === 'VALID') {
	// 	        console.log('Successfully committed the change to the ledger by the peer');
	// 			// res.json(tx_id.getTransactionID())
	// 			console.log('Successfull');
	// 	    } else {
	// 	        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to invoke successfully :: ' + err);
	// 	    res.send("Error: no abattoir found");
	// 	});

	// },
	// insert_supermarket: function(req, res){
	// 	console.log("changing supermarket: ");
		
	// 	var array = req.params.supermarket.split("-");
	// 	console.log(array);
	// 	var key = array[0];
	// 	var supermarket_account = array[1]
	// 	var supermarket_name = array[2];
	// 	var supermarket_qualified = array[3];
	// 	var price = array[4];
	// 	var quantity_remaining = array[5];
	// 	var manufacturing_date = array[6];
	// 	var expiry_date = array[7];

	// 	var fabric_client = new Fabric_Client();

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);
	// 	var order = fabric_client.newOrderer('grpc://localhost:7050')
	// 	channel.addOrderer(order);

	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // get a transaction id object based on the current user assigned to fabric client
	// 	    tx_id = fabric_client.newTransactionID();
	// 	    console.log("Assigning transaction_id: ", tx_id._transaction_id);
	// 		console.log(tx_id);
	// 	    // insertFarm - requires 8 args 
	// 	    // send proposal to endorser
	// 	    var request = {
	// 	        //targets : --- letting this default to the peers assigned to the channel
	// 	        chaincodeId: 'pig-app',
	// 	        fcn: 'insertSupermarket',
	// 	        args: [key, supermarket_account, supermarket_name, supermarket_qualified, price, quantity_remaining, manufacturing_date, expiry_date],
	// 	        chainId: 'mychannel',
	// 	        txId: tx_id
	// 	    };
	// 		console.log(request);
	// 	    // send the transaction proposal to the peers
	// 		return channel.sendTransactionProposal(request);
			
	// 	}).then((results) => {
			
	// 		var proposalResponses = results[0];
	// 		console.log(proposalResponses);
	// 	    var proposal = results[1];
	// 	    let isProposalGood = false;
	// 	    if (proposalResponses && proposalResponses[0].response &&
	// 	        proposalResponses[0].response.status === 200) {
	// 	            isProposalGood = true;
	// 	            console.log('Transaction proposal was good');
	// 	        } else {
	// 	            console.error('Transaction proposal was bad');
	// 	        }
	// 	    if (isProposalGood) {
	// 	        console.log(util.format(
	// 	            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
	// 	            proposalResponses[0].response.status, proposalResponses[0].response.message));

	// 	        // build up the request for the orderer to have the transaction committed
	// 	        var request = {
	// 	            proposalResponses: proposalResponses,
	// 	            proposal: proposal
	// 	        };

	// 	        // set the transaction listener and set a timeout of 30 sec
	// 	        // if the transaction did not get committed within the timeout period,
	// 	        // report a TIMEOUT status
	// 	        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
	// 	        var promises = [];

	// 	        var sendPromise = channel.sendTransaction(request);
	// 	        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

	// 	        // get an eventhub once the fabric client has a user assigned. The user
	// 	        // is required bacause the event registration must be signed
	// 	        // let event_hub = fabric_client.newEventHub();
	// 			// event_hub.setPeerAddr('grpc://localhost:7053');
	// 			let event_hub = channel.newChannelEventHub('localhost:7051');

	// 	        // using resolve the promise so that result status may be processed
	// 	        // under the then clause rather than having the catch clause process
	// 	        // the status
	// 	        let txPromise = new Promise((resolve, reject) => {
	// 	            let handle = setTimeout(() => {
	// 	                event_hub.disconnect();
	// 	                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
	// 	            }, 3000);
	// 	            event_hub.connect();
	// 	            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
	// 	                // this is the callback for transaction event status
	// 	                // first some clean up of event listener
	// 	                clearTimeout(handle);
	// 	                event_hub.unregisterTxEvent(transaction_id_string);
	// 	                event_hub.disconnect();

	// 	                // now let the application know what happened
	// 	                var return_status = {event_status : code, tx_id : transaction_id_string};
	// 	                if (code !== 'VALID') {
	// 	                    console.error('The transaction was invalid, code = ' + code);
	// 	                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
	// 	                } else {
	// 						console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
	// 						// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
	// 	                    resolve(return_status);
	// 	                }
	// 	            }, (err) => {
	// 	                //this is the callback if something goes wrong with the event registration or processing
	// 	                reject(new Error('There was a problem with the eventhub ::'+err));
	// 	            });
	// 	        });
	// 	        promises.push(txPromise);

	// 	        return Promise.all(promises);
	// 	    } else {
	// 	        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	        res.send("Error: no supermarket found");
	// 	        // throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	    }
	// 	}).then((results) => {
	// 	    console.log('Send transaction promise and event listener promise have completed');
	// 	    // check the results in the order the promises were added to the promise all list
	// 	    if (results && results[0] && results[0].status === 'SUCCESS') {
	// 	        console.log('Successfully sent transaction to the orderer.');
	// 	        res.json(tx_id.getTransactionID())
	// 	    } else {
	// 	        console.error('Failed to order the transaction. Error code: ' + response.status);
	// 	        res.send("Error: no supermarket found");
	// 	    }

	// 	    if(results && results[1] && results[1].event_status === 'VALID') {
	// 	        console.log('Successfully committed the change to the ledger by the peer');
	// 			// res.json(tx_id.getTransactionID())
	// 			console.log('Successfull');
	// 	    } else {
	// 	        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to invoke successfully :: ' + err);
	// 	    res.send("Error: no supermarket found");
	// 	});

	// },
	// get_tuna_history: function (req, res) {

	// 	var fabric_client = new Fabric_Client();
	// 	var key = req.params.id

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);

	// 	//
	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:' + store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({
	// 		path: store_path
	// 	}).then((state_store) => {
	// 		// assign the store to the fabric client
	// 		fabric_client.setStateStore(state_store);
	// 		var crypto_suite = Fabric_Client.newCryptoSuite();
	// 		// use the same location for the state store (where the users' certificate are kept)
	// 		// and the crypto store (where the users' keys are kept)
	// 		var crypto_store = Fabric_Client.newCryptoKeyStore({
	// 			path: store_path
	// 		});
	// 		crypto_suite.setCryptoKeyStore(crypto_store);
	// 		fabric_client.setCryptoSuite(crypto_suite);

	// 		// get the enrolled user from persistence, this user will sign all requests
	// 		return fabric_client.getUserContext('user1', true);
	// 	}).then((user_from_store) => {
	// 		if (user_from_store && user_from_store.isEnrolled()) {
	// 			console.log('Successfully loaded user1 from persistence');
	// 			member_user = user_from_store;
	// 		} else {
	// 			throw new Error('Failed to get user1.... run registerUser.js');
	// 		}

	// 		// queryTuna - requires 1 argument, ex: args: ['4'],
	// 		const request = {
	// 			chaincodeId: 'tuna-app',
	// 			txId: tx_id,
	// 			fcn: 'queryTunaHistory',
	// 			args: [key]
	// 		};

	// 		// send the query proposal to the peer
	// 		return channel.queryByChaincode(request);
	// 	}).then((query_responses) => {
	// 		console.log("Query has completed, checking results");
	// 		console.log("Full result" + query_responses);
	// 		// query_responses could have more than one  results if there multiple peers were used as targets
	// 		if (query_responses && query_responses.length == 1) {
	// 			if (query_responses[0] instanceof Error) {
	// 				console.error("error from query = ", query_responses[0]);
	// 				res.send("Could not locate tuna")

	// 			} else {
	// 				console.log("Response is ", query_responses[0].toString());
	// 				res.send(query_responses[0].toString())
	// 			}
	// 		} else {
	// 			console.log("No payloads were returned from query");
	// 			res.send("Could not locate tuna")
	// 		}
	// 	}).catch((err) => {
	// 		console.error('Failed to query successfully :: ' + err);
	// 		res.send("Could not locate tuna")
	// 	});
		

	// },
	// add_transport: function(req, res){
	// 	console.log("submit recording of a transport: ");

	// 	var array = req.params.pig.split("-");
	// 	console.log(array);

	// 	var key = array[0]
	// 	var transport_account = array[1]
	// 	var company = array[2]
	// 	var transporter = array[3]
	// 	var vehicle = array[4]
	// 	var trouble = array[5]
	// 	var solution = array[6]
	// 	var transport_qualified = array[7]
	// 	var time = array[8]


	// 	var fabric_client = new Fabric_Client();

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);
	// 	var order = fabric_client.newOrderer('grpc://localhost:7050')
	// 	channel.addOrderer(order);

	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // get a transaction id object based on the current user assigned to fabric client
	// 	    tx_id = fabric_client.newTransactionID();
	// 	    console.log("Assigning transaction_id: ", tx_id._transaction_id);

	// 	    // recordTuna - requires 8 args 
	// 	    // send proposal to endorser
	// 	    const request = {
	// 	        //targets : --- letting this default to the peers assigned to the channel
	// 	        chaincodeId: 'pig-app',
	// 	        fcn: 'recordTransport',
	// 	        args: [key, transport_account, company, transporter, vehicle, trouble, solution, transport_qualified, time],
	// 	        chainId: 'mychannel',
	// 	        txId: tx_id
	// 	    };
	// 		console.log(request);
	// 	    // send the transaction proposal to the peers
	// 		return channel.sendTransactionProposal(request);
	// 	}).then((results) => {
	// 		var proposalResponses = results[0];
	// 		console.log(results[0]);
	// 		var proposal = results[1];
	// 		console.log('r1');
	// 		console.log(results[1]);
	// 		let isProposalGood = false;
	// 		console.log(request);
    // 		console.log("okokokok");
	// 	    if (proposalResponses && proposalResponses[0].response &&
	// 	        proposalResponses[0].response.status === 200) {
	// 	            isProposalGood = true;
	// 	            console.log('Transaction proposal was good');
	// 	        } else {
	// 	            console.error('Transaction proposal was bad');
	// 	        }
	// 	    if (isProposalGood) {
	// 	        console.log(util.format(
	// 	            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
	// 	            proposalResponses[0].response.status, proposalResponses[0].response.message));

	// 	        // build up the request for the orderer to have the transaction committed
	// 	        var request = {
	// 	            proposalResponses: proposalResponses,
	// 	            proposal: proposal
	// 	        };

	// 	        // set the transaction listener and set a timeout of 30 sec
	// 	        // if the transaction did not get committed within the timeout period,
	// 	        // report a TIMEOUT status
	// 	        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
	// 			var promises = [];
	// 			console.log("error get id transaction")
	// 			console.log(transaction_id_string);
	// 	        var sendPromise = channel.sendTransaction(request);
	// 	        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

	// 	        // get an eventhub once the fabric client has a user assigned. The user
	// 	        // is required bacause the event registration must be signed
	// 	        let event_hub = fabric_client.newEventHub();
	// 	        event_hub.setPeerAddr('grpc://localhost:7053');

	// 	        // using resolve the promise so that result status may be processed
	// 	        // under the then clause rather than having the catch clause process
	// 	        // the status
	// 	        let txPromise = new Promise((resolve, reject) => {
	// 	            let handle = setTimeout(() => {
	// 	                event_hub.disconnect();
	// 	                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
	// 	            }, 3000);
	// 	            event_hub.connect();
	// 	            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
	// 	                // this is the callback for transaction event status
	// 	                // first some clean up of event listener
	// 	                clearTimeout(handle);
	// 	                event_hub.unregisterTxEvent(transaction_id_string);
	// 	                event_hub.disconnect();

	// 	                // now let the application know what happened
	// 	                var return_status = {event_status : code, tx_id : transaction_id_string};
	// 	                if (code !== 'VALID') {
	// 	                    console.error('The transaction was invalid, code = ' + code);
	// 	                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
	// 	                } else {
	// 	                    console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
	// 	                    resolve(return_status);
	// 	                }
	// 	            }, (err) => {
	// 	                //this is the callback if something goes wrong with the event registration or processing
	// 	                reject(new Error('There was a problem with the eventhub ::'+err));
	// 	            });
	// 	        });
	// 	        promises.push(txPromise);

	// 	        return Promise.all(promises);
	// 	    } else {
	// 	        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	    }
	// 	}).then((results) => {
	// 	    console.log('Send transaction promise and event listener promise have completed');
	// 	    // check the results in the order the promises were added to the promise all list
	// 	    if (results && results[0] && results[0].status === 'SUCCESS') {
	// 	        console.log('Successfully sent transaction to the orderer.');
	// 	        res.send(tx_id.getTransactionID());
	// 	    } else {
	// 	        console.error('Failed to order the transaction. Error code: ' + response.status);
	// 	    }

	// 	    if(results && results[1] && results[1].event_status === 'VALID') {
	// 	        console.log('Successfully committed the change to the ledger by the peer');
	// 	        res.send(tx_id.getTransactionID());
	// 	    } else {
	// 	        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to invoke successfully :: ' + err);
	// 	});
	// },
	
	// get_tuna: function(req, res){

	// 	var fabric_client = new Fabric_Client();
	// 	var key = req.params.id

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);

	// 	//
	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // queryTuna - requires 1 argument, ex: args: ['4'],
	// 	    const request = {
	// 	        chaincodeId: 'pig-app',
	// 	        txId: tx_id,
	// 	        fcn: 'queryTuna',
	// 	        args: [key]
	// 	    };

	// 	    // send the query proposal to the peer
	// 	    return channel.queryByChaincode(request);
	// 	}).then((query_responses) => {
	// 	    console.log("Query has completed, checking results");
	// 	    // query_responses could have more than one  results if there multiple peers were used as targets
	// 	    if (query_responses && query_responses.length == 1) {
	// 	        if (query_responses[0] instanceof Error) {
	// 	            console.error("error from query = ", query_responses[0]);
	// 	            res.send("Could not locate tuna")
		            
	// 	        } else {
	// 	            console.log("Response is ", query_responses[0].toString());
	// 	            res.send(query_responses[0].toString())
	// 	        }
	// 	    } else {
	// 	        console.log("No payloads were returned from query");
	// 	        res.send("Could not locate tuna")
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to query successfully :: ' + err);
	// 	    res.send("Could not locate tuna")
	// 	});
	// },
	// insert_farm: function(req, res){
	// 	console.log("changing farm: ");
		
	// 	var array = req.params.farm.split("-");
	// 	console.log(array);
	// 	var key = array[0];
	// 	var farm_account = array[1]
	// 	var famer = array[2];
	// 	var species = array[3];
	// 	var food = array[4];
	// 	var sick_cure = array[5];
	// 	var farm_qualified = array[6];
	// 	var farm_location = array[7]
	// 	var start_date_of_farming = array[8];
	// 	var end_date_of_farming = array[9];

	// 	var fabric_client = new Fabric_Client();

	// 	// setup the fabric network
	// 	var channel = fabric_client.newChannel('mychannel');
	// 	var peer = fabric_client.newPeer('grpc://localhost:7051');
	// 	channel.addPeer(peer);
	// 	var order = fabric_client.newOrderer('grpc://localhost:7050')
	// 	channel.addOrderer(order);

	// 	var member_user = null;
	// 	var store_path = path.join(os.homedir(), '.hfc-key-store');
	// 	console.log('Store path:'+store_path);
	// 	var tx_id = null;

	// 	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	// 	Fabric_Client.newDefaultKeyValueStore({ path: store_path
	// 	}).then((state_store) => {
	// 	    // assign the store to the fabric client
	// 	    fabric_client.setStateStore(state_store);
	// 	    var crypto_suite = Fabric_Client.newCryptoSuite();
	// 	    // use the same location for the state store (where the users' certificate are kept)
	// 	    // and the crypto store (where the users' keys are kept)
	// 	    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	// 	    crypto_suite.setCryptoKeyStore(crypto_store);
	// 	    fabric_client.setCryptoSuite(crypto_suite);

	// 	    // get the enrolled user from persistence, this user will sign all requests
	// 	    return fabric_client.getUserContext('admin', true);
	// 	}).then((user_from_store) => {
	// 	    if (user_from_store && user_from_store.isEnrolled()) {
	// 	        console.log('Successfully loaded admin from persistence');
	// 	        member_user = user_from_store;
	// 	    } else {
	// 	        throw new Error('Failed to get admin.... run registerUser.js');
	// 	    }

	// 	    // get a transaction id object based on the current user assigned to fabric client
	// 	    tx_id = fabric_client.newTransactionID();
	// 	    console.log("Assigning transaction_id: ", tx_id._transaction_id);
	// 		console.log(tx_id);
	// 	    // changeTunaHolder - requires 2 args , ex: args: ['1', 'Barry'],
	// 	    // send proposal to endorser
	// 	    var request = {
	// 	        //targets : --- letting this default to the peers assigned to the channel
	// 	        chaincodeId: 'pig-app',
	// 	        fcn: 'insertFarm',
	// 	        args: [key, farm_account, famer, species, food, sick_cure, farm_qualified, farm_location, start_date_of_farming, end_date_of_farming],
	// 	        chainId: 'mychannel',
	// 	        txId: tx_id
	// 	    };
	// 		console.log(request);
	// 	    // send the transaction proposal to the peers
	// 		return channel.sendTransactionProposal(request);
			
	// 	}).then((results) => {
			
	// 		var proposalResponses = results[0];
	// 		console.log(proposalResponses);
	// 	    var proposal = results[1];
	// 	    let isProposalGood = false;
	// 	    if (proposalResponses && proposalResponses[0].response &&
	// 	        proposalResponses[0].response.status === 200) {
	// 	            isProposalGood = true;
	// 	            console.log('Transaction proposal was good');
	// 	        } else {
	// 	            console.error('Transaction proposal was bad');
	// 	        }
	// 	    if (isProposalGood) {
	// 	        console.log(util.format(
	// 	            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
	// 	            proposalResponses[0].response.status, proposalResponses[0].response.message));

	// 	        // build up the request for the orderer to have the transaction committed
	// 	        var request = {
	// 	            proposalResponses: proposalResponses,
	// 	            proposal: proposal
	// 	        };

	// 	        // set the transaction listener and set a timeout of 30 sec
	// 	        // if the transaction did not get committed within the timeout period,
	// 	        // report a TIMEOUT status
	// 	        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
	// 	        var promises = [];

	// 	        var sendPromise = channel.sendTransaction(request);
	// 	        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

	// 	        // get an eventhub once the fabric client has a user assigned. The user
	// 	        // is required bacause the event registration must be signed
	// 	        // let event_hub = fabric_client.newEventHub();
	// 			// event_hub.setPeerAddr('grpc://localhost:7053');
	// 			let event_hub = channel.newChannelEventHub('localhost:7051');

	// 	        // using resolve the promise so that result status may be processed
	// 	        // under the then clause rather than having the catch clause process
	// 	        // the status
	// 	        let txPromise = new Promise((resolve, reject) => {
	// 	            let handle = setTimeout(() => {
	// 	                event_hub.disconnect();
	// 	                resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
	// 	            }, 3000);
	// 	            event_hub.connect();
	// 	            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
	// 	                // this is the callback for transaction event status
	// 	                // first some clean up of event listener
	// 	                clearTimeout(handle);
	// 	                event_hub.unregisterTxEvent(transaction_id_string);
	// 	                event_hub.disconnect();

	// 	                // now let the application know what happened
	// 	                var return_status = {event_status : code, tx_id : transaction_id_string};
	// 	                if (code !== 'VALID') {
	// 	                    console.error('The transaction was invalid, code = ' + code);
	// 	                    resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
	// 	                } else {
	// 						console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
	// 						// console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
	// 	                    resolve(return_status);
	// 	                }
	// 	            }, (err) => {
	// 	                //this is the callback if something goes wrong with the event registration or processing
	// 	                reject(new Error('There was a problem with the eventhub ::'+err));
	// 	            });
	// 	        });
	// 	        promises.push(txPromise);

	// 	        return Promise.all(promises);
	// 	    } else {
	// 	        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	        res.send("Error: no farm found");
	// 	        // throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	// 	    }
	// 	}).then((results) => {
	// 	    console.log('Send transaction promise and event listener promise have completed');
	// 	    // check the results in the order the promises were added to the promise all list
	// 	    if (results && results[0] && results[0].status === 'SUCCESS') {
	// 	        console.log('Successfully sent transaction to the orderer.');
	// 	        res.json(tx_id.getTransactionID())
	// 	    } else {
	// 	        console.error('Failed to order the transaction. Error code: ' + response.status);
	// 	        res.send("Error: no farm found");
	// 	    }

	// 	    if(results && results[1] && results[1].event_status === 'VALID') {
	// 	        console.log('Successfully committed the change to the ledger by the peer');
	// 	        // res.json(tx_id.getTransactionID())
	// 	    } else {
	// 	        console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
	// 	    }
	// 	}).catch((err) => {
	// 	    console.error('Failed to invoke successfully :: ' + err);
	// 	    res.send("Error: no farm found");
	// 	});

	// }
	
}
})();