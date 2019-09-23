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

/* Define Tuna structure, with 4 properties.
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
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
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
	} else if function == "queryAllFarm" {
		return s.queryAllFarm(APIstub)
	} else if function == "queryAllTransport" {
		return s.queryAllTransport(APIstub)
	}
	return shim.Error("Invalid Smart Contract function name.")
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

/*
 * The queryPig method *
Used to view the records of one particular pig
It takes one argument -- the key for the pig in question
*/

/*
 * The initLedger method *
Will add test data to our network
*/

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	// farm := []Farm{
	// 	Farm{
	// 		Id: "923F",
	// 		Famer: "HieuLinh",
	// 		Species: "Home",
	// 		Food: "Cam",
	// 		Sick_Cure: "Ho-Tiffi",
	// 		FarmLocation: "Nga Nam",
	// 		StartDateOfFarming: "01/01/2019",
	// 		EndDateOfFarming: "01/04/2019"},
	// }
	// f := 0
	// for f < len(farm) {
	// 	fmt.Println("f is ", f)
	// 	farmAsBytes, _ := json.Marshal(farm[f])
	// 	APIstub.PutState(strconv.Itoa(f+1), farmAsBytes)
	// 	fmt.Println("Added", farm[f])
	// 	f = f + 1
	// }

	// transport := []Transport{
	// 	Transport{
	// 		Company: "1 Thanh Vien",
	// 		Transporter: "Sapau",
	// 		Vehicle: "Xe Tai",
	// 		Trouble: "No",
	// 		Solution:"No",
	// 		TransportQualified: "ISO 9000",
	// 		Time: "01/04/2019"},
	// }
	// t := 0
	// for t < len(transport) {
	// 	fmt.Println("t is ", t)
	// 	transportAsBytes, _ := json.Marshal(transport[t])
	// 	APIstub.PutState(strconv.Itoa(t+1), transportAsBytes)
	// 	fmt.Println("Added", transport[t])
	// 	t = t + 1
	// }

	// abattoir := []Abattoir{
	// 	Abattoir{
	// 		AbattoirName: "Taikonn",
	// 		AbattoirLocation: "Can Tho",
	// 		AbattoirQualified: "OK",
	// 		Peck_Time: "02/04/2019"},
	// }
	// a := 0
	// for a < len(abattoir) {
	// 	fmt.Println("a is ", a)
	// 	abattoirAsBytes, _ := json.Marshal(abattoir[a])
	// 	APIstub.PutState(strconv.Itoa(a+1), abattoirAsBytes)
	// 	fmt.Println("Added", abattoir[a])
	// 	a = a + 1
	// }

	// supermarket := []Supermarket{
	// 	Supermarket{
	// 		Farm: Farm{Id: "923F", Famer: "HieuLinh", Species: "Home", Food: "Cam", Sick_Cure: "Ho-Tiffi", FarmLocation: "Nga Nam", StartDateOfFarming: "01/01/2019", EndDateOfFarming: "01/04/2019"},
	// 		Transport: Transport{Company: "1 Thanh Vien", Transporter: "Sapau", Vehicle: "Xe Tai", Trouble: "No", Solution:"No", TransportQualified: "ISO 9000", Time: "01/04/2019"},
	// 		Abattoir: Abattoir{AbattoirName: "Taikonn", AbattoirLocation: "Can Tho", AbattoirQualified: "OK", Peck_Time: "02/04/2019"},
	// 		SupermarketName: "BigC",
	// 		SupermarketQualified: "Ngon",
	// 		Price: "3$",
	// 		QuantityRemaining: "20",
	// 		MFG: "03/04/2019",
	// 		EXP: "04/04/2019"},
	// }

	// su := 0
	// for su < len(supermarket) {
	// 	fmt.Println("su is ", su)
	// 	supermarketAsBytes, _ := json.Marshal(supermarket[su])
	// 	APIstub.PutState(strconv.Itoa(su+1), supermarketAsBytes)
	// 	fmt.Println("Added", supermarket[su])
	// 	su = su + 1
	// }

	pig := []Pork{
		Pork{
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

	return shim.Success(nil)
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

func (t *SmartContract) chainDelete(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	bytes, err := APIstub.GetState(args[0])

	if err != nil {
		return shim.Error("Unable to get tasks.")
		//  return nil, errors.New( "Unable to get tasks." )
	}

	var chain []Pork

	// Decode JSON collection into array
	// Add latest instance value
	err = json.Unmarshal(bytes, &chain)

	for g := 0; g < len(chain); g++ {
		chain = append(chain[:g], chain[g+1:]...)

	}

	// Encode as JSON
	// Put back on the block
	bytes, err = json.Marshal(chain)
	err = APIstub.PutState(args[0], bytes)

	return shim.Success(nil)
}

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
	// err := APIstub.PutState(args[0], farmAsBytes)
	err := APIstub.DelState(args[0])
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
