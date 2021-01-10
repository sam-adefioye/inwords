const GoogleStrategy = require('passport-google-oauth20').Strategy;

// load the auth variables
var configAuth = require('./auth');

function extractProfile (profile) {
  return {
    id: profile.id,
    displayName: profile.displayName,
    email: profile.emails[0].value
  };
}

module.exports = function(passport, pool) {
  const checkUser = 'SELECT EXISTS (SELECT * FROM users WHERE user_id = $1);'
  const inputUser = 'INSERT INTO users VALUES ($1, $2, $3);'
    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,

    }, function(token, refreshToken, profile, cb) {
          process.nextTick(function() {
            if (!pool.ended) {
              pool.connect();
            }
            pool.query(checkUser, [profile.id], function(err, result) {
                if(err) {
                  return cb(err);
                }

                if(result && result.rows.length && result.rows[0].exists) {
                  cb(null, extractProfile(profile));
                } else {
                  pool.query(inputUser, [profile.id, profile.displayName, profile.emails[0].value], function(err, result) {
                    if(err) {
                      return cb(err);
                    }

                    cb(null, extractProfile(profile));
                  })
                }
              })
          })
          cb(null, extractProfile(profile));
    }));

      // used to serialize the user for the session
    passport.serializeUser(function(user, cb) {
        cb(null, user);
    });

    // used to deserialize the user
    passport.deserializeUser(function(obj, cb) {
        cb(null, obj);
    });

};
