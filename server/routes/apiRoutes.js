const router = require('express').Router();
// const passport = require('passport');
// const moment = require('moment');

router.get('/test', (req, res) => {
    res.send({'text': 'hello'});
});

router.post('/client/search', (req, res) => {
    const { lastName=null, firstName=null, birthDate=null } = req.body;

    res.send({
        lastName,
        firstName,
        birthDate
    });

});

router.get('/client/:clientId', (req, res) => {

});

module.exports = router;