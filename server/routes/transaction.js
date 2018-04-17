const router = require('express').Router();
const db = require('../db/db')
const checkAuth = require('./utils').checkAuth;

router.use(checkAuth);

router.post('/', (req, res) => {
  let { client_id, reason_cd=null, trans_type, trans_notes, assistance_transaction_obj={}, grants=[] } = req.body;
  assistance_transaction_obj = JSON.stringify(assistance_transaction_obj);
  const date = moment().unix();

  if (grants.length > 0) {
      // grants = [{grant_id, amount},...]
      const grantIds = grants.map(grant => grant.grant_id);
      let grantRows
      // grantRows = [{grant_id, grant_name, initial_amount, remaining_amount, start_dt_tm, end_dt_tm}]
      
      db.query('SELECT * FROM grant_data WHERE grant_id IN (?)', [grantIds], function(err, results, fields) {
          if (err) { return res.send(err) }

          for (let i=0; i < results.length; i++) {
              console.log(results);
              const grant = grants.filter(grant => grant.grant_id === results[i].grant_id)[0];
              console.log(grant);
              grantRows = results;
              if (results[i].remaining_amount < grant.amount) {
                  return res.status(400).send();
              }
          }
          db.query('INSERT INTO transaction SET ?', {client_id, reason_cd, trans_type, trans_notes, assistance_transaction_obj, date}, function(err, results, fields) {
              if (err) {return res.send(err)}
              console.log(results);
              const trans_id = results.insertId;
              transRows = grants.map(grant => {
                  return [trans_id, grant.grant_id, grant.amount]
              });
          db.query("INSERT INTO trans_reltn (trans_id, grant_id, amount) VALUES ?", [transRows], function(err, results, fields) {
              if (err) {return res.send(err)}
                  // want updateGrants = [{grant_id, *remaining_amount},...]
                  const updateGrants = grants.map(grant => {
                      let grantRow = grantRows.filter(row => row.grant_id === grant.grant_id)[0];
                      let newRemaining = grantRow.remaining_amount - grant.amount;
                      return { 
                          grant_id: grant.grant_id,
                          remaining_amount: newRemaining
                      }
                  });

                  updateGrantsProms = updateGrants.map(update => {
                      return new Promise(function(resolve, reject) {
                          db.query('UPDATE grant_data SET remaining_amount=? WHERE grant_id=?', [update.remaining_amount, update.grant_id], function(err, data, fields) {
                              if (err) { reject(err) };
                              
                              resolve(data);
                          });
                      });
                  });

                  Promise.all(updateGrantsProms).then(results => {
                      res.send(results);
                  })
              //res.send(updateGrants);
          })
          });
      });
  } else {
      db.query('INSERT INTO transaction SET ?', {client_id, reason_cd, trans_type, trans_notes, assistance_transaction_obj, date}, function(err, results, fields) {
          if (err) { return res.send(err) }

          return res.send(results);
      })
  }
});

router.get('/delete/:transId', (req, res) => {
  const trans_id = req.params.transId;
  let transReltns;

  const transReltnProm = new Promise(function(resolve, reject) {
      db.query('SELECT * FROM trans_reltn WHERE trans_id=?', [trans_id], function(err, results, fields) {
          if (err) { return reject(err) }

          return resolve(results);
      });
  });

  transReltnProm.then(results => {
      transReltns = results;

      const updateGrantsProms = transReltns.map(transReltn => {
          return new Promise(function(resolve, reject) {
              const qString = 'UPDATE grant_data SET remaining_amount = remaining_amount + ? WHERE grant_id=?';
              db.query(qString, [transReltn.amount, transReltn.grant_id], function(err, results, fields) {
                  if (err) { return reject(err) }

                  return resolve(results);
              });
          });
      });

      return Promise.all(updateGrantsProms);

  }).then(results => {
      const removeTransReltnsProms = transReltns.map(transReltn => {
          return new Promise(function(resolve, reject) {
              const qString = 'DELETE FROM trans_reltn WHERE trans_id=?';
              db.query(qString, [trans_id], function(err, results, fields) {
                  if (err) { return reject(err) }

                  return resolve(results);
              });
          });
      });

      return Promise.all(removeTransReltnsProms);

  }).then(results => {
      const removeTransProm = new Promise(function(resolve, reject) {
          const qString = 'DELETE FROM transaction WHERE trans_id=?';
          db.query(qString, [trans_id], function(err, results, fields) {
              if (err) { return reject(err) }

              return resolve(results);
          });
      });

      return removeTransProm;
  }).then(results => {
      res.send(results);
  }).catch(e => {
      res.send(e);
  });
});

module.exports = router;