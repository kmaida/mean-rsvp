/*
 |--------------------------------------------------------------------------
 | User Model
 |--------------------------------------------------------------------------
 */

var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');
var config = require('../config');

mongoose.set('debug', true);

var userSchema = new mongoose.Schema({
	isAdmin: Boolean,
	displayName: String,
	picture: String,
	facebook: String,
	google: String,
	github: String,
	twitter: String,
	rsvps: Array
});

/**
 * https://www.npmjs.com/package/mongoose-encryption
 *
 * To create an admin user, go to api.js and add "user.isAdmin = true;"
 * in step 3b of whichever oauth method you are going to use to create
 * the new admin. Once user has been created / logged in, remove user.isAdmin = true
 *
 * See api.js line 219 for example.
 */

userSchema.plugin(encrypt, {
	secret: config.TOKEN_SECRET,
	encryptedFields: ['isAdmin']
});

var User = mongoose.model('User', userSchema);

module.exports = mongoose.model('User', userSchema);