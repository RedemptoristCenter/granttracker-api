const router = require('express').Router();
const db = require('../db/db')
const checkAuth = require('./utils').checkAuth;

router.use(checkAuth);

router.post('/', (req, res) => {
  const { birth_date, Fname, Lname, Mname,
          address, city, state, zipcode, phone_num,
          house_size, ssn_cd, gender_cd, family_type_cd,
          reltn_to_hoh_cd, ethnicity_cd, race_cd, veteran_cd,
          disability_cd, housing_cd, hoh_client_id,
          income_source_obj={}, non_cash_obj={}, expenditure_obj={}, 
          total_household_income, total_net_income
  } = req.body;

  const newClient = {
      Fname,
      Lname,
      Mname,
      birth_date,
      address,
      city,
      state,
      zipcode,
      phone_num,
      house_size,
      ssn_cd,
      gender_cd,
      family_type_cd,
      reltn_to_hoh_cd,
      ethnicity_cd,
      race_cd,
      veteran_cd,
      disability_cd,
      housing_cd,
      hoh_client_id,
      income_source_obj: JSON.stringify(income_source_obj),
      non_cash_obj: JSON.stringify(non_cash_obj),
      expenditure_obj: JSON.stringify(expenditure_obj),
      total_household_income,
      total_net_income
  }

  db.query('INSERT INTO client SET ?', newClient, function(err, results, fields) {
      if (err) { return res.send(err); }

      res.send({ "client_id": results.insertId });
  });
});

router.post('/update/:clientId', (req, res) => {
  const { birth_date, Fname, Lname, Mname,
      address, city, state, zipcode, phone_num,
      house_size, ssn_cd, gender_cd, family_type_cd,
      reltn_to_hoh_cd, ethnicity_cd, race_cd, veteran_cd,
      disability_cd, housing_cd, hoh_client_id,
      income_source_obj, non_cash_obj, expenditure_obj,
      total_household_income, total_net_income
  } = req.body;

  const clientId = parseInt(req.params.clientId, 10);

  const modifiedClient = [
      Fname,
      Lname,
      Mname,
      birth_date,
      address,
      city,
      state,
      zipcode,
      phone_num,
      house_size,
      ssn_cd,
      gender_cd,
      family_type_cd,
      reltn_to_hoh_cd,
      ethnicity_cd,
      JSON.stringify(income_source_obj),
      JSON.stringify(expenditure_obj),
      JSON.stringify(non_cash_obj),
      total_household_income,
      total_net_income,
      race_cd,
      veteran_cd,
      disability_cd,
      housing_cd,
      hoh_client_id,
      clientId
  ]
  console.log(modifiedClient);
  let qString = 'UPDATE client SET Fname=?, Lname=?, Mname=?, birth_date=?, address=?, city=?, state=?, zipcode=?,';
  qString += ' phone_num=?, house_size=?, ssn_cd=?, gender_cd=?, family_type_cd=?, reltn_to_hoh_cd=?, ethnicity_cd=?,';
  qString += ' income_source_obj=?, expenditure_obj=?, non_cash_obj=?, total_household_income=?, total_net_income=?,'
  qString += ' race_cd=?, veteran_cd=?, disability_cd=?, housing_cd=?, hoh_client_id=? WHERE client_id = ?';

  db.query( qString, modifiedClient, function(err, results, fields) {
      if (err) { return res.send(err)}
      if (reltn_to_hoh_cd != 17) {
          db.query( 'UPDATE client SET hoh_client_id = NULL WHERE hoh_client_id=?', [clientId], function(err, results, fields) {
              if (err) { return res.send(err) }

              res.send(results);
          })
      } else {
          res.send(results);
      }
  });
});

router.post('/search', (req, res) => {
  const { lastName=null, firstName=null, birthDate=null } = req.body;
  
  const qLast = lastName ? `'%${lastName}%'` : "'%_%'";
  const qFirst = firstName ? `'%${firstName}%'` : "'%_%'";
  let qString;
  const selects = 'Fname,Lname,address,birth_date,client_id';

  if (firstName && lastName) {
      if (birthDate) {
          qString = `SELECT * FROM client WHERE Lname LIKE ${qLast} AND Fname LIKE ${qFirst} AND birth_date=${birthDate}`;
      } else {
          qString = `SELECT * FROM client WHERE Lname LIKE ${qLast} AND Fname LIKE ${qFirst}`;
      }
  } else {
      if (birthDate) {
          qString = `SELECT * FROM client WHERE Lname (LIKE ${qLast} OR Fname LIKE ${qFirst}) AND birth_date=${birthDate}`;
      } else {
          qString = `SELECT * FROM client WHERE Lname LIKE ${qLast} OR Fname LIKE ${qFirst}`;
      }
  }

  //console.log(qString);
  
  db.query(qString, function(err, data, fields) {
      // console.log(data);
      res.send(data);
  })
  // res.send({
  //     lastName,
  //     firstName,
  //     birthDate
  // });

});

router.get('/:clientId', (req, res) => {
  const clientId = req.params.clientId;
  
  db.query('SELECT * FROM client WHERE client_id = ?', [clientId], function(err, data, fields) {
      // console.log(data);
      const client = data[0];
      client.income_source_obj = JSON.parse(client.income_source_obj);
      client.expenditure_obj = JSON.parse(client.expenditure_obj);
      client.non_cash_obj = JSON.parse(client.non_cash_obj);

      if (client.hoh_client_id) {
          db.query('SELECT * FROM client WHERE client_id = ?', [client.hoh_client_id], function(err, data, fields) {
              const hoh = data[0];
              hoh.income_source_obj = JSON.parse(hoh.income_source_obj);
              hoh.expenditure_obj = JSON.parse(hoh.expenditure_obj);
              hoh.non_cash_obj = JSON.parse(hoh.non_cash_obj);
              client.hoh = hoh;
              res.send(client)
          })
      } else {
          res.send(client);
      }
      
  });
});

router.get('/:clientId/records', (req, res) => {
  const clientId = req.params.clientId;

  let qString = 'select c.Fname, c.Lname, tr.amount AS Trans_amount, gd.grant_name, gd.remaining_amount AS Remaining_total, gd.initial_amount AS Grant_total, t.date';
  qString += ' from client as c, transaction as t, trans_reltn as tr, grant_data as gd';
  qString += ' where c.client_id = t.client_id';
  qString += ' and t.trans_id = tr.trans_id';
  qString += ' and tr.grant_id = gd.grant_id';
  qString += ' and c.client_id = ?';

  db.query(qString, [clientId], function(err, data, fields) {
      res.send(data);
  });
})

router.get('/:clientId/household', (req, res) => {
  const clientId = req.params.clientId;
  let qString = 'SELECT * FROM client WHERE hoh_client_id=?';

  db.query(qString, [clientId], function(err, results, fields) {
      res.send(results);
  });
});

router.post('/:clientId/household', (req, res) => {
  const { householdMembers } = req.body;
  console.log(householdMembers);
  const clientId = req.params.clientId;
  console.log(clientId);

  const qString = 'UPDATE client SET hoh_client_id = NULL WHERE hoh_client_id=?';
  db.query(qString, [clientId], function(err, results, fields) {
      console.log("inside");
      console.log(results);
      const qString = 'UPDATE client SET hoh_client_id=? WHERE client_id IN (?)';

      db.query(qString, [clientId, householdMembers], function(err, results, fields) {
          res.send(results);
      });
  });
});

module.exports = router;