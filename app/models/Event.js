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
	datetimeStart: String,
	datetimeEnd: String,
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

module.exports = mongoose.model('Event', eventSchema);