module.exports = function(app, passport, pg) {
  const notesQuery = 'SELECT N.title AS n_title, NT.note_no AS n_id\
  FROM notes AS N, notes_text AS NT, users AS u\
  WHERE u.user_id = $1 AND u.user_id = N.goog_id AND N.id = NT.id';

  const idQuery = 'SELECT NT.note_no AS n_id, NT.note_text AS n_content\
  FROM notes_text AS NT WHERE NT.note_no = $1';

  const newQuery1 = 'INSERT INTO notes(title, creation_date, goog_id) VALUES ($1, CURRENT_DATE, $2) RETURNING id';

  const newQuery2 = 'INSERT INTO notes_text(id, note_text, note_no) VALUES ($1, $2, $3)';

  const deleteQuery1 = 'DELETE FROM notes_text AS NT WHERE NT.note_no = $1 RETURNING id';

  const deleteQuery2 = 'DELETE FROM notes AS N WHERE N.id = $1';

  const editQuery = 'SELECT NT.note_text AS text, N.title AS title FROM notes_text AS NT, notes AS N\
  WHERE NT.note_no = $1 AND N.id = NT.id';

  const editQuery1 = 'UPDATE notes_text SET note_text = $1 WHERE note_no = $2 RETURNING id';

  const editQuery2 = 'UPDATE notes SET title = $1 WHERE id = $2';

  const delUserQuery1 = 'DELETE FROM notes, notes_text JOIN notes_text ON notes.id = notes_text.id';

  const delUserQuery = 'DELETE FROM users WHERE user_id = $1';

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

  app.get('/', (req, res) => res.render('index'));
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
          res.render('notes', {results: result.rows, name: req.user.displayName});
        }
      })
    })
  });
  app.get('/notes/:id', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(editQuery, [req.params.id], function(err, result) {
        done();
        if(err){
          console.error(err);
          res.send("Error " + err);
        } else {
          res.render('note', {results: result.rows, name: req.user.displayName, id: req.params.id});
        }
      })
    })
  });
  // app.get('/notes/:id/edit', function(req, res) {
  //   pg.connect(process.env.DATABASE_URL, function(err, client, done) {
  //     client.query(editQuery, [req.params.id], function(err, result) {
  //       done();
  //       if(err){
  //         console.error(err);
  //         res.send("Error " + err);
  //       } else {
  //         res.render('edit', {results: result.rows, id: req.params.id});
  //       }
  //     })
  //   })
  // });
  app.post('/notes/:id', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      const shouldAbort = (err) => {
        if (err) {
          console.error('Error in transaction', err.stack)
          client.query('ROLLBACK', (err) => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            // release the client back to the pg
            done()
          })
        }
        return !!err
      }

      client.query('BEGIN', function(err) {
        if(shouldAbort(err)) return

        var editNotes = req.body.notes;
        var noteID = req.params.id;
        client.query(editQuery1, [editNotes.toString(), noteID], function(err, result) {
          if(shouldAbort(err)) return

          const retval3 = result.rows[0].id;
          var editTitle = req.body.title;
          client.query(editQuery2, [editTitle.toString(), retval3], function(err, result) {
            if(shouldAbort(err)) return
            client.query('COMMIT', function(err, result) {
              if (err) {
                console.error('Error committing transaction', err.stack);
              }
              done();
              res.redirect('/notes');
            })
          })
        })
      })
    })
  });
  app.get('/notes/:id/delete', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      const shouldAbort = (err) => {
        if (err) {
          console.error('Error in transaction', err.stack)
          client.query('ROLLBACK', (err) => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            // release the client back to the pg
            done()
          })
        }
        return !!err
      }

      client.query('BEGIN', function(err) {
        if(shouldAbort(err)) return

        var noteID = req.params.id;
        client.query(deleteQuery1, [noteID], function(err, result) {
          if(shouldAbort(err)) return

          const retval2 = result.rows[0].id;
          client.query(deleteQuery2, [retval2], function(err, result) {
            if(shouldAbort(err)) return
            client.query('COMMIT', function(err, result) {
              if (err) {
                console.error('Error committing transaction', err.stack);
              }
              done();
              res.redirect('/notes');
            })
          })
        })
      })
    })
  });
  app.get('/new', function(req, res) {
    res.render('new');
  });
  app.post('/new', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      const shouldAbort = (err) => {
        if (err) {
          console.error('Error in transaction', err.stack)
          client.query('ROLLBACK', (err) => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            // release the client back to the pg
            done()
          })
        }
        return !!err
      }

      client.query('BEGIN', function(err) {
        if(shouldAbort(err)) return

        var newTitle = req.body.title;
        var userID = req.user.id;
        client.query(newQuery1, [newTitle.toString(), userID], function(err, result) {
          if(shouldAbort(err)) return

          const retval1 = result.rows[0].id;
          var newNotes = req.body.notes;
          client.query(newQuery2, [retval1, newNotes.toString(), createNoteId(req.user.id)], function(err, result) {
            if(shouldAbort(err)) return
            client.query('COMMIT', function(err, result) {
              if (err) {
                console.error('Error committing transaction', err.stack);
              }
              done();
              res.redirect('/notes');
            })
          })
        })
      })
    })
  });

  app.get('/help', function(req, res) {
    if(req.user) {
      res.render('help', {loggedIn: true, name: req.user.displayName});
    } else {
      res.render('help', {loggedIn: false});
    }
  });
  app.get('/about', function(req, res) {
    if(req.user) {
      res.render('about', {loggedIn: true, name: req.user.displayName});
    } else {
      res.render('about', {loggedIn: false});
    }
  });
  app.get('/account', function(req, res) {
    res.render('account', {name: req.user.displayName});
  });
  app.get('/account/delete', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(delUserQuery, [req.user.id], function(err, result) {
        done();
        if(err){
          console.error(err);
          res.send("Error " + err);
        } else {
          req.logout();
          res.redirect('/');
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
