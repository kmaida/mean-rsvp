/*
 |--------------------------------------------------------------------------
 | User Model
 |--------------------------------------------------------------------------
 */

var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var encrypt = require('mongoose-encryption');
var config = require('../config');

var userSchema = new mongoose.Schema({
	//email: { type: String, sparse: true, lowercase: true },
	//password: { type: String, select: false },
	isAdmin: Boolean,
	displayName: String,
	picture: String,
	facebook: String,
	google: String,
	github: String,
	twitter: String
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

/*
userSchema.pre('save', function(next) {
	var user = this;

	if (!user.isModified('password')) {
		return next();
	}
	bcrypt.genSalt(10, function(err, salt) {
		bcrypt.hash(user.password, salt, function(err, hash) {
			user.password = hash;
			next();
		});
	});
});

userSchema.methods.comparePassword = function(password, done) {
	bcrypt.compare(password, this.password, function(err, isMatch) {
		done(err, isMatch);
	});
}; */

var User = mongoose.model('User', userSchema);

module.exports = mongoose.model('User', userSchema);