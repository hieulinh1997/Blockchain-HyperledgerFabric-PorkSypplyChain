//SPDX-License-Identifier: Apache-2.0

var psc = require('./controller.js');

module.exports = function(app){

  app.get('/init_chain/:chain', function(req, res){
    psc.init_chain(req, res);
  });
  app.get('/add_chain/:chain', function(req, res){
    psc.add_chain(req, res);
  });
  app.get('/edit_password/:user', function(req, res){
    psc.edit_password(req, res);
  });
  app.get('/edit_email/:user', function(req, res){
    psc.edit_email(req, res);
  });
  app.get('/edit_chainid/:user', function(req, res){
    psc.edit_chainid(req, res);
  });
  app.get('/edit_status/:user', function(req, res){
    psc.edit_status(req, res);
  });
  app.get('/edit_roles/:user', function(req, res){
    psc.edit_roles(req, res);
  });
  app.get('/approve_user/:user', function(req, res){
    psc.approve_user(req, res);
  });
  app.get('/cancel_approve_user/:user', function(req, res){
    psc.cancel_approve_user(req, res);
  });
  app.get('/update_sick_cure/:farm', function(req, res){
    psc.update_sick_cure(req, res);
  });
  app.get('/update_famer/:farm', function(req, res){
    psc.update_famer(req, res);
  });
  app.get('/update_species/:farm', function(req, res){
    psc.update_species(req, res);
  });
  app.get('/update_food/:farm', function(req, res){
    psc.update_food(req, res);
  });
  app.get('/update_location/:farm', function(req, res){
    psc.update_location(req, res);
  });
  app.get('/update_start_date/:farm', function(req, res){
    psc.update_start_date(req, res);
  });
  app.get('/update_end_date/:farm', function(req, res){
    psc.update_end_date(req, res);
  });
  app.get('/sign_up/:username', function(req, res){
    psc.sign_up(req, res);
  });
  app.get('/add_user/:user', function(req, res){
    psc.add_user(req, res);
  });
  // app.get('/add_sent_user/:user', function(req, res){
  //   psc.add_sent_user(req, res);
  // });
  app.get('/get_all_user', function(req, res){
    psc.get_all_user(req, res);
  });
  // app.get('/get_all_sent_user', function(req, res){
  //   psc.get_all_sent_user(req, res);
  // });
  // app.get('/get_psc/:id', function(req, res){
  //   psc.get_psc(req, res);
  // });
  app.get('/get_pig/:id', function(req, res){
    psc.get_pig(req, res);
  });
  app.get('/query_view_user/:id', function(req, res){
    psc.query_view_user(req, res);
  });
  app.get('/query_farm/:id', function(req, res){
    psc.query_farm(req, res);
  });
  app.get('/query_transport/:id', function(req, res){
    psc.query_transport(req, res);
  });
  app.get('/query_abattoir/:id', function(req, res){
    psc.query_abattoir(req, res);
  });
  app.get('/query_supermarket/:id', function(req, res){
    psc.query_supermarket(req, res);
  });
  app.get('/login/:username', function(req, res){
    psc.login(req, res);
  });
  // app.get('/chain_delete/:id', function(req, res){
  //   psc.chain_delete(req, res);
  // });
  //recordFarm
  app.get('/add_pig/:pig', function(req, res){
    psc.add_pig(req, res);
  });
  app.get('/add_transport/:pig', function(req, res){
    psc.add_transport(req, res);
  });
  // app.get('/add_psc/:psc', function(req, res){
  //   psc.add_psc(req, res);
  // });
  // app.get('/get_all_psc', function(req, res){
  //   psc.get_all_psc(req, res);
  // });
  app.get('/get_all_pig', function(req, res){
    psc.get_all_pig(req, res);
  });
  app.get('/get_all_transport', function(req, res){
    psc.get_all_pig(req, res);
  });
  app.get('/get_all_farm', function(req, res){
    psc.get_all_farm(req, res);
  });
  app.get('/insert_farm/:farm', function(req, res){
    psc.insert_farm(req, res);
  });
  app.get('/insert_transport/:transport', function(req, res){
    psc.insert_transport(req, res);
  });
  app.get('/insert_abattoir/:abattoir', function(req, res){
    psc.insert_abattoir(req, res);
  });
  app.get('/insert_supermarket/:supermarket', function(req, res){
    psc.insert_supermarket(req, res);
  });

}
