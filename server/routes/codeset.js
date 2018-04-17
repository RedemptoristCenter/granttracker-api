const router = require('express').Router();
const db = require('../db/db')
const checkAuth = require('./utils').checkAuth;

router.use(checkAuth);

router.get('/', (req, res) => {
  const parsedCodeSet = getCodeSets(res);
});

function getCodeSets(res) {
  db.query('SELECT * FROM code_set', function(err, data, fields) {
      getCodeValues(res, data);
  });
}

function getCodeValues(res, codeSets) {
  db.query('SELECT * FROM code_value_alias', function(err, data, fields) {
      parseCodeValues(res, codeSets, data);
  });
}

function parseCodeValues(res, codeSets, codeValues) {
  let parsedCodeSet = {};
  for (let i=0; i < codeSets.length; i++){
      let codeSetName = codeSets[i].codeset_name;
      let codes = codeValues.filter(value => value.codeset_id == codeSets[i].codeset_id).map(value => {
          return {
              name: value.codevalue_name,
              id: value.codevalue_id
          }
      })
      parsedCodeSet[codeSetName] = codes
  }

  // console.log(parsedCodeSet);
  res.send(parsedCodeSet);
}

module.exports = router;