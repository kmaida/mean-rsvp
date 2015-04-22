var request = require('request');
var jwt = require('jwt-simple');
var moment = require('moment');
var qs = require('querystring');
var User = require('./models/User');
var Event = require('./models/Event');
var Rsvp = require('./models/Rsvp');

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

	/*
	 |--------------------------------------------------------------------------
	 | POST /api/event/new (create new event: admin only)
	 |--------------------------------------------------------------------------
	 */
	app.post('/api/event/new', ensureAdmin, function(req, res) {
		Event.findOne({ title: req.body.title }, function(err, existingEvent) {
			if (existingEvent) {
				return res.status(409).send({ message: 'That event already exists' });
			}
			var event = new Event({
				title: req.body.title,
				date: req.body.date,
				description: req.body.description,
				location: req.body.location,
				viewPublic: req.body.viewPublic,
				rsvp: req.body.rsvp
			});
			event.save(function() {
				res.send(event);
			});
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | GET /api/event/:id
	 |--------------------------------------------------------------------------
	 */
	app.get('/api/event/:id', ensureAuthenticated, function(req, res) {
		Event.findById(req.params.id, function(err, event) {
			if (err) { res.send(err); }
			res.json(event);
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | PUT /api/event/:id (update events and associated RSVPs: admin only)
	 |--------------------------------------------------------------------------
	 */
	app.put('/api/event/:id', ensureAdmin, function(req, res) {
		var eventName;

		// update event
		Event.findById(req.params.id, function(err, event) {
			if (!event) {
				return res.status(400).send({ message: 'Event not found' });
			}

			eventName = req.body.title || event.title;

			event.title = eventName;
			event.date = req.body.date || event.date;
			event.description = req.body.description || event.description;
			event.location = req.body.location || event.location;
			// booleans accept what's in the form because || won't work
			event.viewPublic = req.body.viewPublic;
			event.rsvp = req.body.rsvp;

			event.save(function(err) {
				res.status(200).end();
			});
		});

		// update event name for all associated RSVPs
		Rsvp.find({eventId: req.params.id}, function(err, guests) {
			if (err) { res.send(err); }

			guests.forEach(function(guest) {
				guest.eventName = eventName;

				guest.save(function(err) {
					res.status(200).end();
				});
			});
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | DELETE /api/event/:id (delete event and associated RSVPs)
	 |--------------------------------------------------------------------------
	 */
	app.delete('/api/event/:id', ensureAdmin, function(req, res) {
		// delete event
		Event.findById(req.params.id, function(err, event) {
			event.remove(function(err) {
				res.status(200).end();
			});
		});

		// delete all RSVPs associated with this event
		Rsvp.find({eventId: req.params.id}, function(err, guests) {
			if (err) { res.send(err); }

			guests.forEach(function(guest) {
				guest.remove(function(err) {
					res.status(200).end();
				});
			});
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | GET /api/events
	 |--------------------------------------------------------------------------
	 */
	app.get('/api/events', ensureAuthenticated, function(req, res) {
		Event.find(function(err, events) {
			if (err) { res.send(err); }

			var eventArr = [];

			events.forEach(function(event) {
				eventArr.push(event);
			});

			res.send(eventArr);
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | GET /api/event/:eventId/guests (get all RSVPs for a specific event)
	 |--------------------------------------------------------------------------
	 */
	app.get('/api/event/:eventId/guests', ensureAdmin, function(req, res) {
		Rsvp.find({eventId: req.params.eventId}, function(err, guests) {
			if (err) { res.send(err); }

			var guestsArr = [];

			guests.forEach(function(guest) {
				guestsArr.push(guest);
			});

			res.send(guestsArr);
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | POST /api/event/:id/rsvp (RSVP to an event)
	 |--------------------------------------------------------------------------
	 */
	app.post('/api/event/:id/rsvp', ensureAuthenticated, function(req, res) {
		Rsvp.findOne({ eventId: req.params.id }, function(err, existingRsvp) {
			if (existingRsvp) {
				return res.status(409).send({ message: 'You have already RSVPed to this event' });
			}
			var rsvp = new Rsvp({
				userId: req.body.userId,
				eventId: req.params.id,
				eventName: req.body.eventName,
				name: req.body.name,
				attending: req.body.attending,
				guests: req.body.guests,
				comments: req.body.comments
			});
			rsvp.save(function() {
				res.send(rsvp);
			});
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | GET /api/me/rsvp (get all RSVPs for logged in user)
	 |--------------------------------------------------------------------------
	 */
	app.get('/api/me/rsvp', ensureAuthenticated, function(req, res) {
		Rsvp.find({userId: req.user}, function(err, rsvps) {
			if (err) { res.send(err); }

			var rsvpArr = [];

			rsvps.forEach(function(rsvp) {
				rsvpArr.push(rsvp);
			});

			res.send(rsvpArr);
		});
	});

	/*
	 |--------------------------------------------------------------------------
	 | PUT /api/me/rsvp/:id (update RSVP response for a specific RSVP)
	 |--------------------------------------------------------------------------
	 */
	app.put('/api/me/rsvp/:rsvpid', ensureAuthenticated, function(req, res) {
		Rsvp.findById(req.params.rsvpid, function(err, rsvp) {
			if (!rsvp) {
				return res.status(400).send({ message: 'RSVP not found' });
			}

			rsvp.name = req.body.name || rsvp.name;
			rsvp.attending = req.body.attending;
			rsvp.guests = req.body.guests || rsvp.guests;
			rsvp.comments = req.body.comments || rsvp.comments;

			rsvp.save(function(err) {
				res.status(200).end();
			});
		});
	});

};