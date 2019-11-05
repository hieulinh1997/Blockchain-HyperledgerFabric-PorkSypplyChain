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

// Define the Smart Contract structure
type SmartContract struct {
}

//aa
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
	ChainID  string `json:"chainid"`
	Roles    string `json:"roles"`
	Status   string `json:"status"`
	Approve  string `json:"approve"`
}

//SentUser
type SentUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
	Roles    string `json:"roles"`
	Status   string `json:"status"`
	Approve  string `json:"approve"`
}

/* Define Supply chain structure, with 4 properties.
Structure tags are used by encoding/json library
*/
type Farm struct {
	QRCode             string `json:"qrcode"`
	Famer              string `json:"famer"`
	Species            string `json:"species"`
	Food               string `json:"food"`
	Sick_Cure          string `json:"sick_cure"`
	FarmLocation       string `json:"farm_location"`
	StartDateOfFarming string `json:"start_date_of_farming"`
	EndDateOfFarming   string `json:"end_date_of_farming"`
}

type Transport struct {
	Farm
	Company            string `json:"company"`
	Transporter        string `json:"transporter"`
	Vehicle            string `json:"vehicle"`
	Trouble            string `json:"trouble"`
	Solution           string `json:"solution"`
	TransportQualified string `json:"transport_qualified"`
	Time               string `json:"time"`
}

// Abattoir
type Abattoir struct {
	Farm
	Transport
	AbattoirName      string `json:"abattoir_name"`
	AbattoirLocation  string `json:"abattoir_location"`
	AbattoirQualified string `json:"abattoir_qualified"`
	Peck_Time         string `json:"peck_time"`
}

type Supermarket struct {
	Farm
	Transport
	Abattoir
	SupermarketName      string `json:"supermarket_name"`
	SupermarketQualified string `json:"supermarket_qualified"`
	Price                string `json:"price"`
	QuantityRemaining    string `json:"quantity_remaining"`
	MFG                  string `json:"manufacturing_date"`
	EXP                  string `json:"expiry_date"`
}
type Pork struct {
	// User
	Farm
	Transport
	Abattoir
	Supermarket
}

/*
 * The Init method *
 called when the Smart Contract "tuna-chaincode" is instantiated by the network
 * Best practice is to have any Ledger initialization in separate function
 -- see initLedger()
*/
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
 * The Invoke method *
 called when an application requests to run the Smart Contract "pig-chaincode"
 The app also specifies the specific smart contract function to call with args
*/
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger
	if function == "queryPig" {
		return s.queryPig(APIstub, args)
	} else if function == "queryViewUser" {
		return s.queryViewUser(APIstub, args)
	} else if function == "queryFarm" {
		return s.queryFarm(APIstub, args)
	} else if function == "queryTransport" {
		return s.queryTransport(APIstub, args)
	} else if function == "queryAbattoir" {
		return s.queryAbattoir(APIstub, args)
	} else if function == "querySupermarket" {
		return s.querySupermarket(APIstub, args)
	} else if function == "addUser" {
		return s.addUser(APIstub, args)
		// } else if function == "addSentUser" {
		// 	return s.addSentUser(APIstub, args)
	} else if function == "queryAllUser" {
		return s.queryAllUser(APIstub)
		// } else if function == "querySentUser" {
		// 	return s.querySentUser(APIstub)
		// } else if function == "chainDelete" {
		// 	return s.chainDelete(APIstub, args)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
		// } else if function == "initLedgerUser" {
		// return s.initLedgerUser(APIstub)
	} else if function == "initChain" {
		return s.initChain(APIstub, args)
	} else if function == "recordFarm" {
		return s.recordFarm(APIstub, args)
	} else if function == "insertTransport" {
		return s.insertTransport(APIstub, args)
	} else if function == "insertAbattoir" {
		return s.insertAbattoir(APIstub, args)
	} else if function == "insertSupermarket" {
		return s.insertSupermarket(APIstub, args)
		// } else if function == "queryHistory" {
		// 	return s.queryHistory(APIstub, args)
	} else if function == "recordTransport" {
		return s.recordTransport(APIstub, args)
	} else if function == "queryAllPig" {
		return s.queryAllPig(APIstub)
	} else if function == "insertFarm" {
		return s.insertFarm(APIstub, args)
	} else if function == "updateFamer" {
		return s.updateFamer(APIstub, args)
	} else if function == "updateSpecies" {
		return s.updateSpecies(APIstub, args)
	} else if function == "updateFood" {
		return s.updateFood(APIstub, args)
	} else if function == "updateLocation" {
		return s.updateLocation(APIstub, args)
	} else if function == "updateStartDate" {
		return s.updateStartDate(APIstub, args)
	} else if function == "updateEndDate" {
		return s.updateEndDate(APIstub, args)
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
	} else if function == "editStatus" {
		return s.editStatus(APIstub, args)
	} else if function == "updateSickCure" {
		return s.updateSickCure(APIstub, args)
	} else if function == "queryAllFarm" {
		return s.queryAllFarm(APIstub)
	} else if function == "queryAllTransport" {
		return s.queryAllTransport(APIstub)
	}
	return shim.Error("Invalid Smart Contract function name.")
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
	farm.Sick_Cure = args[1]

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

