const router = require('express').Router();
const moment = require('moment');
const db = require('../db/db')
// const passport = require('passport');
// const moment = require('moment');


router.get('/test', (req, res) => {
    res.send({'text': 'hello'});
});

router.post('/client/search', (req, res) => {
    const { lastName=null, firstName=null, birthDate=null } = req.body;
    
    const qLast = lastName ? `'%${lastName}%'` : "'%abc%'";
    const qFirst = firstName ? `'%${firstName}%'` : "'%abc%'";
    let qString;
    const selects = 'Fname,Lname,address,birth_date,client_id';

    if (firstName && lastName) {
        if (birthDate) {
            qString = `SELECT ${selects} FROM client WHERE Lname LIKE ${qLast} AND Fname LIKE ${qFirst} AND birth_date=${birthDate}`;
        } else {
            qString = `SELECT ${selects} FROM client WHERE Lname LIKE ${qLast} AND Fname LIKE ${qFirst}`;
        }
    } else {
        if (birthDate) {
            qString = `SELECT ${selects} FROM client WHERE Lname (LIKE ${qLast} OR Fname LIKE ${qFirst}) AND birth_date=${birthDate}`;
        } else {
            qString = `SELECT ${selects} FROM client WHERE Lname LIKE ${qLast} OR Fname LIKE ${qFirst}`;
        }
    }

    // console.log(qString);
    
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

router.get('/client/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    
    db.query('SELECT * FROM client WHERE client_id = ?', [clientId], function(err, data, fields) {
        // console.log(data);
        res.send(data[0]);   
    });
});

router.get('/client/:clientId/records', (req, res) => {
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

router.post('/grant/search', (req, res) => {
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

router.get('/grant/:grantId', (req, res) => {
    const grantId = req.params.grantId;

    db.query('SELECT * FROM grant_data WHERE grant_id = ?', [grantId], function(err, data, fields) {
        res.send(data[0]);
    });
});

router.get('/codeset', (req, res) => {
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

    console.log(parsedCodeSet);
    res.send(parsedCodeSet);
}

module.exports = router;