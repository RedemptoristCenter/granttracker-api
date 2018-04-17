const db = require('../db/db');

module.exports.checkAuth = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).send();
  }
}

module.exports.dbProm = function(qString, params) {
  return new Promise(function(resolve, reject) {
    db.query(qString, params, function(err, results) {
      if (err) { return reject(err) }

      return resolve(results);
    });
  });
}