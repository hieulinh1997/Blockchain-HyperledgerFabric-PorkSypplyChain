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

Week 7: update user interface
	-	Truy xuất theo ID
	![week7](https://user-images.githubusercontent.com/46451472/65389849-6156a280-dd84-11e9-96bb-0511c9afabaa.png)
	-	Truy xuất QR
	![week7-qr](https://user-images.githubusercontent.com/46451472/65389953-06717b00-dd85-11e9-9675-e26b1d0ad6eb.png)

Week 8 & 9: basic about sign-up and login with roles admin
	-	sign up
	![sign-up-w8-9](https://user-images.githubusercontent.com/46451472/66125190-7f3bc700-e610-11e9-8d44-b4a6aa990563.png)
	-	login
	![login-w8-9](https://user-images.githubusercontent.com/46451472/66125192-806cf400-e610-11e9-817b-a5cd1efc4b63.png)
	
Week 10: fix and update sign-up & login(get current user, logout):   
	- homepage  
	![homepage](https://user-images.githubusercontent.com/46451472/66412950-acc5ad80-ea20-11e9-9bd1-58ff6bcaa70d.png)  
	............................................................................................................  
	- signuppage  
	![signuppage](https://user-images.githubusercontent.com/46451472/66412962-b18a6180-ea20-11e9-9822-0fce12334711.png)  
	............................................................................................................  
	- loginpage  
	![loginpage](https://user-images.githubusercontent.com/46451472/66412966-b3ecbb80-ea20-11e9-8b68-90ed207ad174.png) 
	............................................................................................................  
	- adminpage  
	![adminpage](https://user-images.githubusercontent.com/46451472/66412970-b5b67f00-ea20-11e9-8424-f63b25dc826f.png) 
	............................................................................................................  
	- userpage  
	![userpage](https://user-images.githubusercontent.com/46451472/66412973-b7804280-ea20-11e9-9ca3-390b9337c509.png)  
	
Week 11: Actors case:  
	 - admin case:  
	 ![admin](https://user-images.githubusercontent.com/46451472/66711439-00841e00-edb6-11e9-9f51-54f4c06e115c.PNG)  
	 ............................................................................................................  
	 - members case:  
	 ![members](https://user-images.githubusercontent.com/46451472/66711443-214c7380-edb6-11e9-9dd2-194458e44489.PNG)  
	- Admin page : 
	............................................................................................................  
	+ Approve members:  
	![admin](https://user-images.githubusercontent.com/46451472/67205170-55b8d300-f439-11e9-988d-7e616062beb8.png)  
	............................................................................................................  
	+ Initialization chain ID:  
	![admin-initchainid](https://user-images.githubusercontent.com/46451472/67205171-57829680-f439-11e9-995a-ec6c22371bac.png)  
	............................................................................................................  
	- chain members(4 members) page:  
	![farm-add-info](https://user-images.githubusercontent.com/46451472/67205174-594c5a00-f439-11e9-9166-ab2cf1f45e13.png)  
	============================================================================================================================================================================  
Week 12-13:  
	- Approve users:  
	![approveuser](https://user-images.githubusercontent.com/46451472/68220448-60b75a00-001a-11ea-8527-347e35946a82.png)  
	.............................................................  
	- Chain list:  
	![chainlist](https://user-images.githubusercontent.com/46451472/68220478-657c0e00-001a-11ea-82ff-477840eca40f.png)  
	.............................................................  
	- Members profile  
	![profilemembers](https://user-images.githubusercontent.com/46451472/68220479-6745d180-001a-11ea-9206-0c35cc6810ee.png)  
	.............................................................  
	- farm page(add,edit record & profile)
	![farm](https://user-images.githubusercontent.com/46451472/68220489-6876fe80-001a-11ea-860e-070b8ceb8b6a.png)  
	============================================================================================================================================================================  
Week 14:  
	- farm page  
	![farmPage](https://user-images.githubusercontent.com/46451472/68546424-8bcdef00-0408-11ea-8f47-d74a029799a7.png)  
	.............................................................  
	- Thêm mẫu tin heo gặp sự cố:  
	![recordPigTrouble](https://user-images.githubusercontent.com/46451472/68546534-c5ebc080-0409-11ea-841e-a975489a23b2.png)  
	.............................................................  
	- Profile users:  
	![profileUsers](https://user-images.githubusercontent.com/46451472/68546428-925c6680-0408-11ea-9593-f06c4585d5b7.png)  
	.............................................................  
	- transport page:  
	![transportPage](https://user-images.githubusercontent.com/46451472/68546431-97b9b100-0408-11ea-9416-abf5103780b9.png)  
	============================================================================================================================================================================  
Week 15: Hoàn thành giao diện quản lý của 4 công đoạn - Cập nhật giao diện form Đăng ký và Đăng nhập - Cập nhật giao diện thêm thông tin  
.............................................................  
	- sign-up page:  
	![form_signup](https://user-images.githubusercontent.com/46451472/68673642-d07f9480-0586-11ea-80df-88e2343f2360.png)  
	.............................................................  
	- login page:  
	![form_login](https://user-images.githubusercontent.com/46451472/68673645-d37a8500-0586-11ea-8c2e-1dd5c5c7dc06.png)    
	.............................................................  
	- farm page:  
	![farm_page](https://user-images.githubusercontent.com/46451472/68673659-d70e0c00-0586-11ea-84e7-b027db0a41e8.png)  
	.............................................................  
	- transport page:  
	![transport_page](https://user-images.githubusercontent.com/46451472/68673673-dd9c8380-0586-11ea-9373-7fa3c61500da.png)  
	.............................................................  
	- abattoir page  
	![abattoir_page](https://user-images.githubusercontent.com/46451472/68673678-e2613780-0586-11ea-8a80-63ba9a6caadd.png)  
	.............................................................  
	- supermarket page  
	![supermarket_page](https://user-images.githubusercontent.com/46451472/68673685-e7be8200-0586-11ea-8ea9-c97773d50c6d.png)  
	.............................................................  
	- Gia diện tra cứu mẫu(để em sửa lại theo mẫu timeline )  
	![tra cuu](https://user-images.githubusercontent.com/46451472/68674522-9e6f3200-0588-11ea-96b3-f85000441aed.png)
	.............................................................  
	- Tra cứu giao diện kiểu timeline  
	![timeline](https://user-images.githubusercontent.com/46451472/68687029-26603680-059f-11ea-9935-d37665cc2d97.png)  
	.............................................................  
	- Lịch sử giao dịch(khi người dùng tương tác với ledger)  
	![h](https://user-images.githubusercontent.com/46451472/68938948-fa78c700-07d1-11ea-92b6-1f3fbd4eb6d7.png)
	============================================================================================================================================================================  
Week 16: Cập nhật định dạng mã chuỗi cung ứng theo dạng (201911.0001)  
	- Định dạng mã chuỗi cung ứng  
	![formatID](https://user-images.githubusercontent.com/46451472/69358141-f3adf080-0cb8-11ea-95a0-9766e7f4aca0.png)
