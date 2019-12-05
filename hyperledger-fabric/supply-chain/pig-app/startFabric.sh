#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0
# This code is based on code written by the Hyperledger Fabric community. 
# Original code can be found here: https://github.com/hyperledger/fabric-samples/blob/release/fabcar/startFabric.sh
#
# Exit on first error

set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

starttime=$(date +%s)

# Language defaults to "golang"
LANGUAGE="golang"


# launch network; create channel and join peer to channel
cd ../basic-network
./start.sh

# Now launch the CLI container in order to install, instantiate chaincode
docker-compose -f ./docker-compose.yml up -d cli

#instal chaincode
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode install -n pig-app -v 1.0 -p github.com/pig-app

#instantiate chaincode
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n pig-app -v 1.0 -c '{"Args":[""]}' -P "OR ('Org1MSP.member','Org2MSP.member')"
sleep 10

#invoke chaincode
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode invoke -o orderer.example.com:7050 -C mychannel -n pig-app -c '{"function":"initLedger","Args":[""]}'

printf "\nTotal execution time : $(($(date +%s) - starttime)) secs ...\n\n"
printf "\nStart with the server.js\n\n"