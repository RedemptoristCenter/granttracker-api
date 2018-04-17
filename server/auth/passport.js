const db = require('../db/db');

function parseUser(user) {
  return {
    user_name: user.user_name,
    user_id: user.user_id
  }
}

module.exports = function (passport) {
  const LocalStrategy = require('passport-local').Strategy;

  passport.use('local-signin', new LocalStrategy(
    {
      usernameField: 'user_name',
      passwordField: 'user_pass',
      passReqToCallback: true
    },
    function(req, user_name, user_pass, done) {
      const userSearchProm = new Promise(function(resolve, reject) {
        const qString = 'SELECT * FROM user WHERE user_name=? AND user_pass=?';
        db.query(qString, [user_name, user_pass], function(err, results) {
          if (err) { return reject(err) }

          if (results.length === 1) {
            return resolve( results[0] );
          } else {
            return resolve( null );
          }
        });
      });

      userSearchProm.then(user => {
        if (user) {
          return done(null, parseUser(user));
        } else {
          return done(null, false, {
            message: 'Invalid Login'
          });
        }
      }).catch(err => {
        return done(err);
      })
      
      
      
      // User.findByCredentials(email, password)
      //   .then(user => {
      //     //console.log(user);
      //     return done(null, user);
      //   })
      //   .catch(e => (done(null, false, e)))
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user.user_id);
  });

  passport.deserializeUser(function(user_id, done) {
    console.log("deser deser deser");
    const userLookupProm = new Promise(function(resolve, reject) {
      const qString = 'SELECT * FROM user WHERE user_id=?';
      db.query(qString, [user_id], function(err, results) {
        if (err) { return reject(err) }
        
        if (results.length !== 1) {
          return reject( "user not found" );
        } else {
          return resolve(results[0]);
        }
      })
    });

    userLookupProm.then(user => {
      return done(null, parseUser(user));
    }).catch(err => done(e));
    
    
    
    // User.findById(userId).populate('profile').then(user => {
    //   if (user) {
    //     //console.log(user.parse());
    //     done(null, user.parse());
    //   } else {
    //     Promise.reject("user not found")
    //   }
    // }).catch(e => done(e));
  });
};