//function queryFarm
func (s *SmartContract) queryFarm(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate farm id")
	}
	return shim.Success(pigAsBytes)
}

//queryTransport
func (s *SmartContract) queryTransport(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate transport id")
	}
	return shim.Success(pigAsBytes)
}

//queryAbattoir
func (s *SmartContract) queryAbattoir(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate abattoir id")
	}
	return shim.Success(pigAsBytes)
}

//querySupermarket
func (s *SmartContract) querySupermarket(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	pigAsBytes, _ := APIstub.GetState(args[0])
	if pigAsBytes == nil {
		return shim.Error("Could not locate suppermarket id")
	}
	return shim.Success(pigAsBytes)
}

/*
 * The initLedger method *
Will add test data to our network
*/

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {

	pig := []Pork{
		Pork{
			// User:        User{},
			Farm:        Farm{QRCode: "923F", Famer: "HieuLinh", Species: "Home", Food: "Cam", Sick_Cure: "Ho-Tiffi", FarmLocation: "Nga Nam", StartDateOfFarming: "01/01/2019", EndDateOfFarming: "01/04/2019"},
			Transport:   Transport{Company: "1 Thanh Vien", Transporter: "Sapau", Vehicle: "Xe Tai", Trouble: "No", Solution: "No", TransportQualified: "ISO 9000", Time: "01/04/2019"},
			Abattoir:    Abattoir{AbattoirName: "Taikonn", AbattoirLocation: "Can Tho", AbattoirQualified: "OK", Peck_Time: "02/04/2019"},
			Supermarket: Supermarket{SupermarketName: "BigC", SupermarketQualified: "Ngon", Price: "3$", QuantityRemaining: "20", MFG: "03/04/2019", EXP: "04/04/2019"},
		},
	}

	i := 0
	for i < len(pig) {
		fmt.Println("i is ", i)
		pigAsBytes, _ := json.Marshal(pig[i])
		APIstub.PutState(strconv.Itoa(i+1), pigAsBytes)
		fmt.Println("Added", pig[i])
		i = i + 1
	}

	//members
	user := []User{
		User{Username: "admin", Password: "admin", Email: "admin@gmail.com", ChainID: "NO", Roles: "Admin", Status: "ABLE", Approve: "APPROVED"},
	}
	u := 0
	for u < len(user) {
		fmt.Println("u is ", u)
		userAsBytes, _ := json.Marshal(user[u])
		APIstub.PutState("user"+strconv.Itoa(u+1), userAsBytes)
		fmt.Println("Added", user[u])
		u = u + 1
	}

	//sent signup for admin approve
	sentUser := []SentUser{
		SentUser{},
	}
	a := 1
	for a < len(sentUser) {
		fmt.Println("a is ", a)
		sentUserAsBytes, _ := json.Marshal(sentUser[a])
		APIstub.PutState("user"+strconv.Itoa(a+1), sentUserAsBytes)
		fmt.Println("Added", sentUser[a])
		a = a + 1
	}

	return shim.Success(nil)
}

