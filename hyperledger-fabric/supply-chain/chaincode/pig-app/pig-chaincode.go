// SPDX-License-Identifier: Apache-2.0

/*
  Sample Chaincode based on Demonstrated Scenario

 This code is based on code written by the Hyperledger Fabric community.
  Original code can be found here: https://github.com/hyperledger/fabric-samples/blob/release/chaincode/fabcar/fabcar.go
*/

package main

/* Imports
* 4 utility libraries for handling bytes, reading and writing JSON,
formatting, and string manipulation
* 2 specific Hyperledger Fabric specific libraries for Smart Contracts
*/
import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

//SmartContract struct - Define the Smart Contract structure
type SmartContract struct {
}

//User struct
type User struct {
	Img      string `json:"img"`
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
	ChainID  string `json:"chainid"`
	Roles    string `json:"roles"`
	Status   string `json:"status"`
	Approve  string `json:"approve"`
}

//Farm struct
type Farm struct {
	FarmAccount        string `json:"farm_account"`
	Famer              string `json:"famer"`
	Species            string `json:"species"`
	Food               string `json:"food"`
	SickCure           string `json:"sick_cure"`
	FarmQualified      string `json:"farm_qualified"`
	FarmLocation       string `json:"farm_location"`
	StartDateOfFarming string `json:"start_date_of_farming"`
	EndDateOfFarming   string `json:"end_date_of_farming"`
}

//Pork struct(SupplyChain)
type Pork struct {
	Farm        //extend Farm struct
	Transport   //extend Transport struct
	Abattoir    //extend Abattoir struct
	Supermarket //extend Supermarket struct
}

//Transport struct
type Transport struct {
	Farm
	TransportAccount         string `json:"transport_account"`
	Company                  string `json:"company"`
	Transporter              string `json:"transporter"`
	Vehicle                  string `json:"vehicle"`
	TransportTroubleSolution string `json:"transport_trouble_solution"`
	TransportQualified       string `json:"transport_qualified"`
	Time                     string `json:"time"`
}

//Abattoir struct
type Abattoir struct {
	Farm
	Transport
	AbattoirAccount         string `json:"abattoir_account"`
	AbattoirName            string `json:"abattoir_name"`
	AbattoirTroubleSolution string `json:"abattoir_trouble_solution"`
	AbattoirLocation        string `json:"abattoir_location"`
	AbattoirQualified       string `json:"abattoir_qualified"`
	PeckTime                string `json:"peck_time"`
}

//Supermarket struct
type Supermarket struct {
	Farm
	Transport
	Abattoir
	SupermarketAccount         string `json:"supermarket_account"`
	SupermarketName            string `json:"supermarket_name"`
	SupermarketTroubleSolution string `json:"supermarket_trouble_solution"`
	SupermarketQualified       string `json:"supermarket_qualified"`
	Price                      string `json:"price"`
	QuantityRemaining          string `json:"quantity_remaining"`
	MFG                        string `json:"manufacturing_date"`
	EXP                        string `json:"expiry_date"`
}

//HistoryTxID struct
type HistoryTxID struct {
	TxID       string `json:"txid"`
	Account    string `json:"account"`
	Job        string `json:"job"`
	CreateTime string `json:"create_time"`
}

/*
* The Init method *
called when the Smart Contract "tuna-chaincode" is instantiated by the network
* Best practice is to have any Ledger initialization in separate function
-- see initLedger()
*/

