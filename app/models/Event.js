/*
 |--------------------------------------------------------------------------
 | Event Model
 |--------------------------------------------------------------------------
 */

var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');
var config = require('../config');

var eventSchema = new mongoose.Schema({
	title: {type: String, required: true },
	startDate: {type: String, required: true },
	startTime: {type: String, required: true },
	endDate: {type: String, required: true },
	endTime: {type: String, required: true },
	description: String,
	location: {type: String, required: true },
	viewPublic: {type: Boolean, required: true },
	rsvp: {type: Boolean, required: true },
	rsvpInstructions: String,
	guests: Array
});

eventSchema.plugin(encrypt, {
	secret: config.TOKEN_SECRET,
	encryptedFields: []
});

var Event = mongoose.model('Event', eventSchema);

module.exports = mongoose.model('Event', eventSchema);