// add user
func (s *SmartContract) addUser(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 8 {
		return shim.Error("Incorrect number of arguments. Expecting 8")
	}
	var user = User{Username: args[1], Password: args[2], Email: args[3], ChainID: args[4], Roles: args[5], Status: args[6], Approve: args[7]}

	userAsBytes, _ := json.Marshal(user)
	err := APIstub.PutState(args[0], userAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to add user: %s", args[0]))
	}

	return shim.Success(nil)
}

// add user
// func (s *SmartContract) addSentUser(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 7 {
// 		return shim.Error("Incorrect number of arguments. Expecting 7")
// 	}
// 	var sentUser = SentUser{Username: args[1], Password: args[2], Email: args[3], Roles: args[4], Status: args[5], Approve: args[6]}

// 	sentUserAsBytes, _ := json.Marshal(sentUser)
// 	err := APIstub.PutState(args[0], sentUserAsBytes)
// 	if err != nil {
// 		return shim.Error(fmt.Sprintf("Failed to add sentUser: %s", args[0]))
// 	}

// 	return shim.Success(nil)
// }

// queryAlllSaveSignUp
// func (s *SmartContract) querySentUser(APIstub shim.ChaincodeStubInterface) sc.Response {

// 	startKey := "user0"
// 	endKey := "user999"

// 	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}
// 	defer resultsIterator.Close()

// 	// buffer is a JSON array containing QueryResults
// 	var buffer bytes.Buffer
// 	buffer.WriteString("[")

// 	bArrayMemberAlreadyWritten := false
// 	for resultsIterator.HasNext() {
// 		queryResponse, err := resultsIterator.Next()
// 		if err != nil {
// 			return shim.Error(err.Error())
// 		}
// 		// Add comma before array members,suppress it for the first array member
// 		if bArrayMemberAlreadyWritten == true {
// 			buffer.WriteString(",")
// 		}
// 		buffer.WriteString("{\"Key\":")
// 		buffer.WriteString("\"")
// 		buffer.WriteString(queryResponse.Key)
// 		buffer.WriteString("\"")

// 		buffer.WriteString(", \"Record\":")
// 		// Record is a JSON object, so we write as-is
// 		buffer.WriteString(string(queryResponse.Value))
// 		buffer.WriteString("}")
// 		bArrayMemberAlreadyWritten = true
// 	}
// 	buffer.WriteString("]")

// 	fmt.Printf("- queryAllSentUser:\n%s\n", buffer.String())

// 	return shim.Success(buffer.Bytes())
// }

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

/*
 * The recordFarm method *
This method takes in five arguments (attributes to be saved in the ledger).
*/

func (s *SmartContract) recordFarm(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 9 {
		return shim.Error("Incorrect number of arguments. Expecting 9")
	}
	var farm = Farm{QRCode: args[1], Famer: args[2], Species: args[3], Food: args[4], Sick_Cure: args[5], FarmLocation: args[6], StartDateOfFarming: args[7], EndDateOfFarming: args[8]}

	pigAsBytes, _ := json.Marshal(farm)
	err := APIstub.PutState(args[0], pigAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to record farm: %s", args[0]))
	}

	return shim.Success(nil)
}