// Init method definition
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*Invoke methoad
called when an application requests to run the Smart Contract "pig-chaincode"
The app also specifies the specific smart contract function to call with args
*/
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger
	if function == "queryPig" { //look up pork with ID
		return s.queryPig(APIstub, args)
	} else if function == "queryViewUser" {
		return s.queryViewUser(APIstub, args)
	} else if function == "addUser" {
		return s.addUser(APIstub, args)
	} else if function == "deleteUser" {
		return s.deleteUser(APIstub, args)
	} else if function == "queryAllUser" {
		return s.queryAllUser(APIstub)
	} else if function == "initLedger" { //initialization Ledger
		return s.initLedger(APIstub)
	} else if function == "initChain" { //create supply chain
		return s.initChain(APIstub, args)
	} else if function == "queryAllPig" { //query all pig id
		return s.queryAllPig(APIstub)
		//...
	} else if function == "queryAllHistoryTxID" {
		return s.queryAllHistoryTxID(APIstub)
	} else if function == "addHistoryTxID" {
		return s.addHistoryTxID(APIstub, args)

		// update  farm info
	} else if function == "updateFamer" {
		return s.updateFamer(APIstub, args)
	} else if function == "updateSpecies" {
		return s.updateSpecies(APIstub, args)
	} else if function == "updateFood" {
		return s.updateFood(APIstub, args)
	} else if function == "updateFarmQualified" {
		return s.updateFarmQualified(APIstub, args)
	} else if function == "updateLocation" {
		return s.updateLocation(APIstub, args)
	} else if function == "updateStartDate" {
		return s.updateStartDate(APIstub, args)
	} else if function == "updateEndDate" {
		return s.updateEndDate(APIstub, args)

		//update  transport info
	} else if function == "updateFarmAccount" {
		return s.updateFarmAccount(APIstub, args)
	} else if function == "updateTransportAccount" {
		return s.updateTransportAccount(APIstub, args)
	} else if function == "updateCompany" {
		return s.updateCompany(APIstub, args)
	} else if function == "updateTransporter" {
		return s.updateTransporter(APIstub, args)
	} else if function == "updateVehicle" {
		return s.updateVehicle(APIstub, args)
	} else if function == "updateTransportTroubleSolution" {
		return s.updateTransportTroubleSolution(APIstub, args)
	} else if function == "updateTransportQualified" {
		return s.updateTransportQualified(APIstub, args)
	} else if function == "updateTime" {
		return s.updateTime(APIstub, args)

		//update abattoir info
	} else if function == "updateAbattoirAccount" {
		return s.updateAbattoirAccount(APIstub, args)
	} else if function == "updateAbattoirName" {
		return s.updateAbattoirName(APIstub, args)
	} else if function == "updateAbattoirTroubleSolution" {
		return s.updateAbattoirTroubleSolution(APIstub, args)
	} else if function == "updateAbattoirLocation" {
		return s.updateAbattoirLocation(APIstub, args)
	} else if function == "updateAbattoirQualified" {
		return s.updateAbattoirQualified(APIstub, args)
	} else if function == "updatePeckTime" {
		return s.updatePeckTime(APIstub, args)

		//update supermarket info
	} else if function == "updateSupermarketAccount" {
		return s.updateSupermarketAccount(APIstub, args)
	} else if function == "updateSupermarketName" {
		return s.updateSupermarketName(APIstub, args)
	} else if function == "updateSupermarketTroubleSolution" {
		return s.updateSupermarketTroubleSolution(APIstub, args)
	} else if function == "updateSupermarketQualified" {
		return s.updateSupermarketQualified(APIstub, args)
	} else if function == "updatePrice" {
		return s.updatePrice(APIstub, args)
	} else if function == "updateQuantityRemaining" {
		return s.updateQuantityRemaining(APIstub, args)
	} else if function == "updateMFG" {
		return s.updateMFG(APIstub, args)
	} else if function == "updateEXP" {
		return s.updateEXP(APIstub, args)

	} else if function == "approveUser" {
		return s.approveUser(APIstub, args)
	} else if function == "editChainID" {
		return s.editChainID(APIstub, args)
	} else if function == "editRoles" {
		return s.editRoles(APIstub, args)
	} else if function == "editPassword" {
		return s.editPassword(APIstub, args)
	} else if function == "editEmail" {
		return s.editEmail(APIstub, args)
	} else if function == "editImg" {
		return s.editImg(APIstub, args)
	} else if function == "editStatus" {
		return s.editStatus(APIstub, args)
	} else if function == "updateSickCure" {
		return s.updateSickCure(APIstub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

//editImg
func (s *SmartContract) editImg(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	editImgAsBytes, _ := APIstub.GetState(args[0])
	if editImgAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	user := User{}

	json.Unmarshal(editImgAsBytes, &user)
	// Normally check that the specified argument
	// we are skipping this check for this example
	user.Img = args[1]

	editImgAsBytes, _ = json.Marshal(user)
	err := APIstub.PutState(args[0], editImgAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//editPassword
func (s *SmartContract) editPassword(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	editPasswordAsBytes, _ := APIstub.GetState(args[0])
	if editPasswordAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	user := User{}

	json.Unmarshal(editPasswordAsBytes, &user)
	// Normally check that the specified argument
	// we are skipping this check for this example
	user.Password = args[1]

	editPasswordAsBytes, _ = json.Marshal(user)
	err := APIstub.PutState(args[0], editPasswordAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//editEmail
func (s *SmartContract) editEmail(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	editEmailAsBytes, _ := APIstub.GetState(args[0])
	if editEmailAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	user := User{}

	json.Unmarshal(editEmailAsBytes, &user)
	// Normally check that the specified argument
	// we are skipping this check for this example
	user.Email = args[1]

	editEmailAsBytes, _ = json.Marshal(user)
	err := APIstub.PutState(args[0], editEmailAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//approveUser
func (s *SmartContract) approveUser(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	approveUserAsBytes, _ := APIstub.GetState(args[0])
	if approveUserAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	user := User{}

	json.Unmarshal(approveUserAsBytes, &user)
	// Normally check that the specified argument
	// we are skipping this check for this example
	user.Status = args[1]
	user.Approve = args[2]

	approveUserAsBytes, _ = json.Marshal(user)
	err := APIstub.PutState(args[0], approveUserAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//editChainID
func (s *SmartContract) editChainID(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	editChainIDAsBytes, _ := APIstub.GetState(args[0])
	if editChainIDAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	user := User{}

	json.Unmarshal(editChainIDAsBytes, &user)
	// Normally check that the specified argument
	// we are skipping this check for this example
	user.ChainID = args[1]

	editChainIDAsBytes, _ = json.Marshal(user)
	err := APIstub.PutState(args[0], editChainIDAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//editroles
func (s *SmartContract) editRoles(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	editRolesAsBytes, _ := APIstub.GetState(args[0])
	if editRolesAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	user := User{}

	json.Unmarshal(editRolesAsBytes, &user)
	// Normally check that the specified argument
	// we are skipping this check for this example
	user.Roles = args[1]

	editRolesAsBytes, _ = json.Marshal(user)
	err := APIstub.PutState(args[0], editRolesAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//editStatus
func (s *SmartContract) editStatus(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	editStatusAsBytes, _ := APIstub.GetState(args[0])
	if editStatusAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	user := User{}

	json.Unmarshal(editStatusAsBytes, &user)
	// Normally check that the specified argument
	// we are skipping this check for this example
	user.Status = args[1]

	editStatusAsBytes, _ = json.Marshal(user)
	err := APIstub.PutState(args[0], editStatusAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateSickCure
func (s *SmartContract) updateSickCure(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	farm := Pork{}

	json.Unmarshal(pigAsBytes, &farm)
	// Normally check that the specified argument
	// we are skipping this check for this example
	farm.SickCure = args[1]

	pigAsBytes, _ = json.Marshal(farm)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateFarmAccount
func (s *SmartContract) updateFarmAccount(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	farm := Pork{}

	json.Unmarshal(pigAsBytes, &farm)
	// Normally check that the specified argument
	// we are skipping this check for this example
	farm.FarmAccount = args[1]

	pigAsBytes, _ = json.Marshal(farm)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateFamer
func (s *SmartContract) updateFamer(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	farm := Pork{}

	json.Unmarshal(pigAsBytes, &farm)
	// Normally check that the specified argument
	// we are skipping this check for this example
	farm.Famer = args[1]

	pigAsBytes, _ = json.Marshal(farm)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateSpecies
func (s *SmartContract) updateSpecies(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	farm := Pork{}

	json.Unmarshal(pigAsBytes, &farm)
	// Normally check that the specified argument
	// we are skipping this check for this example
	farm.Species = args[1]

	pigAsBytes, _ = json.Marshal(farm)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateFood
func (s *SmartContract) updateFood(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	farm := Pork{}

	json.Unmarshal(pigAsBytes, &farm)
	// Normally check that the specified argument
	// we are skipping this check for this example
	farm.Food = args[1]

	pigAsBytes, _ = json.Marshal(farm)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateFarmQualified
func (s *SmartContract) updateFarmQualified(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	farm := Pork{}

	json.Unmarshal(pigAsBytes, &farm)
	// Normally check that the specified argument
	// we are skipping this check for this example
	farm.FarmQualified = args[1]

	pigAsBytes, _ = json.Marshal(farm)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateLocation
func (s *SmartContract) updateLocation(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	farm := Pork{}

	json.Unmarshal(pigAsBytes, &farm)
	// Normally check that the specified argument
	// we are skipping this check for this example
	farm.FarmLocation = args[1]

	pigAsBytes, _ = json.Marshal(farm)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateStartDate
func (s *SmartContract) updateStartDate(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	farm := Pork{}

	json.Unmarshal(pigAsBytes, &farm)
	// Normally check that the specified argument
	// we are skipping this check for this example
	farm.StartDateOfFarming = args[1]

	pigAsBytes, _ = json.Marshal(farm)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateEndDate
func (s *SmartContract) updateEndDate(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	farm := Pork{}

	json.Unmarshal(pigAsBytes, &farm)
	// Normally check that the specified argument
	// we are skipping this check for this example
	farm.EndDateOfFarming = args[1]

	pigAsBytes, _ = json.Marshal(farm)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateTransportAccount
func (s *SmartContract) updateTransportAccount(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	transport := Pork{}

	json.Unmarshal(pigAsBytes, &transport)
	// Normally check that the specified argument
	// we are skipping this check for this example
	transport.TransportAccount = args[1]

	pigAsBytes, _ = json.Marshal(transport)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateCompany
func (s *SmartContract) updateCompany(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	transport := Pork{}

	json.Unmarshal(pigAsBytes, &transport)
	// Normally check that the specified argument
	// we are skipping this check for this example
	transport.Company = args[1]

	pigAsBytes, _ = json.Marshal(transport)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateTransporter
func (s *SmartContract) updateTransporter(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	transport := Pork{}

	json.Unmarshal(pigAsBytes, &transport)
	// Normally check that the specified argument
	// we are skipping this check for this example
	transport.Transporter = args[1]

	pigAsBytes, _ = json.Marshal(transport)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateVehicle
func (s *SmartContract) updateVehicle(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	transport := Pork{}

	json.Unmarshal(pigAsBytes, &transport)
	// Normally check that the specified argument
	// we are skipping this check for this example
	transport.Vehicle = args[1]

	pigAsBytes, _ = json.Marshal(transport)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateTroubleSolution
func (s *SmartContract) updateTransportTroubleSolution(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	transport := Pork{}

	json.Unmarshal(pigAsBytes, &transport)
	// Normally check that the specified argument
	// we are skipping this check for this example
	transport.TransportTroubleSolution = args[1]

	pigAsBytes, _ = json.Marshal(transport)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateTransportQualified
func (s *SmartContract) updateTransportQualified(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	transport := Pork{}

	json.Unmarshal(pigAsBytes, &transport)
	// Normally check that the specified argument
	// we are skipping this check for this example
	transport.TransportQualified = args[1]

	pigAsBytes, _ = json.Marshal(transport)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateTime
func (s *SmartContract) updateTime(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	transport := Pork{}

	json.Unmarshal(pigAsBytes, &transport)
	// Normally check that the specified argument
	// we are skipping this check for this example
	transport.Time = args[1]

	pigAsBytes, _ = json.Marshal(transport)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//update abattoir info
//updateAbattoirAccount
func (s *SmartContract) updateAbattoirAccount(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	abattoir := Pork{}

	json.Unmarshal(pigAsBytes, &abattoir)
	// Normally check that the specified argument
	// we are skipping this check for this example
	abattoir.AbattoirAccount = args[1]

	pigAsBytes, _ = json.Marshal(abattoir)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateAbattoirName
func (s *SmartContract) updateAbattoirName(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	abattoir := Pork{}

	json.Unmarshal(pigAsBytes, &abattoir)
	// Normally check that the specified argument
	// we are skipping this check for this example
	abattoir.AbattoirName = args[1]

	pigAsBytes, _ = json.Marshal(abattoir)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateAbattoirTroubleSolution
func (s *SmartContract) updateAbattoirTroubleSolution(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	abattoir := Pork{}

	json.Unmarshal(pigAsBytes, &abattoir)
	// Normally check that the specified argument
	// we are skipping this check for this example
	abattoir.AbattoirTroubleSolution = args[1]

	pigAsBytes, _ = json.Marshal(abattoir)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateAbattoirLocation
func (s *SmartContract) updateAbattoirLocation(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	abattoir := Pork{}

	json.Unmarshal(pigAsBytes, &abattoir)
	// Normally check that the specified argument
	// we are skipping this check for this example
	abattoir.AbattoirLocation = args[1]

	pigAsBytes, _ = json.Marshal(abattoir)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateAbattoirQualified
func (s *SmartContract) updateAbattoirQualified(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	abattoir := Pork{}

	json.Unmarshal(pigAsBytes, &abattoir)
	// Normally check that the specified argument
	// we are skipping this check for this example
	abattoir.AbattoirQualified = args[1]

	pigAsBytes, _ = json.Marshal(abattoir)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updatePeckTime
func (s *SmartContract) updatePeckTime(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	abattoir := Pork{}

	json.Unmarshal(pigAsBytes, &abattoir)
	// Normally check that the specified argument
	// we are skipping this check for this example
	abattoir.PeckTime = args[1]

	pigAsBytes, _ = json.Marshal(abattoir)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//update supermarket info
//updateSupermarketAccount
func (s *SmartContract) updateSupermarketAccount(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	supermarket := Pork{}

	json.Unmarshal(pigAsBytes, &supermarket)
	// Normally check that the specified argument
	// we are skipping this check for this example
	supermarket.SupermarketAccount = args[1]

	pigAsBytes, _ = json.Marshal(supermarket)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateSupermarketName
func (s *SmartContract) updateSupermarketName(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	supermarket := Pork{}

	json.Unmarshal(pigAsBytes, &supermarket)
	// Normally check that the specified argument
	// we are skipping this check for this example
	supermarket.SupermarketName = args[1]

	pigAsBytes, _ = json.Marshal(supermarket)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateSupermarketTroubleSolution
func (s *SmartContract) updateSupermarketTroubleSolution(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	supermarket := Pork{}

	json.Unmarshal(pigAsBytes, &supermarket)
	// Normally check that the specified argument
	// we are skipping this check for this example
	supermarket.SupermarketTroubleSolution = args[1]

	pigAsBytes, _ = json.Marshal(supermarket)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateSupermarketQualified
func (s *SmartContract) updateSupermarketQualified(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	supermarket := Pork{}

	json.Unmarshal(pigAsBytes, &supermarket)
	// Normally check that the specified argument
	// we are skipping this check for this example
	supermarket.SupermarketQualified = args[1]

	pigAsBytes, _ = json.Marshal(supermarket)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updatePrice
func (s *SmartContract) updatePrice(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	supermarket := Pork{}

	json.Unmarshal(pigAsBytes, &supermarket)
	// Normally check that the specified argument
	// we are skipping this check for this example
	supermarket.Price = args[1]

	pigAsBytes, _ = json.Marshal(supermarket)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateQuantityRemaining
func (s *SmartContract) updateQuantityRemaining(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	supermarket := Pork{}

	json.Unmarshal(pigAsBytes, &supermarket)
	// Normally check that the specified argument
	// we are skipping this check for this example
	supermarket.QuantityRemaining = args[1]

	pigAsBytes, _ = json.Marshal(supermarket)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateMFG
func (s *SmartContract) updateMFG(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	supermarket := Pork{}

	json.Unmarshal(pigAsBytes, &supermarket)
	// Normally check that the specified argument
	// we are skipping this check for this example
	supermarket.MFG = args[1]

	pigAsBytes, _ = json.Marshal(supermarket)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//updateEXP
func (s *SmartContract) updateEXP(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	supermarket := Pork{}

	json.Unmarshal(pigAsBytes, &supermarket)
	// Normally check that the specified argument
	// we are skipping this check for this example
	supermarket.EXP = args[1]

	pigAsBytes, _ = json.Marshal(supermarket)
	err := APIstub.PutState(args[0], pigAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

//function pig-app
func (s *SmartContract) queryPig(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate pig")
	}
	return shim.Success(pigAsBytes)
}

//function pig-app
func (s *SmartContract) queryViewUser(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate user")
	}
	return shim.Success(pigAsBytes)
}

/*
 * The initLedger method *
Will add test data to our network
*/

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {

	//members
	user := []User{
		User{Img: "QmSsSpp1EosrVuNWxtzJ4xRPy7g6SghULp57WaTZv2RUwC", Username: "admin", Password: "admin", Email: "admin@gmail.com", ChainID: "NO", Roles: "Admin", Status: "ENABLE", Approve: "APPROVED"},
		User{Img: "QmSsSpp1EosrVuNWxtzJ4xRPy7g6SghULp57WaTZv2RUwC", Username: "nongtrai", Password: "nongtrai", Email: "nongtrai@gmail.com", ChainID: "NO", Roles: "Z.Farm", Status: "DISABLE", Approve: "WAITTING"},
		User{Img: "QmSsSpp1EosrVuNWxtzJ4xRPy7g6SghULp57WaTZv2RUwC", Username: "vanchuyen", Password: "vanchuyen", Email: "vanchuyen@gmail.com", ChainID: "NO", Roles: "Y.Transport", Status: "ENABLE", Approve: "WAITTING"},
		User{Img: "QmSsSpp1EosrVuNWxtzJ4xRPy7g6SghULp57WaTZv2RUwC", Username: "lomo", Password: "lomo", Email: "lomo@gmail.com", ChainID: "NO", Roles: "X.Abattoir", Status: "ENABLE", Approve: "WAITTING"},
		User{Img: "QmSsSpp1EosrVuNWxtzJ4xRPy7g6SghULp57WaTZv2RUwC", Username: "sieuthi", Password: "sieuthi", Email: "sieuthi@gmail.com", ChainID: "NO", Roles: "W.Supermarket", Status: "ENABLE", Approve: "WAITTING"},
	}
	u := 0
	for u < len(user) {
		fmt.Println("u is ", u)
		userAsBytes, _ := json.Marshal(user[u])
		APIstub.PutState("user"+strconv.Itoa(u+1), userAsBytes)
		fmt.Println("Added", user[u])
		u = u + 1
	}

	pigpsc := []Pork{
		Pork{
			Farm:        Farm{FarmAccount: "farm", Famer: "HieuLinh1", Species: "Heo rừng", Food: "Thức ăn", SickCure: "Ecoli_Lactobacillus", FarmQualified: "*****", FarmLocation: "Ngã Năm", StartDateOfFarming: "01012019", EndDateOfFarming: "01042019"},
			Transport:   Transport{TransportAccount: "transport", Company: "1 thành viên", Transporter: "Sapau", Vehicle: "Xe Tải", TransportTroubleSolution: "No", TransportQualified: "*****", Time: "01042019"},
			Abattoir:    Abattoir{AbattoirAccount: "abattoir", AbattoirName: "Lò mổ lợn", AbattoirTroubleSolution: "No", AbattoirLocation: "Cần Thơ", AbattoirQualified: "*****", PeckTime: "02042019"},
			Supermarket: Supermarket{SupermarketAccount: "supermarket", SupermarketName: "Big.C", SupermarketTroubleSolution: "No", SupermarketQualified: "*****", Price: "3$", QuantityRemaining: "20", MFG: "03042019", EXP: "04042019"},
		},
		// Pork{
		// 	Farm:        Farm{FarmAccount: "farm", Famer: "HieuLinh2", Species: "Heo rừng", Food: "Thức ăn", SickCure: "Ecoli_Lactobacillus", FarmQualified: "*****", FarmLocation: "Ngã Năm", StartDateOfFarming: "01012019", EndDateOfFarming: "01042019"},
		// 	Transport:   Transport{TransportAccount: "transport", Company: "1 thành viên", Transporter: "Sapau", Vehicle: "Xe Tải", TransportTroubleSolution: "No", TransportQualified: "*****", Time: "01042019"},
		// 	Abattoir:    Abattoir{AbattoirAccount: "abattoir", AbattoirName: "Lò mổ lợn", AbattoirTroubleSolution: "No", AbattoirLocation: "Cần Thơ", AbattoirQualified: "*****", PeckTime: "02042019"},
		// 	Supermarket: Supermarket{SupermarketAccount: "supermarket", SupermarketName: "Big.C", SupermarketTroubleSolution: "No", SupermarketQualified: "*****", Price: "3$", QuantityRemaining: "20", MFG: "03042019", EXP: "04042019"},
		// },
	}

	i := 0
	for i < len(pigpsc) {
		fmt.Println("i is ", i)
		pigAsBytes, _ := json.Marshal(pigpsc[i])
		APIstub.PutState("20191101.000000.000"+strconv.Itoa(i+1), pigAsBytes)
		fmt.Println("Added", pigpsc[i])
		i = i + 1

	}

	//HistoryTxID
	history := []HistoryTxID{
		HistoryTxID{TxID: "InitLedger", Account: "InitLedger", Job: "InitLedger$", CreateTime: "00000000"},
	}

	h := 0
	for h < len(history) {
		fmt.Println("h is ", h)
		historyAsBytes, _ := json.Marshal(history[h])
		APIstub.PutState("history"+strconv.Itoa(h+1), historyAsBytes)
		fmt.Println("Added", history[h])
		h = h + 1
	}

	return shim.Success(nil)
}

//delete method definition
func (s *SmartContract) deleteUser(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 9 {
		return shim.Error("Incorrect number of arguments. Expecting 9")
	}

	err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to delete: %s", args[0]))
	}

	eventPayload := "User with ID " + args[0] + " whose owner is " + args[2]
	payloadAsBytes := []byte(eventPayload)
	eventErr := APIstub.SetEvent("deleteEvent", payloadAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}
	fmt.Printf("- deleteUser:\n%s\n", args[0])
	return shim.Success(nil)
}

//query all pig id
func (s *SmartContract) queryAllPig(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "20191101.000000.0000"
	endKey := "99999999.999999.999999"

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add comma before array members,suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(string(queryResponse.Key))
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllPig:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

// queryalluser
func (s *SmartContract) queryAllUser(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "user0"
	endKey := "user999"

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add comma before array members,suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllUser:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

// queryAllHistoryTxID
func (s *SmartContract) queryAllHistoryTxID(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "history1"
	endKey := "history999"

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add comma before array members,suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllHistoryTxID:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

// add addHistoryTxID
func (s *SmartContract) addHistoryTxID(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 5 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}
	var history = HistoryTxID{TxID: args[1], Account: args[2], Job: args[3], CreateTime: args[4]}

	historyAsBytes, _ := json.Marshal(history)
	err := APIstub.PutState(args[0], historyAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to add history: %s", args[0]))
	}

	return shim.Success(nil)
}

// add user
func (s *SmartContract) addUser(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 9 {
		return shim.Error("Incorrect number of arguments. Expecting 9")
	}
	var user = User{Img: args[1], Username: args[2], Password: args[3], Email: args[4], ChainID: args[5], Roles: args[6], Status: args[7], Approve: args[8]}

	userAsBytes, _ := json.Marshal(user)
	err := APIstub.PutState(args[0], userAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to add user: %s", args[0]))
	}

	return shim.Success(nil)
}

//initChain method
func (s *SmartContract) initChain(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 31 {
		return shim.Error("Incorrect number of arguments. Expecting 31")
	}

	var chain = Pork{
		Farm:        Farm{FarmAccount: args[1], Famer: args[2], Species: args[3], Food: args[4], SickCure: args[5], FarmQualified: args[6], FarmLocation: args[7], StartDateOfFarming: args[8], EndDateOfFarming: args[9]},
		Transport:   Transport{TransportAccount: args[10], Company: args[11], Transporter: args[12], Vehicle: args[13], TransportTroubleSolution: args[14], TransportQualified: args[15], Time: args[16]},
		Abattoir:    Abattoir{AbattoirAccount: args[17], AbattoirName: args[18], AbattoirTroubleSolution: args[19], AbattoirLocation: args[20], AbattoirQualified: args[21], PeckTime: args[22]},
		Supermarket: Supermarket{SupermarketAccount: args[23], SupermarketName: args[24], SupermarketTroubleSolution: args[25], SupermarketQualified: args[26], Price: args[27], QuantityRemaining: args[28], MFG: args[29], EXP: args[30]},
	}

	pigAsBytes, _ := json.Marshal(chain)
	err := APIstub.PutState(args[0], pigAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to record farm: %s", args[0]))
	}

	return shim.Success(nil)
}

/*
 * main function *
calls the Start function
The main function starts the chaincode in the container during instantiation.
*/
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
