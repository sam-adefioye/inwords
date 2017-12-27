const pg = require('pg')
const express = require('express')
const app = express()
const PORT = process.env.PORT || 5000

app.use(express.static(__dirname + 'public'));
app.set('views', __dirname + 'views');
app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('pages/index'));
// app.get('/login', (req, res) => res.render());
// app.get('/new', (req, res) => res.render());
// app.get('/help', (req, res) => res.render());
// app.get('/about', (req, res) => res.render());

// app.route('/login')
//   .get(function (req, res) {
//
//   })

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
