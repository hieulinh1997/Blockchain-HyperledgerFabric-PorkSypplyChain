//SPDX-License-Identifier: Apache-2.0

var psc = require('./controller.js');
var cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');
module.exports = function(app){

  app.get('/edit_img/:user', function(req, res){
    psc.edit_img(req, res);
  });
  app.get('/delete_user/:user', function(req, res){
    psc.delete_user(req, res);
  });
  app.get('/logout', function(req, res){
    // psc.logout(req, res);
    res.clearCookie('token');
    res.status(201).json({ message: "ok" });
  });
  app.get('/init_chain/:chain', function(req, res){
    psc.init_chain(req, res);
  });
  app.get('/init_chain_farm_add/:chain', function(req, res){
    psc.init_chain_farm_add(req, res);
  });
  app.get('/init_chain_transport_add/:chain', function(req, res){
    psc.init_chain_transport_add(req, res);
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

  //update farm info
  app.get('/update_farm_account/:farm', function(req, res){
    psc.update_farm_account(req, res);
  });
  app.get('/update_sick_cure/:farm', function(req, res){
    psc.update_sick_cure(req, res);
  });
  app.get('/update_farm_qualified/:farm', function(req, res){
    psc.update_farm_qualified(req, res);
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

  //update transport info
  app.get('/update_transport_account/:transport', function(req, res){
    psc.update_transport_account(req, res);
  });
  app.get('/update_company/:transport', function(req, res){
    psc.update_company(req, res);
  });
  app.get('/update_transporter/:transport', function(req, res){
    psc.update_transporter(req, res);
  });
  app.get('/update_vehicle/:transport', function(req, res){
    psc.update_vehicle(req, res);
  });
  app.get('/update_trouble/:transport', function(req, res){
    psc.update_trouble(req, res);
  });
  app.get('/update_solution/:transport', function(req, res){
    psc.update_solution(req, res);
  });
  app.get('/update_transport_qualified/:transport', function(req, res){
    psc.update_transport_qualified(req, res);
  });
  app.get('/update_time/:transport', function(req, res){
    psc.update_time(req, res);
  });
  //update abattoir info
  app.get('/update_abattoir_account/:abattoir', function(req, res){
    psc.update_abattoir_account(req, res);
  });
  app.get('/update_abattoir_name/:abattoir', function(req, res){
    psc.update_abattoir_name(req, res);
  });
  app.get('/update_abattoir_location/:abattoir', function(req, res){
    psc.update_abattoir_location(req, res);
  });
  app.get('/update_abattoir_qualified/:abattoir', function(req, res){
    psc.update_abattoir_qualified(req, res);
  });
  app.get('/update_abattoir_trouble_solution/:abattoir', function(req, res){
    psc.update_abattoir_trouble_solution(req, res);
  });
  app.get('/update_abattoir_peck_time/:abattoir', function(req, res){
    psc.update_abattoir_peck_time(req, res);
  });

   //update supermarket info
  app.get('/update_supermarket_account/:supermarket', function(req, res){
    psc.update_supermarket_account(req, res);
  });
  app.get('/update_supermarket_name/:supermarket', function(req, res){
    psc.update_supermarket_name(req, res);
  });
  app.get('/update_supermarket_qualified/:supermarket', function(req, res){
    psc.update_supermarket_qualified(req, res);
  });
  app.get('/update_supermarket_trouble_solution/:supermarket', function(req, res){
    psc.update_supermarket_trouble_solution(req, res);
  });
  app.get('/update_supermarket_quantity_remaining/:supermarket', function(req, res){
    psc.update_supermarket_quantity_remaining(req, res);
  });
  app.get('/update_supermarket_price/:supermarket', function(req, res){
    psc.update_supermarket_price(req, res);
  });
  app.get('/update_supermarket_mfg/:supermarket', function(req, res){
    psc.update_supermarket_mfg(req, res);
  });
  app.get('/update_supermarket_exp/:supermarket', function(req, res){
    psc.update_supermarket_exp(req, res);
  });

  //
  app.get('/update_end_date/:farm', function(req, res){
    psc.update_end_date(req, res);
  });
  app.get('/sign_up/:username', function(req, res){
    psc.sign_up(req, res);
  });
  app.get('/add_user/:user', function(req, res){
    psc.add_user(req, res);
  });
  // app.get('/add_record_pig/:addpig', function(req, res){
  //   psc.add_record_pig(req, res);
  // });
  // app.get('/add_sent_user/:user', function(req, res){
  //   psc.add_sent_user(req, res);
  // });
  app.get('/get_all_user', function(req, res){
    psc.get_all_user(req, res);
  });
  app.get('/get_all_history_txid', function(req, res){
    psc.get_all_history_txid(req, res);
  });
  app.get('/add_history_txid/:history', function(req, res){
    psc.add_history_txid(req, res);
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
  // app.get('/query_farm/:id', function(req, res){
  //   psc.query_farm(req, res);
  // });
  // app.get('/query_transport/:id', function(req, res){
  //   psc.query_transport(req, res);
  // });
  // app.get('/query_abattoir/:id', function(req, res){
  //   psc.query_abattoir(req, res);
  // });
  // app.get('/query_supermarket/:id', function(req, res){
  //   psc.query_supermarket(req, res);
  // });
  app.get('/login/:username', function(req, res){
    psc.login(req, res);
    // res.cookie('token', token, { expires: expiryDate, path: '/' }); 
    // console.log("Token:" + token);
  });
  // app.get('/chain_delete/:id', function(req, res){
  //   psc.chain_delete(req, res);
  // });
  //recordFarm
  app.get('/add_pig/:pig', function(req, res){
    psc.add_pig(req, res);
  });
  // app.get('/add_transport/:pig', function(req, res){
  //   psc.add_transport(req, res);
  // });
  // app.get('/add_psc/:psc', function(req, res){
  //   psc.add_psc(req, res);
  // });
  // app.get('/get_all_psc', function(req, res){
  //   psc.get_all_psc(req, res);
  // });
  app.get('/get_all_pig', function(req, res){
    psc.get_all_pig(req, res);
  });
  app.get('/get_all_pig_with_account_farm', function(req, res){
    psc.get_all_pig_with_account_farm(req, res);
  });
  
  app.get('/get_all_transport', function(req, res){
    psc.get_all_transport(req, res);
  });
  app.get('/get_all_farm', function(req, res){
    psc.get_all_farm(req, res);
  });
  // app.get('/insert_farm/:farm', function(req, res){
  //   psc.insert_farm(req, res);
  // });
  // app.get('/insert_transport/:transport', function(req, res){
  //   psc.insert_transport(req, res);
  // });
  // app.get('/insert_abattoir/:abattoir', function(req, res){
  //   psc.insert_abattoir(req, res);
  // });
  // app.get('/insert_supermarket/:supermarket', function(req, res){
  //   psc.insert_supermarket(req, res);
  // });

}
