const router = require('express').Router();
// const passport = require('passport');
// const moment = require('moment');

router.get('/test', (req, res) => {
    res.send({'text': 'hello'});
});

module.exports = router;