/*
 |--------------------------------------------------------------------------
 | RSVP Model
 |--------------------------------------------------------------------------
 */

var mongoose = require('mongoose');
var config = require('../config');

var rsvpSchema = new mongoose.Schema({
	userId: String,
	eventId: String,
	eventName: String,
	name: String,
	attending: Boolean,
	guests: Number,
	comments: String
});

var Rsvp = mongoose.model('Rsvp', rsvpSchema);

module.exports = mongoose.model('Rsvp', rsvpSchema);