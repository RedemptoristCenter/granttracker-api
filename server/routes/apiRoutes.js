const router = require('express').Router();
const db = require('../db/db')
// const passport = require('passport');
// const moment = require('moment');


router.get('/test', (req, res) => {
    res.send({'text': 'hello'});
});

router.post('/client/search', (req, res) => {
    const { lastName=null, firstName=null, birthDate=null } = req.body;
    
    const qLast = lastName ? `'${lastName}%'` : "'%abc%'";
    const qFirst = firstName ? `'${firstName}%'` : "'%abc%'";
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

    console.log(qString);
    
    db.query(qString, function(err, data, fields) {
        console.log(data);
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
    
    res.send({ clientId });
});

module.exports = router;