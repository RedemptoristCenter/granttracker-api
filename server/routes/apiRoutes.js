const router = require('express').Router();
const moment = require('moment');
const _ = require('lodash');
const db = require('../db/db')
// const passport = require('passport');
// const moment = require('moment');


router.get('/test', (req, res) => {
    res.send({'text': 'hello'});
});

router.post('/client', (req, res) => {
    const { birth_date, Fname, Lname, Mname,
            address, city, state, zipcode, phone_num,
            house_size, ssn_cd, gender_cd, family_type_cd,
            reltn_to_hoh_cd, ethnicity_cd, race_cd, veteran_cd,
            disability_cd, housing_cd, hoh_client_id
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
        hoh_client_id
    }

    db.query('INSERT INTO client SET ?', newClient, function(err, results, fields) {
        if (err) { return res.send(err); }

        res.send(results);
    });
});

router.post('/client/update/:clientId', (req, res) => {
    const { birth_date, Fname, Lname, Mname,
        address, city, state, zipcode, phone_num,
        house_size, ssn_cd, gender_cd, family_type_cd,
        reltn_to_hoh_cd, ethnicity_cd, race_cd, veteran_cd,
        disability_cd, housing_cd, hoh_client_id
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
    qString += ' race_cd=?, veteran_cd=?, disability_cd=?, housing_cd=?, hoh_client_id=? WHERE client_id = ?';

    db.query( qString, modifiedClient, function(err, results, fields) {
        if (reltn_to_hoh_cd != 17) {
            db.query( 'UPDATE client SET hoh_client_id = NULL WHERE hoh_client_id=?', [clientId], function(err, results, fields) {
                res.send(results);
            })
        } else {
            res.send(results);
        }
    });
});

router.post('/client/search', (req, res) => {
    const { lastName=null, firstName=null, birthDate=null } = req.body;
    
    const qLast = lastName ? `'%${lastName}%'` : "'%abc%'";
    const qFirst = firstName ? `'%${firstName}%'` : "'%abc%'";
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

router.get('/client/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    
    db.query('SELECT * FROM client WHERE client_id = ?', [clientId], function(err, data, fields) {
        // console.log(data);
        const client = data[0];
        if (client.hoh_client_id) {
            db.query('SELECT * FROM client WHERE client_id = ?', [client.hoh_client_id], function(err, data, fields) {
                client.hoh = data[0];
                res.send(client)
            })
        } else {
            res.send(client);
        }
        
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

router.get('/client/:clientId/household', (req, res) => {
    const clientId = req.params.clientId;
    let qString = 'SELECT * FROM client WHERE hoh_client_id=?';

    db.query(qString, [clientId], function(err, results, fields) {
        res.send(results);
    });
});

router.post('/client/:clientId/household', (req, res) => {
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

router.post('/grant', (req, res) => {
    const { grant_name='', initial_amount=0, remaining_amount=0, start_dt_tm=0, end_dt_tm=0 } = req.body;
    const newGrant = { grant_name, initial_amount, remaining_amount, start_dt_tm, end_dt_tm };

    if (typeof initial_amount === 'string') {
        initial_amount = Number(initial_amount.replace(/[^0-9\.-]+/g,""));
    }
    if (typeof remaining_amount === 'string') {
        remaining_amount = Number(remaining_amount.replace(/[^0-9\.-]+/g,""));
    }

    db.query('INSERT INTO grant_data SET ?', newGrant, function(err, results, fields) {
        if (err) { return res.send(err) }

        res.send(results);
    })
});

router.post('/grant/update/:grantId', (req, res) => {
    const { grant_name, initial_amount, remaining_amount, start_dt_tm, end_dt_tm } = req.body;
    const grantId = req.params.grantId;
    const modifiedGrant = [grant_name, initial_amount, remaining_amount, start_dt_tm, end_dt_tm, grantId];

    let qString = 'UPDATE client SET grant_name=?, initial_amount=?, remaining_amount=?,';
    qString = ' start_dt_tm=?, end_dt_tm? WHERE grant_id=?';
    db.query(qString, modifiedGrant, function(err, results, fields) {
        res.send(results);
    });
});

router.get('/grant/:grantId', (req, res) => {
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

router.get('/grant/:grantId/records', (req, res) => {
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

router.get('/grant/:grantId/report', (req, res) => {
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

        return new Promise(function(resolve, reject) {
            const qString = 'SELECT tr.amount, c.*, t.reason_cd';
            qString += ' FROM client as c, transaction as t, trans_reltn as tr, grant_data as gd';
            qString += ' WHERE c.client_id=t.client_id';
            qString += ' AND t.trans_id=tr.trans_id';
            qString += ' AND tr.grant_id=gd.grant_id';
            qString += ' AND gd.grant_id=?';

            db.query(qString, [grant_id], function(err, results, fields) {
                if (err) { return reject(err) }
            })
        })
    })
});

router.post('/transaction', (req, res) => {
    const { client_id, reason_cd, trans_type, trans_notes, assistance_transaction_obj, grants } = req.body;
    // grants = [{grant_id, amount},...]
    const grantIds = grants.map(grant => grant.grant_id);
    let grantRows
    // grantRows = [{grant_id, grant_name, initial_amount, remaining_amount, start_dt_tm, end_dt_tm}]
    
    db.query('SELECT * FROM grant_data WHERE grant_id IN (?)', [grantIds], function(err, results, fields) {
        for (let i=0; i < results.length; i++) {
            console.log(results);
            const grant = grants.filter(grant => grant.grant_id === results[i].grant_id)[0];
            console.log(grant);
            grantRows = results;
            if (results[i].remaining_amount < grant.amount) {
                return res.status(400).send();
            }
        }
        const date = moment().unix();
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
});

router.get('/transaction/delete/:transId', (req, res) => {
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