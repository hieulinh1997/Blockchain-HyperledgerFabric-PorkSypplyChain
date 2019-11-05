// registerAdmin
'use strict';
/*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode Invoke

This code is based on code written by the Hyperledger Fabric community.
  Original code can be found here: https://gerrit.hyperledger.org/r/#/c/14395/4/fabcar/enrollAdmin.js
 */

var Fabric_Client = require('fabric-client');
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
    var	tlsOptions = {
    	trustedRoots: [],
    	verify: false
    };
    // be sure to change the http to https when the CA is running TLS enabled
    fabric_ca_client = new Fabric_CA_Client('http://localhost:7054', tlsOptions , 'ca.example.com', crypto_suite);

    // first check to see if the admin is already enrolled
    return fabric_client.getUserContext('admin', true);
}).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded admin from persistence');
        admin_user = user_from_store;
        return null;
    } else {
        // need to enroll it with CA server
        return fabric_ca_client.enroll({
          enrollmentID: 'admin',
          enrollmentSecret: 'adminpw'
        }).then((enrollment) => {
          console.log('Successfully enrolled admin user "admin"');
          return fabric_client.createUser(
              {username: 'admin',
                  mspid: 'Org1MSP',
                  cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
              });
        }).then((user) => {
          admin_user = user;
          return fabric_client.setUserContext(admin_user);
        }).catch((err) => {
          console.error('Failed to enroll and persist admin. Error: ' + err.stack ? err.stack : err);
          throw new Error('Failed to enroll admin');
        });
    }
}).then(() => {
    console.log('Assigned the admin user to the fabric client ::' + admin_user.toString());
}).catch((err) => {
    console.error('Failed to enroll admin: ' + err);
});

//SPDX-License-Identifier: Apache-2.0

// nodejs server setup 

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
// var QRCode = require('qrcode');

// Load all of our middleware
// configure app to use bodyParser()
// this will let us get the data from a POST
// app.use(express.static(__dirname + '/client'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// instantiate the app
var app = express();

// this line requires and runs the code from our routes.js file and passes it app
require('./routes.js')(app);

// set up a static file server that points to the "client" directory
app.use(express.static(path.join(__dirname, './client')));

// Save our port
var port = process.env.PORT || 8000;

// Start the server and listen on port 
app.listen(port,function(){
  console.log("Live on port: " + port);
});

// var segs = [
//   { data: 'HIEULINH', mode: 'alphanumeric' },
//   { data: '0123456', mode: 'numeric' }
// ]
// QRCode.toDataURL(segs, function (err, url) {
//   console.log(url)
// })

// QRCode.toString(segs, function (err, url) {
//   console.log(url)
// })

// QRCode.toFile('./filename.png', segs, {
//   color: {
//     dark: '#00F',
//     light: '#0000' 
//   }
// }, function (err) {
//   if (err) throw err
//   console.log('done')
// })