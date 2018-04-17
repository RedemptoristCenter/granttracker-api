const router = require('express').Router();
const db = require('../db/db')
const checkAuth = require('./utils').checkAuth;

router.use(checkAuth);

router.post('/search', (req, res) => {
  const { grantName=null, minAmount=null, maxAmount=null, startDate=null, endDate=null } = req.body;
  const qGrantName = `%${grantName}%`;
  const qMinAmount = minAmount ? minAmount : 0;
  const qMaxAmount = maxAmount ? maxAmount : 1000000;
  const qStartDate = startDate ? startDate : 0;
  const qEndDate = endDate ? endDate : moment().add(5, 'y').valueOf();
  // console.log(qGrantName);

  let qString, qParams;

  if (grantName) {
      qString = 'select * from grant_data where grant_name LIKE ? AND initial_amount BETWEEN ? AND ? AND start_dt_tm >= ? AND end_dt_tm <= ?';
      qParams = [qGrantName, qMinAmount, qMaxAmount, qStartDate, qEndDate];
  } else {
      qString = 'select * from grant_data where initial_amount BETWEEN ? AND ? AND start_dt_tm >= ? AND end_dt_tm <= ?';
      qParams = [qMinAmount, qMaxAmount, qStartDate, qEndDate];
  }
  console.log(qParams);
  db.query(qString, qParams, function(err, data, fields) {
      // console.log(data);
      res.send(data);
  })
});

router.post('/', (req, res) => {
  let { grant_name='', initial_amount=0, remaining_amount=0, start_dt_tm=0, end_dt_tm=0 } = req.body;

  if (typeof initial_amount === 'string') {
      initial_amount = Number(initial_amount.replace(/[^0-9\.-]+/g,""));
  }
  console.log(initial_amount);

  if (typeof remaining_amount === 'string') {
      remaining_amount = Number(remaining_amount.replace(/[^0-9\.-]+/g,""));
  }
  console.log(remaining_amount);

  const newGrant = { grant_name, initial_amount, remaining_amount, start_dt_tm, end_dt_tm };

  db.query('INSERT INTO grant_data SET ?', newGrant, function(err, results, fields) {
      if (err) { return res.send(err) }

      res.send(results);
  })
});

router.post('/update/:grantId', (req, res) => {
  let { grant_name, initial_amount, remaining_amount, start_dt_tm, end_dt_tm } = req.body;
  const grantId = req.params.grantId;
  
  if (typeof initial_amount === 'string') {
      initial_amount = Number(initial_amount.replace(/[^0-9\.-]+/g,""));
  }
  console.log(initial_amount);

  if (typeof remaining_amount === 'string') {
      remaining_amount = Number(remaining_amount.replace(/[^0-9\.-]+/g,""));
  }
  console.log(remaining_amount);
  
  const modifiedGrant = [grant_name, initial_amount, remaining_amount, start_dt_tm, end_dt_tm, grantId];

  let qString = 'UPDATE grant_data SET grant_name=?, initial_amount=?, remaining_amount=?,';
  qString += ' start_dt_tm=?, end_dt_tm=? WHERE grant_id=?';
  db.query(qString, modifiedGrant, function(err, results, fields) {
      if (err) { res.send(err) }

      res.send(results);
  });
});

router.get('/:grantId', (req, res) => {
  const grantId = req.params.grantId;

  if (grantId === 'current') {
      const curDate = moment().unix();
      db.query('SELECT * FROM grant_data WHERE start_dt_tm <= ? AND end_dt_tm >= ?', [curDate, curDate], function(err, data, fields) {
          res.send(data);
      });
  } else {
      db.query('SELECT * FROM grant_data WHERE grant_id = ?', [grantId], function(err, data, fields) {
          res.send(data[0]);
      });
  } 
});

router.get('/:grantId/records', (req, res) => {
  const grantId = req.params.grantId;

  let qString = 'select c.Fname,c.Lname,tr.amount AS Trans_amount,gd.grant_name,gd.remaining_amount AS';
  qString += ' Remaining_total,gd.initial_amount AS Grant_total,t.date';
  qString += ' from client as c,transaction as t,trans_reltn as tr,grant_data as gd';
  qString += ' where c.client_id = t.client_id';
  qString += ' and t.trans_id = tr.trans_id';
  qString += ' and tr.grant_id = gd.grant_id';
  qString += ' and gd.grant_id = ?';

  db.query(qString, [grantId], function(err, data, fields) {
      res.send(data);
  });
});

router.get('/:grantId/report', (req, res) => {
  const grant_id = req.params.grantId;
  let grantInfo, grantTrans;

  const grantInfoProm = new Promise(function(resolve, reject) {
      const qString = 'SELECT * FROM grant_data WHERE grant_id=?';
      db.query(qString, [grant_id], function(err, results, fields) {
          if (err) { return reject(err) }

          return resolve(results);
      });
  });

  grantInfoProm.then(results => {
      grantInfo = results[0];

      const grantTransProm = new Promise(function(resolve, reject) {
          let qString = 'SELECT tr.amount, c.*, t.reason_cd';
          qString += ' FROM client as c, transaction as t, trans_reltn as tr, grant_data as gd';
          qString += ' WHERE c.client_id=t.client_id';
          qString += ' AND t.trans_id=tr.trans_id';
          qString += ' AND tr.grant_id=gd.grant_id';
          qString += ' AND gd.grant_id=?';

          db.query(qString, [grant_id], function(err, results, fields) {
              if (err) { return reject(err) }

              return resolve(results);
          });
      });

      return grantTransProm;

  }).then(results => {
      grantTrans = results;

      return res.send({grantInfo, grantTrans});
  }).catch(e => {
      return res.send(e);
  });
});

module.exports = router;