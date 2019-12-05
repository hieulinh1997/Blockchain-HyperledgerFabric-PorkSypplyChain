'use strict';
/*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode Invoke

This code is based on code written by the Hyperledger Fabric community.
  Original code can be found here: https://gerrit.hyperledger.org/r/#/c/14395/4/fabcar/registerUser.js

 */
 //SDK for writing node.js applications to interact with Hyperledger Fabric
var Fabric_Client = require('fabric-client');
//fabric-ca-client, to interact with the fabric-ca to manage user certificates.
var Fabric_CA_Client = require('fabric-ca-client');

var path = require('path');
var util = require('util');
var os = require('os');
var username = req.params.username;

//
var fabric_client = new Fabric_Client();
var fabric_ca_client = null;
var admin_user = null;
var member_user = null;
var store_path = path.join(os.homedir(), '.hfc-key-store');
console.log(' Store path:'+store_path);
console.log('fail function');
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
        admin_user = user_from_store;
    } else {
        throw new Error('Failed to get admin.... run registerAdmin.js');
    }

    // at this point we should have the admin user
    // first need to register the user with the CA server
    console.log('##############################: '+username);
    return fabric_ca_client.register({enrollmentID: username, affiliation: 'org1.department1'}, admin_user);
}).then((secret) => {
    // next we need to enroll the user with CA server
    console.log(`Successfully registered ${username} - secret:`+ secret);

    return fabric_ca_client.enroll({enrollmentID: username, enrollmentSecret: secret});
}).then((enrollment) => {
  console.log(`Successfully enrolled member user ${username} `);
  return fabric_client.createUser(
     {username: username,
     mspid: 'Org1MSP',
     roles: 'client',
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
             console.log('Successfully loaded user1 from persistence');
             member_user = user_from_store;
         } else {
             throw new Error('Failed to get user1.... run registerUser.js');
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

    console.error('Failed to register: ' + err);
    // console.log('Failed to register: lll ' + err);
	if(err.toString().indexOf('Authorization') > -1) {
		console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
		'Try again after deleting the contents of the store directory '+store_path);
	}
})
// }
;

