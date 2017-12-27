var pg = require('pg');
var express = require('express');
var app = express();
var port = process.env.PORT || 5000;

app.use(express.static(__dirname + 'public'));

app.set('views', __dirname + 'views');
app.set('views engine', 'ejs');

app.get('/', (req, res) => res.render('pages/index'));
app.get('/login', (req, res) => res.render());
app.get('/new', (req, res) => res.render());
app.get('/help', (req, res) => res.render());
app.get('/about', (req, res) => res.render());

// app.route('/login')
//   .get(function (req, res) {
//
//   })

app.listen(port);
