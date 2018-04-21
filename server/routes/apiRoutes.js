const router = require('express').Router();
const moment = require('moment');
const _ = require('lodash');
const db = require('../db/db')
const passport = require('passport');
// const moment = require('moment');


router.get('/test', (req, res) => {
    console.log(req.user);
    res.send({'text': 'hello'});
});

router.post('/login', 
  passport.authenticate('local-signin'),
  (req, res) => {
    res.send({message: "success"});
  }
);

router.get('/logout', (req, res) => {
    req.logout();
    res.status(200).send();
})

router.use('/client', require('./client'));

router.use('/grant', require('./grant'));

router.use('/transaction', require('./transaction'));

router.use('/codeset', require('./codeset'));

module.exports = router;