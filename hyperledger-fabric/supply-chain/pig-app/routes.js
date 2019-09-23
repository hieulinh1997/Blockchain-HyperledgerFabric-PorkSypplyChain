//SPDX-License-Identifier: Apache-2.0

var tuna = require('./controller.js');

module.exports = function(app){

  app.get('/get_tuna/:id', function(req, res){
    tuna.get_tuna(req, res);
  });
  app.get('/get_pig/:id', function(req, res){
    tuna.get_pig(req, res);
  });
  app.get('/chain_delete/:id', function(req, res){
    tuna.chain_delete(req, res);
  });
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
}
