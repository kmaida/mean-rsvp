/**
 * server.js
 */

/*
 |--------------------------------------------------------------------------
 | Modules
 |--------------------------------------------------------------------------
 */

var path = require('path');
var bodyParser = require('body-parser');
var compression = require('compression');
var methodOverride = require('method-override');
var express = require('express');
var logger = require('morgan');
var mongoose = require('mongoose');

/*
 |--------------------------------------------------------------------------
 | Config
 |--------------------------------------------------------------------------
 */

var config = require('./app/config');

/*
 |--------------------------------------------------------------------------
 | MongoDB
 |--------------------------------------------------------------------------
 */

mongoose.connect(config.MONGO_URI);
var monDb = mongoose.connection;

monDb.on('error', function() {
	console.error('MongoDB Connection Error. Please make sure that', config.MONGO_URI, 'is running.');
});

monDb.once('open', function callback() {
	console.info('Connected to MongoDB:', config.MONGO_URI);
});

/*
 |--------------------------------------------------------------------------
 | Models
 |--------------------------------------------------------------------------
 */

var User = require('./app/models/User.js');
var Event = require('./app/models/Event.js');

/*
 |--------------------------------------------------------------------------
 | Application
 |--------------------------------------------------------------------------
 */

var app = express();

app.set('port', process.env.PORT || 8081);

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('X-HTTP-Method-Override'));

app.use(express.static(path.join(__dirname, './public')));

app.use(compression());

/*
 |--------------------------------------------------------------------------
 | Routes
 |--------------------------------------------------------------------------
 */

// API routes
require('./app/api.js')(app, config);

// Pass routing to Angular app
app.get('*', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

/*
 |--------------------------------------------------------------------------
 | Start the Server
 |--------------------------------------------------------------------------
 */

app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});