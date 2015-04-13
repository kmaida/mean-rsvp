var request = require('request');
var jwt = require('jwt-simple');
var moment = require('moment');
var qs = require('querystring');
var User = require('./models/User');

module.exports = function(app, config) {

	/*
	 |--------------------------------------------------------------------------
	 | Login Required Middleware
	 |--------------------------------------------------------------------------
	 */

	/**
	 * Make sure user is authenticated
	 *
	 * @param req
	 * @param res
	 * @param next
	 * @returns {*}
	 */
	function ensureAuthenticated(req, res, next) {
		if (!req.headers.authorization) {
			return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
		}
		var token = req.headers.authorization.split(' ')[1];
		var payload = jwt.decode(token, config.TOKEN_SECRET);
		if (payload.exp <= moment().unix()) {
			return res.status(401).send({ message: 'Token has expired' });
		}
		req.user = payload.sub;
		next();
	}

	/**
	 * Make sure user is authenticated and is authorized as an administrator
	 *
	 * @param req
	 * @param res
	 * @param next
	 * @returns {*}
	 */
	function ensureAdmin(req, res, next) {
		if (!req.headers.authorization) {
			return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
		}
		var token = req.headers.authorization.split(' ')[1];
		var payload = jwt.decode(token, config.TOKEN_SECRET);
		if (payload.exp <= moment().unix()) {
			return res.status(401).send({ message: 'Token has expired' });
		}
		req.user = payload.sub;
		req.isAdmin = payload.role;

		if (!req.isAdmin) {
			return res.status(401).send({ message: 'Not authorized' });
		}
		next();
	}

	/*
	 |--------------------------------------------------------------------------
	 | Generate JSON Web Token
	 |--------------------------------------------------------------------------
	 */

	/**
	 * Create JSON Web Token for authentication
	 *
	 * @param user
	 * @returns {*}
	 */
	function createToken(user) {
		var payload = {
			sub: user._id,
			role: user.isAdmin,
			iat: moment().unix(),
			exp: moment().add(14, 'days').unix()
		};
		return jwt.encode(payload, config.TOKEN_SECRET);
	}

	/*
	 |--------------------------------------------------------------------------
	 | GET /api/me
	 |--------------------------------------------------------------------------
	 */
	app.get('/api/me', ensureAuthenticated, function(req, res) {
		User.findById(req.user, function(err, user) {
			res.send(user);
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | PUT /api/me
	 |--------------------------------------------------------------------------
	 */
	app.put('/api/me', ensureAuthenticated, function(req, res) {
		User.findById(req.user, function(err, user) {
			if (!user) {
				return res.status(400).send({ message: 'User not found' });
			}
			user.displayName = req.body.displayName || user.displayName;
			// user.email = req.body.email || user.email;
			user.save(function(err) {
				res.status(200).end();
			});
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | GET /api/users (authorize as admin)
	 |--------------------------------------------------------------------------
	 */
	app.get('/api/users', ensureAdmin, function(req, res) {
		User.find({}, function(err, users) {
			var userArr = [];

			users.forEach(function(user) {
				userArr.push(user);
			});

			res.send(userArr);
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | Log in with Email
	 |--------------------------------------------------------------------------
	 */
	//app.post('/auth/login', function(req, res) {
	//	User.findOne({ email: req.body.email }, '+password', function(err, user) {
	//		if (!user) {
	//			return res.status(401).send({ message: 'Wrong email and/or password' });
	//		}
	//		user.comparePassword(req.body.password, function(err, isMatch) {
	//			if (!isMatch) {
	//				return res.status(401).send({ message: 'Wrong email and/or password' });
	//			}
	//			res.send({ token: createToken(user) });
	//		});
	//	});
	//});

	/*
	 |--------------------------------------------------------------------------
	 | Create Email and Password Account
	 |--------------------------------------------------------------------------
	 */
	//app.post('/auth/signup', function(req, res) {
	//	User.findOne({ email: req.body.email }, function(err, existingUser) {
	//		if (existingUser) {
	//			return res.status(409).send({ message: 'Email is already taken' });
	//		}
	//		var user = new User({
	//			displayName: req.body.displayName,
	//			email: req.body.email,
	//			password: req.body.password
	//		});
	//		user.save(function() {
	//			res.send({ token: createToken(user) });
	//		});
	//	});
	//});

	/*
	 |--------------------------------------------------------------------------
	 | Login with Google
	 |--------------------------------------------------------------------------
	 */
	app.post('/auth/google', function(req, res) {
		var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
		var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
		var params = {
			code: req.body.code,
			client_id: req.body.clientId,
			client_secret: config.GOOGLE_SECRET,
			redirect_uri: req.body.redirectUri,
			grant_type: 'authorization_code'
		};

		// Step 1. Exchange authorization code for access token.
		request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
			var accessToken = token.access_token;
			var headers = { Authorization: 'Bearer ' + accessToken };

			// Step 2. Retrieve profile information about the current user.
			request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {

				// Step 3a. Link user accounts.
				if (req.headers.authorization) {
					User.findOne({ google: profile.sub }, function(err, existingUser) {
						if (existingUser) {
							return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
						}
						var token = req.headers.authorization.split(' ')[1];
						var payload = jwt.decode(token, config.TOKEN_SECRET);
						User.findById(payload.sub, function(err, user) {
							if (!user) {
								return res.status(400).send({ message: 'User not found' });
							}
							user.google = profile.sub;
							user.picture = user.picture || profile.picture;
							user.displayName = user.displayName || profile.name;
							user.save(function() {
								var token = createToken(user);
								res.send({ token: token });
							});
						});
					});
				} else {
					// Step 3b. Create a new user account or return an existing one.
					User.findOne({ google: profile.sub }, function(err, existingUser) {
						if (existingUser) {
							return res.send({ token: createToken(existingUser) });
						}
						var user = new User();
						user.google = profile.sub;
						user.picture = profile.picture;
						user.displayName = profile.name;

						// TODO: to create an admin user, allow one-time isAdmin = true in one of the account creations
						// user.isAdmin = true;

						user.save(function() {
							var token = createToken(user);
							res.send({ token: token });
						});
					});
				}
			});
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | Login with GitHub
	 |--------------------------------------------------------------------------
	 */
	app.post('/auth/github', function(req, res) {
		var accessTokenUrl = 'https://github.com/login/oauth/access_token';
		var userApiUrl = 'https://api.github.com/user';
		var params = {
			code: req.body.code,
			client_id: req.body.clientId,
			client_secret: config.GITHUB_SECRET,
			redirect_uri: req.body.redirectUri
		};

		// Step 1. Exchange authorization code for access token.
		request.get({ url: accessTokenUrl, qs: params }, function(err, response, accessToken) {
			accessToken = qs.parse(accessToken);
			var headers = { 'User-Agent': 'Satellizer' };

			// Step 2. Retrieve profile information about the current user.
			request.get({ url: userApiUrl, qs: accessToken, headers: headers, json: true }, function(err, response, profile) {

				// Step 3a. Link user accounts.
				if (req.headers.authorization) {
					User.findOne({ github: profile.id }, function(err, existingUser) {
						if (existingUser) {
							return res.status(409).send({ message: 'There is already a GitHub account that belongs to you' });
						}
						var token = req.headers.authorization.split(' ')[1];
						var payload = jwt.decode(token, config.TOKEN_SECRET);
						User.findById(payload.sub, function(err, user) {
							if (!user) {
								return res.status(400).send({ message: 'User not found' });
							}
							user.github = profile.id;
							user.picture = user.picture || profile.avatar_url;
							user.displayName = user.displayName || profile.name;
							user.save(function() {
								var token = createToken(user);
								res.send({ token: token });
							});
						});
					});
				} else {
					// Step 3b. Create a new user account or return an existing one.
					User.findOne({ github: profile.id }, function(err, existingUser) {
						if (existingUser) {
							var token = createToken(existingUser);
							return res.send({ token: token });
						}
						var user = new User();
						user.github = profile.id;
						user.picture = profile.avatar_url;
						user.displayName = profile.name;
						user.save(function() {
							var token = createToken(user);
							res.send({ token: token });
						});
					});
				}
			});
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | Login with Facebook
	 |--------------------------------------------------------------------------
	 */
	app.post('/auth/facebook', function(req, res) {
		var accessTokenUrl = 'https://graph.facebook.com/oauth/access_token';
		var graphApiUrl = 'https://graph.facebook.com/me';
		var params = {
			code: req.body.code,
			client_id: req.body.clientId,
			client_secret: config.FACEBOOK_SECRET,
			redirect_uri: req.body.redirectUri
		};

		// Step 1. Exchange authorization code for access token.
		request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
			if (response.statusCode !== 200) {
				return res.status(500).send({ message: accessToken.error.message });
			}
			accessToken = qs.parse(accessToken);

			// Step 2. Retrieve profile information about the current user.
			request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
				if (response.statusCode !== 200) {
					return res.status(500).send({ message: profile.error.message });
				}
				if (req.headers.authorization) {
					User.findOne({ facebook: profile.id }, function(err, existingUser) {
						if (existingUser) {
							return res.status(409).send({ message: 'There is already a Facebook account that belongs to you' });
						}
						var token = req.headers.authorization.split(' ')[1];
						var payload = jwt.decode(token, config.TOKEN_SECRET);
						User.findById(payload.sub, function(err, user) {
							if (!user) {
								return res.status(400).send({ message: 'User not found' });
							}
							user.facebook = profile.id;
							user.picture = user.picture || 'https://graph.facebook.com/' + profile.id + '/picture?type=small';
							user.displayName = user.displayName || profile.name;
							user.save(function() {
								var token = createToken(user);
								res.send({ token: token });
							});
						});
					});
				} else {
					// Step 3b. Create a new user account or return an existing one.
					User.findOne({ facebook: profile.id }, function(err, existingUser) {
						if (existingUser) {
							var token = createToken(existingUser);
							return res.send({ token: token });
						}
						var user = new User();
						user.facebook = profile.id;
						user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=small';
						user.displayName = profile.name;
						user.save(function() {
							var token = createToken(user);
							res.send({ token: token });
						});
					});
				}
			});
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | Login with Twitter
	 |--------------------------------------------------------------------------
	 */
	app.get('/auth/twitter', function(req, res) {
		var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
		var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
		var authenticateUrl = 'https://api.twitter.com/oauth/authenticate';

		if (!req.query.oauth_token || !req.query.oauth_verifier) {
			var requestTokenOauth = {
				consumer_key: config.TWITTER_KEY,
				consumer_secret: config.TWITTER_SECRET,
				callback: config.TWITTER_CALLBACK
			};

			// Step 1. Obtain request token for the authorization popup.
			request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function(err, response, body) {
				var oauthToken = qs.parse(body);
				var params = qs.stringify({ oauth_token: oauthToken.oauth_token });

				// Step 2. Redirect to the authorization screen.
				res.redirect(authenticateUrl + '?' + params);
			});
		} else {
			var accessTokenOauth = {
				consumer_key: config.TWITTER_KEY,
				consumer_secret: config.TWITTER_SECRET,
				token: req.query.oauth_token,
				verifier: req.query.oauth_verifier
			};

			// Step 3. Exchange oauth token and oauth verifier for access token.
			request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, profile) {
				profile = qs.parse(profile);

				// Step 4a. Link user accounts.
				if (req.headers.authorization) {
					User.findOne({ twitter: profile.user_id }, function(err, existingUser) {
						if (existingUser) {
							return res.status(409).send({ message: 'There is already a Twitter account that belongs to you' });
						}
						var token = req.headers.authorization.split(' ')[1];
						var payload = jwt.decode(token, config.TOKEN_SECRET);
						User.findById(payload.sub, function(err, user) {
							if (!user) {
								return res.status(400).send({ message: 'User not found' });
							}
							user.twitter = profile.user_id;
							user.displayName = user.displayName || profile.screen_name;
							user.save(function(err) {
								res.send({ token: createToken(user) });
							});
						});
					});
				} else {
					// Step 4b. Create a new user account or return an existing one.
					User.findOne({ twitter: profile.user_id }, function(err, existingUser) {
						if (existingUser) {
							var token = createToken(existingUser);
							return res.send({ token: token });
						}
						var user = new User();
						user.twitter = profile.user_id;
						user.displayName = profile.screen_name;
						user.save(function() {
							var token = createToken(user);
							res.send({ token: token });
						});
					});
				}
			});
		}
	});

	/*
	 |--------------------------------------------------------------------------
	 | Unlink Provider
	 |--------------------------------------------------------------------------
	 */
	app.get('/auth/unlink/:provider', ensureAuthenticated, function(req, res) {
		var provider = req.params.provider;
		User.findById(req.user, function(err, user) {
			if (!user) {
				return res.status(400).send({ message: 'User not found' });
			}
			user[provider] = undefined;
			user.save(function() {
				res.status(200).end();
			});
		});
	});

};