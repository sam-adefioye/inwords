const pg = require('pg')
const express = require('express')
const PORT = process.env.PORT || 5000

express()
  .use(express.static(__dirname + 'public'))
  .set('views', __dirname + 'views')
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
// app.get('/login', (req, res) => res.render());
// app.get('/new', (req, res) => res.render());
// app.get('/help', (req, res) => res.render());
// app.get('/about', (req, res) => res.render());

// app.route('/login')
//   .get(function (req, res) {
//
//   })
