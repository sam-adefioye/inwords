module.exports = function(app, passport) {
  const notesQuery = 'SELECT N.title AS n_title, NT.note_no AS n_id\
  FROM notes AS N, notes_text AS NT, users AS u\
  WHERE u.user_id = $1 AND u.user_id = N.goog_id AND N.id = NT.id;';

  const idQuery = 'SELECT NT.note_no AS n_id, NT.note_text AS n_content\
  FROM notes_text AS NT WHERE n_id = $1;';

  const newQuery = 'INSERT INTO notes(title, creation_date, goog_id) VALUES ($1, CURRENT_DATE, $2)\
  RETURNING id AS text_id; INSERT INTO notes_text(id, note_text, note_no) VALUES (text_id, $3, $4);';

  const deleteQuery = 'DELETE FROM notes_text AS NT WHERE NT.note_no = $1 RETURNING id AS note_id;\
  DELETE FROM notes AS N WHERE note_id = N.id;';

  const editQuery = 'SELECT NT.note_text AS text, N.title AS title FROM notes_text AS NT, notes AS N\
  WHERE NT.note_no = $1 AND N.id = NT.id;';

  const editQuery2 = 'UPDATE notes_text SET note_text = $1 WHERE note_no = $2 RETURNING id AS ret_id;\
  UPDATE notes SET title = $3 WHERE id = ret_id;';

  const delUserQuery = 'DELETE FROM users WHERE user_id = $1;';

  function createNoteId(a) {
    var d = new Date();
    var str = a.toString();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var min = d.getMinutes();
    var hour = d.getHours();
    var first = str.substring(0,3);
    var last = str.substring(18);
    var finish = first.toString() + last.toString();
    var final = finish + month.toString() + day.toString() + hour.toString() + min.toString();
    return final;
  }

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
      client.query(notesQuery, [req.user.id], function(err, result) {
        done();
        if(err){
          console.error(err);
          res.send("Error " + err);
        } else {
          res.render('/pages/notes', {results: result.rows, name: req.user.displayName});
        }
      })
    })
  });
  app.get('/notes/:id', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(idQuery, [req.params.id], function(err, result) {
        done();
        if(err){
          console.error(err);
          res.send("Error " + err);
        } else {
          res.render('/pages/note', {results: result.rows, name: req.user.displayName});
        }
      })
    })
  });
  app.get('/notes/:id/edit', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(editQuery, [req.params.id], function(err, result) {
        done();
        if(err){
          console.error(err);
          res.send("Error " + err);
        } else {
          res.render('/pages/edit', {results: result.rows});
        }
      })
    })
  });
  app.post('/notes/:id/edit', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(editQuery2, [req.body.notes, req.params.id, req.body.title], function(err, result) {
        done();
        if(err){
          console.error(err);
          res.send("Error " + err);
        } else {
          res.render('/pages/notes');
        }
      })
    })
  });
  app.post('/notes/:id/delete', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(deleteQuery, [req.params.id], function(err, result) {
        done();
        if(err){
          console.error(err);
          res.send("Error " + err);
        } else {
          res.render('/pages/notes', {});
        }
      })
    })
  });
  app.get('/new', function(req, res) {
    res.render('pages/new');
  });
  app.post('/new', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(newQuery, [req.body.title, req.user.id, req.body.notes, createNoteId(req.user.id)], function(err, result) {
        done();
        if(err){
          console.error(err);
          res.send("Error " + err);
        } else {
          res.render('/pages/notes');
        }
      })
    })
  });
  app.get('/help', function(req, res) {
    res.render('pages/help', {name: req.user.displayName});
  });
  app.get('/about', function(req, res) {
    res.render('pages/about');
  });
  app.get('/account', function(req, res) {
    res.render('pages/account', {name: req.user.displayName});
  });
  app.post('/account/delete', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(delUserQuery, [req.user.id], function(err, result) {
        done();
        if(err){
          console.error(err);
          res.send("Error " + err);
        } else {
          res.render('/pages/index');
        }
      })
    })
  });
  app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

function authRequired (req, res, next) {
  if (!req.user) {
    req.session.oauth2return = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
}
