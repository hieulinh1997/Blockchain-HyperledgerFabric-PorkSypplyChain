# 2019.01_Quan-ly-chuoi-cung-ung-blockchain
Xây dựng hệ thống quản lý chuỗi cung ứng trên nền tảng blockchain (Lâm Hiếu Linh, B1507376)

# Hyperledger Fabric Sample Application

In this exercise we will set up the minimum number of nodes required to develop chaincode. It has a single peer and a single organization.

if getting error about running ./startFabric.sh permission 

chmod a+x startFabric.sh

This code is based on code written by the Hyperledger Fabric community. Source code can be found here: (https://github.com/hyperledger/fabric-samples).

#Model suply chain pig-app

![model](https://user-images.githubusercontent.com/46451472/64616881-96b7d380-d407-11e9-9f9f-9bb41242ca86.PNG)



#Progress reports

Week 1: Read documentation the hyperledger fabric(https://hyperledger-fabric.readthedocs.io/en/latest/tutorials.html).
	Install prerequisites for deploying hyperledger fabric(https://hyperledger-fabric.readthedocs.io/en/latest/build_network.html).
	Run the demo of fabric hyperledger applications.(https://github.com/hyperledger/fabric-samples and https://github.com/IBM/todo-list-fabricV1)

Week 2: Read documentation about golang and nodejs language for write chaincode(smart contract) and controller.
	Building basic network to deploy pig-app.
	Enroll Admin user for network. Register and Enroll user to intreact with the fabric network.

Week 3: Building chaincode(smart contract) 
	-	Set & get data

Week 4 & 5: Building controller web service.
	-	Query supply chain with argument(ID)
	![queryargs1](https://user-images.githubusercontent.com/46451472/64616920-a9320d00-d407-11e9-8ce4-8d93ab510a67.png)
	-	Add record for farm, transport, abattoir, supermarket
	![addin4](https://user-images.githubusercontent.com/46451472/64617703-1d20e500-d409-11e9-94e0-9a1262d3e1e5.png)

Week 6: Built basic qrcode scanning system
	-	![ok](https://user-images.githubusercontent.com/46451472/64932794-a2722280-d86b-11e9-94df-5eb3ae462827.png)
