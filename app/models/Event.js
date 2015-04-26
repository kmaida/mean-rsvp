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
	startDate: String,
	startTime: String,
	endDate: String,
	endTime: String,
	description: String,
	location: String,
	viewPublic: Boolean,
	rsvp: Boolean,
	rsvpInstructions: String,
	guests: Array
});

eventSchema.plugin(encrypt, {
	secret: config.TOKEN_SECRET,
	encryptedFields: []
});

var Event = mongoose.model('Event', eventSchema);

module.exports = mongoose.model('Event', eventSchema);