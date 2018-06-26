const pg = require('pg')
const express = require('express')
const passport = require('passport-google-oauth')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

require('./config/passport.js')(passport);
require('./app/routes.js')(app, passport);

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