//initChain
func (s *SmartContract) initChain(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 26 {
		return shim.Error("Incorrect number of arguments. Expecting 26")
	}

	var chain = Pork{
		Farm:        Farm{QRCode: args[1], Famer: args[2], Species: args[3], Food: args[4], Sick_Cure: args[5], FarmLocation: args[6], StartDateOfFarming: args[7], EndDateOfFarming: args[8]},
		Transport:   Transport{Company: args[9], Transporter: args[10], Vehicle: args[11], Trouble: args[12], Solution: args[13], TransportQualified: args[14], Time: args[15]},
		Abattoir:    Abattoir{AbattoirName: args[16], AbattoirLocation: args[17], AbattoirQualified: args[18], Peck_Time: args[19]},
		Supermarket: Supermarket{SupermarketName: args[20], SupermarketQualified: args[21], Price: args[22], QuantityRemaining: args[23], MFG: args[24], EXP: args[25]},
	}

	pigAsBytes, _ := json.Marshal(chain)
	err := APIstub.PutState(args[0], pigAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to record farm: %s", args[0]))
	}

	return shim.Success(nil)
}

/*
 * The insertTransport method *
The data in the world state can be updated with who has possession.
This function takes in 8 arguments, transport id and new args.
*/

func (s *SmartContract) insertTransport(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 8 {
		return shim.Error("Incorrect number of arguments. Expecting 8")
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
	transport.Transporter = args[2]
	transport.Vehicle = args[3]
	transport.Trouble = args[4]
	transport.Solution = args[5]
	transport.TransportQualified = args[6]
	transport.Time = args[7]

	pigAsBytes, _ = json.Marshal(transport)
	err := APIstub.PutState(args[0], pigAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

/*
 * The insertAbattoir method *
The data in the world state can be updated with who has possession.
This function takes in 5 arguments, farm id and new args.
*/

func (s *SmartContract) insertAbattoir(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 5 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
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
	abattoir.AbattoirLocation = args[2]
	abattoir.AbattoirQualified = args[3]
	abattoir.Peck_Time = args[4]

	pigAsBytes, _ = json.Marshal(abattoir)
	err := APIstub.PutState(args[0], pigAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

/*
 * The insertSupermarket method *
The data in the world state can be updated with who has possession.
This function takes in 5 arguments, farm id and new args.
*/

func (s *SmartContract) insertSupermarket(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 7 {
		return shim.Error("Incorrect number of arguments. Expecting 7")
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
	supermarket.SupermarketQualified = args[2]
	supermarket.Price = args[3]
	supermarket.QuantityRemaining = args[4]
	supermarket.MFG = args[5]
	supermarket.EXP = args[6]

	pigAsBytes, _ = json.Marshal(supermarket)
	err := APIstub.PutState(args[0], pigAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

// func (s *SmartContract) chainDelete(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 1 {
// 		return shim.Error("Incorrect number of arguments. Expecting 1")
// 	}

// 	pigAsBytes, _ := APIstub.GetState(args[0])
// 	if pigAsBytes == nil {
// 		return shim.Error("Could not locate id to delete")
// 	}

// 	err := APIstub.DelState(args[0])
// 	if err != nil {
// 		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
// 	}

// 	// bytes, err := APIstub.GetState(args[0])

// 	// if err != nil {
// 	// 	return shim.Error("Unable to get tasks.")

// 	// }

// 	// var chain []Pork

// 	// Decode JSON collection into array
// 	// Add latest instance value
// 	// err = json.Unmarshal(bytes, &chain)
// 	// for g := 0; g < len(chain); g++ {
// 	// 	if chain[g].QRCode == args[0] {
// 	// 		chain = append(chain[:g], chain[g+1:]...)
// 	// 	}

// 	// }

// 	// Encode as JSON
// 	// Put back on the block
// 	// bytes, err = json.Marshal(chain)
// 	// err = APIstub.PutState(args[0], bytes)

// 	return shim.Success(nil)
// }

/* NOT USE
 * The insertFarm method *
The data in the world state can be updated with who has possession.
This function takes in 9 arguments, farm id and new args.
*/

func (s *SmartContract) insertFarm(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 9 {
		return shim.Error("Incorrect number of arguments. Expecting 9")
	}

	farmAsBytes, _ := APIstub.GetState(args[0])
	if farmAsBytes == nil {
		return shim.Error("Could not locate id")
	}

	farm := Pork{}

	json.Unmarshal(farmAsBytes, &farm)
	// Normally check that the specified argument
	// we are skipping this check for this example
	farm.QRCode = args[1]
	farm.Famer = args[2]
	farm.Species = args[3]
	farm.Food = args[4]
	farm.Sick_Cure = args[5]
	farm.FarmLocation = args[6]
	farm.StartDateOfFarming = args[7]
	farm.EndDateOfFarming = args[8]

	farmAsBytes, _ = json.Marshal(farm)
	err := APIstub.PutState(args[0], farmAsBytes)
	// err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change: %s", args[0]))
	}

	return shim.Success(nil)
}

/*
 * The recordTransport method *
This method takes in five arguments (attributes to be saved in the ledger).
*/

func (s *SmartContract) recordTransport(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 8 {
		return shim.Error("Incorrect number of arguments. Expecting 8")
	}
	var transport = Transport{Company: args[1], Transporter: args[2], Vehicle: args[3], Trouble: args[4], Solution: args[5], TransportQualified: args[6], Time: args[7]}
	transportAsBytes, _ := json.Marshal(transport)
	err := APIstub.PutState(args[0], transportAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to record transport: %s", args[0]))
	}

	return shim.Success(nil)
}

/*
 * The queryTunaHistory method *
Used to view the transcation history of one particular tuna
It takes one argument -- the key for the pỏrk in question
*/
// func (s *SmartContract) queryHistory(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 1 {
// 		return shim.Error("Incorrect number of arguments. Expecting 1")
// 	}

// 	resultsIterator, err := APIstub.GetHistoryForKey(args[0])
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}
// 	defer resultsIterator.Close()

// 	// buffer is a JSON array containing QueryResults
// 	var buffer bytes.Buffer
// 	buffer.WriteString("[")

// 	bArrayMemberAlreadyWritten := false
// 	for resultsIterator.HasNext() {
// 		queryResponse, err := resultsIterator.Next()
// 		if err != nil {
// 			return shim.Error(err.Error())
// 		}
// 		// Add comma before array members,suppress it for the first array member
// 		if bArrayMemberAlreadyWritten == true {
// 			buffer.WriteString(",")
// 		}

// 		buffer.WriteString("{\"TxId\":")
// 		buffer.WriteString("\"")
// 		buffer.WriteString(queryResponse.TxId)
// 		buffer.WriteString("\"")

// 		buffer.WriteString(", \"Value\":")
// 		// if it was a delete operation on given key, then we need to set the
// 		//corresponding value null. Else, we will write the response.Value
// 		//as-is (as the Value itself a JSON marble)
// 		if queryResponse.IsDelete {
// 			buffer.WriteString("null")
// 		} else {
// 			buffer.WriteString(string(queryResponse.Value))
// 		}

// 		buffer.WriteString(", \"Timestamp\":")
// 		buffer.WriteString("\"")
// 		buffer.WriteString(time.Unix(queryResponse.Timestamp.Seconds, 0).String())
// 		buffer.WriteString("\"")

// 		buffer.WriteString(", \"IsDelete\":")
// 		buffer.WriteString("\"")
// 		buffer.WriteString(strconv.FormatBool(queryResponse.IsDelete))
// 		buffer.WriteString("\"")

// 		buffer.WriteString("}")
// 		bArrayMemberAlreadyWritten = true
// 	}
// 	buffer.WriteString("]")

// 	fmt.Printf("- queryHistory:\n%s\n", buffer.String())

// 	return shim.Success(buffer.Bytes())
// }

/*
 * The queryAllTuna method *
allows for assessing all the records added to the ledger(all tuna catches)
This method does not take any arguments. Returns JSON string containing results.
*/

func (s *SmartContract) queryAllPig(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "0"
	endKey := "999"

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

	fmt.Printf("- queryAllPig:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) queryAllFarm(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "0"
	endKey := "999"

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

	fmt.Printf("- queryAllFarm:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) queryAllTransport(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "0"
	endKey := "999"

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

	fmt.Printf("- queryAllTransport:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
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
