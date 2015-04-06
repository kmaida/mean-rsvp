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

/***
 * https://www.npmjs.com/package/mongoose-encryption
 *
 * To encrypt "isAdmin" field, add the field to the DB entry via Robomongo
 * Then uncomment the encrypt.migrations plugin version
 * Then uncomment User.migrateToA (below) and run
 */

// userSchema.plugin(encrypt.migrations, {
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

//User.migrateToA(function(err) {
//	if (err) { throw err; }
//	console.log('Migration successful');
//});

module.exports = mongoose.model('User', userSchema);