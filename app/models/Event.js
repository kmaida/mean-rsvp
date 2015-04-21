/*
 |--------------------------------------------------------------------------
 | Event Model
 |--------------------------------------------------------------------------
 */

var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');
var config = require('../config');

var eventSchema = new mongoose.Schema({
	title: String,
	date: String,
	description: String,
	location: String,
	viewPublic: Boolean,
	rsvp: Boolean,
	guests: Array
});

eventSchema.plugin(encrypt, {
	secret: config.TOKEN_SECRET,
	encryptedFields: []
});

var Event = mongoose.model('Event', eventSchema);

// To Add events without a form:

//Event.create({
//	title: 'Josh\'s Birthday',
//	description: 'Come celebrate a great birthday with us!',
//	date: 'April 29, 2015',
//	location: 'Home',
//	viewPublic: true,
//	rsvp: true
//});

module.exports = mongoose.model('Event', eventSchema);