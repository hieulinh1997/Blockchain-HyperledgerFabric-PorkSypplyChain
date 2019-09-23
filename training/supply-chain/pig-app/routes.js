//SPDX-License-Identifier: Apache-2.0

var tuna = require('./controller.js');

module.exports = function(app){

  app.get('/get_tuna/:id', function(req, res){
    tuna.get_tuna(req, res);
  });
  app.get('/get_pig/:id', function(req, res){
    tuna.get_pig(req, res);
  });
  app.get('/sign_up/:username', function(req, res){
    tuna.sign_up(req, res);
  });
  app.get('/chain_delete/:id', function(req, res){
    tuna.chain_delete(req, res);
  });
  //recordFarm
  app.get('/add_pig/:pig', function(req, res){
    tuna.add_pig(req, res);
  });
  app.get('/add_transport/:pig', function(req, res){
    tuna.add_transport(req, res);
  });
  // app.get('/add_tuna/:tuna', function(req, res){
  //   tuna.add_tuna(req, res);
  // });
  app.get('/get_all_tuna', function(req, res){
    tuna.get_all_tuna(req, res);
  });
  app.get('/get_all_pig', function(req, res){
    tuna.get_all_pig(req, res);
  });
  app.get('/get_all_transport', function(req, res){
    tuna.get_all_pig(req, res);
  });
  app.get('/get_all_farm', function(req, res){
    tuna.get_all_farm(req, res);
  });
  app.get('/insert_farm/:farm', function(req, res){
    tuna.insert_farm(req, res);
  });
  app.get('/insert_transport/:transport', function(req, res){
    tuna.insert_transport(req, res);
  });
  app.get('/insert_abattoir/:abattoir', function(req, res){
    tuna.insert_abattoir(req, res);
  });
  app.get('/insert_supermarket/:supermarket', function(req, res){
    tuna.insert_supermarket(req, res);
  });
  // app.get('/get_tuna_history/:id', function (req, res) {
  //   tuna.get_tuna_history(req, res);
  // });

  //get voter info, create voter object, and update state with their voterId
  app.post('/registerVoter', async (req, res) => {
    console.log('req.body: ');
    console.log(req.body);
    let voterId = req.body.voterId;

    //first create the identity for the voter and add to wallet
    let response = await network.registerVoter(voterId, req.body.registrarId, req.body.firstName, req.body.lastName);
    console.log('response from registerVoter: ');
    console.log(response);
    if (response.error) {
      res.send(response.error);
    } else {
      console.log('req.body.voterId');
      console.log(req.body.voterId);
      let networkObj = await network.connectToNetwork(voterId);
      console.log('networkobj: ');
      console.log(networkObj);

      if (networkObj.error) {
        res.send(networkObj.error);
      }
      console.log('network obj');
      console.log(util.inspect(networkObj));


      req.body = JSON.stringify(req.body);
      let args = [req.body];
      //connect to network and update the state with voterId  

      let invokeResponse = await network.invoke(networkObj, false, 'createVoter', args);
      
      if (invokeResponse.error) {
        res.send(invokeResponse.error);
      } else {

        console.log('after network.invoke ');
        let parsedResponse = JSON.parse(invokeResponse);
        parsedResponse += '. Use voterId to login above.';
        res.send(parsedResponse);

      }

    }


  });
}
