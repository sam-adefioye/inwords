module.exports = function(app, passport, pool) {
  const listNotes = 'SELECT N.title AS n_title, N.id AS id, NT.user_id AS n_id\
  FROM notes AS N, notes_text AS NT, users AS u\
  WHERE u.user_id = $1 AND u.user_id = N.goog_id AND N.id = NT.id';

  const newNote1 = 'INSERT INTO notes(title, goog_id) VALUES ($1, $2) RETURNING id';

  const newNote2 = 'INSERT INTO notes_text(id, note_text, user_id) VALUES ($1, $2, $3)';

  const delete1 = 'DELETE FROM notes_text AS NT WHERE NT.id = $1 RETURNING id';

  const delete2 = 'DELETE FROM notes AS N WHERE N.id = $1';

  const viewNote = 'SELECT NT.note_text AS text, N.title AS title FROM notes_text AS NT, notes AS N\
  WHERE NT.id = $1 AND N.id = NT.id';

  const editNote1 = 'UPDATE notes_text SET note_text = $1 WHERE id = $2 RETURNING id';

  const editNote2 = 'UPDATE notes SET title = $1 WHERE id = $2';

  const delUserQuery = 'DELETE FROM users WHERE user_id = $1';

  app.get('/', (req, res) => res.render('index', {loggedIn: isLoggedIn(req)}));
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
  app.get('/notes', authRequired, (req, res) => {
    
    pool.query(listNotes, [req.user.id], function(err, result) {
      if(err){
        console.error(err);
        res.send("Error " + err);
      } else {
        res.render('notes', {results: result.rows, name: req.user.displayName});
      }
      
    })
  });
  app.get('/notes/:id', authRequired, (req, res) => {
    
    pool.query(viewNote, [req.params.id], function(err, result) {
      if(err){
        console.error(err);
        res.send("Error " + err);
      } else {
        res.render('note', {results: result.rows, name: req.user.displayName, id: req.params.id});
      }
      
    })
  });
  app.post('/notes/:id', (req, res) => {
    pool.connect((err, client, done) => {
      const shouldAbort = err => {
        if (err) {
          console.error('Error in transaction', err.stack)
          client.query('ROLLBACK', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            done()
          })
        }
        return !!err
      }
      
      client.query('BEGIN', function(err) {
        if (shouldAbort(err)) return
  
        var editNotes = req.body.notes;
        var noteID = req.params.id;
        client.query(editNote1, [editNotes.toString(), noteID], (err, result) => {
          if (shouldAbort(err)) return
  
          const retval3 = result.rows[0].id;
          var editTitle = req.body.title;
          client.query(editNote2, [editTitle.toString(), retval3], (err, result) => {
            if (shouldAbort(err)) return

            client.query('COMMIT', (err, result) => {
              if (err) {
                console.error('Error committing transaction', err.stack);
              }
              done()
              res.redirect('/notes');
            })
          })
        })
        
      })
    })
  });
  app.delete('/notes/:id/delete', (req, res) => {
    pool.connect((err, client, done) => {
      const shouldAbort = err => {
        if (err) {
          console.error('Error in transaction', err.stack)
          client.query('ROLLBACK', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            done()
          })
        }
        return !!err
      }
      
      client.query('BEGIN', function(err) {
        if (shouldAbort(err)) return
  
        var noteID = req.params.id;
        client.query(delete1, [noteID], function(err, result) {
          if (shouldAbort(err)) return
  
          const retval2 = result.rows[0].id;
          client.query(delete2, [retval2], function(err, result) {
            if (shouldAbort(err)) return
            client.query('COMMIT', function(err, result) {
              if (err) {
                console.error('Error committing transaction', err.stack);
              }
              done()
              res.send(200);
            })
          })
        })
      })
    })
  });
  app.get('/new', authRequired, (req, res) => {
    res.render('new');
  });
  app.post('/new', (req, res) => {
    pool.connect((err, client, done) => {
      const shouldAbort = err => {
        if (err) {
          console.error('Error in transaction', err.stack)
          client.query('ROLLBACK', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            done()
          })
        }
        return !!err
      }
      
      pool.query('BEGIN', function(err) {
        if (shouldAbort(err)) return
  
        var title = req.body.title;
        pool.query(newNote1, [title.toString(), req.user.id], function(err, result) {
          if (shouldAbort(err)) return
  
          const noteId = result.rows[0].id;
          var text = req.body.notes;
          pool.query(newNote2, [noteId, text.toString(), req.user.id], function(err, result) {
            if (shouldAbort(err)) return
            pool.query('COMMIT', function(err, result) {
              if (err) {
                console.error('Error committing transaction', err.stack);
              }
              done()
              res.redirect('/notes');
            })
          })
        })
        
      })
    })
  });

  app.get('/help', (req, res) => {
    res.render('help', {loggedIn: isLoggedIn(req), name: req.user.displayName});
  });
  app.get('/about', (req, res) => {
    res.render('about', {loggedIn: isLoggedIn(req), name: req.user.displayName});
  });
  app.get('/account', authRequired, (req, res) => {
    res.render('account', {name: req.user.displayName});
  });
  app.get('/account/delete', (req, res) => {
    
    pool.query(delUserQuery, [req.user.id], function(err, result) {
      if(err){
        console.error(err);
        res.send("Error " + err);
      } else {
        req.logout();
        res.redirect('/');
      }
      pool.end();
    })
  });
  app.get('/logout', (req, res) => {
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

const isLoggedIn = (req) => req.user ? true : false;
