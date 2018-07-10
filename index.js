const pg = require('pg')
const express = require('express')
const passport = require('passport')
// const { Pool } = pg
// const pool = new Pool()
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser());
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
app.set('views', path.join(__dirname, 'views/pages'));
app.set('view engine', 'ejs');

app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport, pg);
require('./app/routes')(app, passport, pg);

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
