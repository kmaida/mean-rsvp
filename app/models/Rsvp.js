/*
 |--------------------------------------------------------------------------
 | RSVP Model
 |--------------------------------------------------------------------------
 */

var mongoose = require('mongoose');
var config = require('../config');

mongoose.set('debug', true);

var _alphanum = /^[a-z0-9]+$/i;

var rsvpSchema = new mongoose.Schema({
	userId: {type: String, required: true, match: _alphanum },
	eventId: {type: String, required: true, match: _alphanum },
	eventName: {type: String, required: true },
	name: {type: String, required: true },
	attending: { type: Boolean, required: true },
	guests: { type: Number, min: 0, max: 10 },
	comments: { type: String }
});

var Rsvp = mongoose.model('Rsvp', rsvpSchema);

module.exports = mongoose.model('Rsvp', rsvpSchema);