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

// To Add RSVPs without a form:

//Rsvp.create({
//  userId: '55352f0493ac666440b11c14',
//  eventId: '553555093c2293306f2b0648',
//  eventName: 'Josh\'s Birthday',
//  name: 'Kim Maida',
//  attending: true,
//  guests: 1,
//  comments: 'Looking forward to it!'
//});

module.exports = mongoose.model('Rsvp', rsvpSchema);