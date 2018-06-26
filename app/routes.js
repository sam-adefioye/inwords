module.exports = function(app, passport) {
  const query = 'SELECT N.title AS n_title, NT.note_text AS n_content\
  FROM notes AS N, notes_text AS NT, users AS u\
  WHERE $1 = u.user_id id AND u.user_id = N.goog_id AND N.goog_id = NT.id;'

  app.get('/', (req, res) => res.render('pages/index'));
  app.get('/auth/login', (req, res, next) => {
    if (req.query.return) {
      req.session.oauth2return = req.query.return;
    }
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  app.get('/auth/google/callback',
    passport.authenticate('google', {
      successRedirect : '/notes',
      failureRedirect : '/'
    })
  );
  app.get('/notes', authRequired, function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(query, [req.user.id], function(err, result) {
        done();
        if(err){
          console.error(err);
          res.send("Error " + err);
        } else {
          res.render('/pages/notes', {results: result.rows});
        }
      })
    })
  });
  app.get('/notes/new', function(req, res) {
    res.render('pages/new');
  });
  app.get('/help', function(req, res) {
    res.render('pages/help');
  });
  app.get('/about', function(req, res) {
    res.render('pages/about');
  });
};

function authRequired (req, res, next) {
  if (!req.user) {
    req.session.oauth2return = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
}
