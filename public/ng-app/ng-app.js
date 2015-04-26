angular
	.module('myApp', ['ngRoute', 'ngResource', 'ngSanitize', 'ngMessages', 'mediaCheck', 'satellizer']);
(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AdminCtrl', AdminCtrl);

	AdminCtrl.$inject = ['$scope', '$location', '$auth', 'userData', 'User', 'rsvpData'];

	function AdminCtrl($scope, $location, $auth, userData, User, rsvpData) {
		// controllerAs ViewModel
		var admin = this;

		// verify that user is admin
		userData.getUser().then(function(data) {
			admin.adminReady = true;

			if (data.isAdmin) {
				admin.showAdmin = true;
			}
		});

		/**
		 * Determines if the user is authenticated
		 *
		 * @returns {boolean}
		 */
		admin.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		var _tab = $location.search().view;

		admin.tabs = [
			{
				name: 'Events',
				query: 'events'
			},
			{
				name: 'Add Event',
				query: 'add-event'
			},
			{
				name: 'Users',
				query: 'users'
			}
		];

		admin.currentTab = _tab ? _tab : 'events';

		/**
		 * Change tabs by watching for route update
		 */
		$scope.$on('$routeUpdate', function(event, next) {
			admin.currentTab = next.params.view || 'events';
		});

		/**
		 * Function for successful API call getting user list
		 * Show Admin UI
		 * Display list of users
		 *
		 * @param data {Array} promise provided by $http success
		 * @private
		 */
		function _getAllUsersSuccess(data) {
			admin.users = data;

			angular.forEach(admin.users, function(user) {
				user.linkedAccounts = User.getLinkedAccounts(user);
			});
		}

		userData.getAllUsers().then(_getAllUsersSuccess);

		/**
		 * Show RSVPed guest modal
		 *
		 * @param eventId {string} event ID to get RSVPs for
		 * @param eventName {string} event name to get RSVPs for
		 */
		admin.showGuests = function(eventId, eventName) {
			admin.showGuestsEventId = eventId;
			admin.showGuestsEventName = eventName;
			admin.showModal = true;
		};
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AdminEventListCtrl', AdminEventListCtrl);

	AdminEventListCtrl.$inject = ['eventData', '$location', '$timeout', 'Event'];

	function AdminEventListCtrl(eventData, $location, $timeout, Event) {
		// controllerAs ViewModel
		var aEvt = this;

		aEvt.evtUrl = $location.protocol() + '://' + $location.host() + '/event/';

		/**
		 * Hide URL input field when blurred
		 */
		aEvt.blurUrlInput = function() {
			aEvt.copyInput = null;
		};

		/**
		 * Show URL input field when ID link is clicked
		 *
		 * @param index
		 */
		aEvt.showUrlInput = function(index) {
			aEvt.copyInput = index;

			$timeout(function() {
				angular.element('#e' + index).find('input').select();
			});
		};

		/**
		 * Function for successful API call getting all events
		 * Show Admin Events UI
		 * Display list of events
		 *
		 * @param data {Array} promise provided by $http success
		 * @private
		 */
		function _getAllEventsSuccess(data) {
			aEvt.events = data;
			aEvt.eventsReady = true;
		}

		eventData.getAllEvents().then(_getAllEventsSuccess);

		/**
		 * Custom sort function
		 * Get event start date and change to real date to sort by
		 *
		 * @param evt {object} event object
		 * @returns {Date}
		 */
		aEvt.sortStartDate = function(evt) {
			return Event.getJSDatetime(evt.startDate, evt.startTime);
		};
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('EditEventCtrl', EditEventCtrl);

	EditEventCtrl.$inject = ['$auth', 'userData', 'eventData', '$routeParams', '$location', '$timeout'];

	function EditEventCtrl($auth, userData, eventData, $routeParams, $location, $timeout) {
		// controllerAs ViewModel
		var edit = this;

		// get the event ID
		var _eventId = $routeParams.eventId;

		// tabs
		edit.tabs = ['Update Details', 'Delete Event'];
		edit.currentTab = 0;

		edit.changeTab = function(index) {
			edit.currentTab = index;
		};

		// verify that user is admin
		userData.getUser().then(function(data) {
			edit.showEdit = data.isAdmin ? true : false;
		});

		/**
		 * Determines if the user is authenticated
		 *
		 * @returns {boolean}
		 */
		edit.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		/**
		 * Function returned on successful API call for this event
		 *
		 * @param data {object} event data
		 * @private
		 */
		function _getEventSuccess(data) {
			edit.editEvent = data;
			edit.showEditForm = true;
		}

		eventData.getEvent(_eventId).then(_getEventSuccess);

		/**
		 * Reset the delete button to default state
		 *
		 * @private
		 */
		function _btnDeleteReset() {
			edit.btnDelete = false;
			edit.btnDeleteText = 'Delete Event';
		}

		_btnDeleteReset();

		/**
		 * Function returned on successful deletion of event
		 *
		 * @private
		 */
		function _deleteSuccess() {
			edit.btnDeleteText = 'Deleted!';
			edit.btnDelete = true;
			edit.editEvent = {};

			$timeout(function() {
				$location.path('/admin');
			}, 1500);
		}

		/**
		 * Function returned on error deleting event
		 *
		 * @private
		 */
		function _deleteError() {
			edit.btnDeleteText = 'Error deleting!';

			$timeout(_btnDeleteReset, 3000);
		}

		/**
		 * Delete the event
		 */
		edit.deleteEvent = function() {
			edit.btnDeleteText = 'Deleting...';

			eventData.deleteEvent(_eventId).then(_deleteSuccess, _deleteError);
		};
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('eventForm', eventForm);

	eventForm.$inject = ['eventData', '$timeout'];

	function eventForm(eventData, $timeout) {

		eventFormCtrl.$inject = ['$scope'];

		function eventFormCtrl($scope) {
			// controllerAs syntax
			var ef = this;

			// check if form is create or edit
			var _isCreate = jQuery.isEmptyObject(ef.prefillModel),
				_isEdit = !jQuery.isEmptyObject(ef.prefillModel);

			ef.dateRegex = /^((0?[13578]|10|12)(-|\/)(([1-9])|(0[1-9])|([12])([0-9]?)|(3[01]?))(-|\/)((19)([2-9])(\d{1})|(20)([01])(\d{1})|([8901])(\d{1}))|(0?[2469]|11)(-|\/)(([1-9])|(0[1-9])|([12])([0-9]?)|(3[0]?))(-|\/)((19)([2-9])(\d{1})|(20)([01])(\d{1})|([8901])(\d{1})))$/;
			ef.timeRegex = /^(0?[1-9]|1[012])(:[0-5]\d) [APap][mM]$/i;

			if (_isEdit) {
				ef.formModel = ef.prefillModel;
			}

			/**
			 * On start date valid blur, update end date if empty
			 */
			ef.startDateBlur = function() {
				if (!ef.formModel.endDate) {
					ef.formModel.endDate = ef.formModel.startDate;
				}
			};

			/**
			 * Reset the state of the form Submit button
			 *
			 * @private
			 */
			function _btnSubmitReset() {
				ef.btnSaved = false;
				ef.btnSubmitText = _isCreate ? 'Submit' : 'Update';
			}

			_btnSubmitReset();

			/**
			 * Function for event API call succeeded
			 *
			 * @private
			 */
			function _eventSuccess() {
				ef.btnSaved = true;
				ef.btnSubmitText = _isCreate ? 'Saved!' : 'Updated!';

				if (_isCreate) {
					ef.formModel = {};
				}

				if (_isEdit) {
					ef.showUpdateDetailLink = true;
				}

				$timeout(_btnSubmitReset, 3000);
			}

			/**
			 * Function for event API call error
			 *
			 * @private
			 */
			function _eventError() {
				ef.btnSaved = 'error';
				ef.btnSubmitText = _isCreate ? 'Error saving!' : 'Error updating!';

				$timeout(_btnSubmitReset, 3000);
			}

			/**
			 * Click submit button
			 * Submit new event to API
			 * Form @ eventForm.tpl.html
			 */
			ef.submitEvent = function() {
				ef.btnSubmitText = 'Saving...';

				if (_isCreate) {
					eventData.createEvent(ef.formModel).then(_eventSuccess, _eventError);

				} else if (_isEdit) {
					eventData.updateEvent(ef.formModel._id, ef.formModel).then(_eventSuccess, _eventError);
				}
			};
		}

		return {
			restrict: 'EA',
			scope: {
				prefillModel: '='
			},
			templateUrl: '/ng-app/admin/eventForm.tpl.html',
			controller: eventFormCtrl,
			controllerAs: 'ef',
			bindToController: true
		}
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('viewEventGuests', viewEventGuests);

	viewEventGuests.$inject = ['rsvpData'];

	function viewEventGuests(rsvpData) {

		viewEventGuestsCtrl.$inject = ['$scope'];

		function viewEventGuestsCtrl($scope) {
			// controllerAs syntax
			var g = this;

			$scope.$watch('g.eventId', function(newVal, oldVal) {
				g.guestsReady = false;

				/**
				 * Function for successful API call getting RSVPs for this event
				 *
				 * @param data {Array} guests array
				 * @private
				 */
				function _getGuestsSuccess(data) {
					var _totalGuests = 0;

					g.guests = data;

					for (var i = 0; i < g.guests.length; i++) {
						_totalGuests+=g.guests[i].guests;
					}

					g.totalGuests = _totalGuests;
					g.guestsReady = true;
				}

				rsvpData.getEventGuests(newVal).then(_getGuestsSuccess);
			});

			/**
			 * Close this modal directive
			 */
			g.closeModal = function() {
				g.showModal = false;
			};
		}

		return {
			restrict: 'EA',
			scope: {
				eventId: '=',
				eventName: '=',
				showModal: '='
			},
			templateUrl: '/ng-app/admin/viewEventGuests.tpl.html',
			controller: viewEventGuestsCtrl,
			controllerAs: 'g',
			bindToController: true
		}
	}
})();
// Event functions
(function() {
	'use strict';

	angular
		.module('myApp')
		.factory('Event', Event);

	Event.$inject = ['Utils', 'prettyDateFilter'];

	function Event(Utils, prettyDateFilter) {
		/**
		 * Generate a pretty date for UI display from the start and end datetimes
		 *
		 * @param eventObj {object} the event object
		 * @returns {string} pretty start and end date / time string
		 */
		function getPrettyDatetime(eventObj) {
			var startDate = eventObj.startDate,
				startTime = eventObj.startTime,
				endDate = eventObj.endDate,
				endTime = eventObj.endTime,
				prettyStartDate = prettyDateFilter(startDate),
				prettyEndDate = prettyDateFilter(endDate),
				prettyDatetime;

			if (startDate === endDate) {
				// event starts and ends on the same day
				// Apr 29 2015, 12:00 PM - 5:00 PM
				prettyDatetime = prettyStartDate + ', ' + startTime + ' - ' + endTime;
			} else {
				// event starts and ends on different days
				// Dec 31 2014, 8:00 PM - Jan 1 2015, 11:00 AM
				prettyDatetime = prettyStartDate + ', ' + startTime + ' - ' + prettyEndDate + ', ' + endTime;
			}

			return prettyDatetime;
		}

		/**
		 * Get JavaScript Date from event date and time strings
		 *
		 * @param dateStr {string} mm/dd/yyy
		 * @param timeStr {string} hh:mm AM/PM
		 * @returns {Date}
		 */
		function getJSDatetime(dateStr, timeStr) {
			var d = new Date(dateStr),
				timeArr = timeStr.split(' '),
				time = timeArr[0].split(':'),
				hours = time[0] * 1,
				minutes = time[1],
				ampm = timeArr[1],
				fulldate;

			if (ampm == 'PM') {
				if (hours !== 12) {
					hours = hours + 12;
				}
			}

			fulldate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes);

			return fulldate;
		}

		/**
		 * Determine if event is expired
		 * (end date/time has passed current date/time)
		 *
		 * @param evt {object} event object
		 * @returns {boolean}
		 */
		function expired(evt) {
			var jsStartDate = getJSDatetime(evt.endDate, evt.endTime),
				now = new Date();

			return jsStartDate < now;
		}

		return {
			getPrettyDatetime: getPrettyDatetime,
			getJSDatetime: getJSDatetime,
			expired: expired
		};
	}
})();
// media query constants
(function() {
	'use strict';

	angular
		.module('myApp')
		.constant('MQ', {
			SMALL: '(max-width: 767px)',
			LARGE: '(min-width: 768px)'
		});
})();
// login/Oauth constants
(function() {
	'use strict';

	angular
		.module('myApp')
		.constant('OAUTH', {
			LOGINS: [
				{
					account: 'google',
					name: 'Google',
					url: 'http://accounts.google.com'
				}, {
					account: 'twitter',
					name: 'Twitter',
					url: 'http://twitter.com'
				}, {
					account: 'facebook',
					name: 'Facebook',
					url: 'http://facebook.com'
				}, {
					account: 'github',
					name: 'GitHub',
					url: 'http://github.com'
				}
			]
		});
})();
// User functions
(function() {
	'use strict';

	angular
		.module('myApp')
		.factory('User', User);

	User.$inject = ['OAUTH'];

	function User(OAUTH) {

		/**
		 * Create array of a user's currently-linked account logins
		 *
		 * @param userObj
		 * @returns {Array}
		 */
		function getLinkedAccounts(userObj) {
			var linkedAccounts = [];

			angular.forEach(OAUTH.LOGINS, function(actObj) {
				var act = actObj.account;

				if (userObj[act]) {
					linkedAccounts.push(act);
				}
			});

			return linkedAccounts;
		}

		return {
			getLinkedAccounts: getLinkedAccounts
		};
	}
})();
// Utility functions
(function() {
	'use strict';

	angular
		.module('myApp')
		.factory('Utils', Utils);

	function Utils() {
		/**
		 * Get ordinal value
		 *
		 * @param n {number} if a string is provided, % will attempt to convert to number
		 * @returns {string} th, st, nd, rd
		 */
		function getOrdinal(n) {
			var ordArr = ['th', 'st', 'nd', 'rd'],
				modulus = n % 100;

			return ordArr[(modulus - 20) % 10] || ordArr[modulus] || ordArr[0];
		}

		return {
			getOrdinal: getOrdinal
		};
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.config(authConfig)
		.run(authRun);

	authConfig.$inject = ['$authProvider'];

	function authConfig($authProvider) {
		$authProvider.loginUrl = 'http://localhost:8081/auth/login';

		$authProvider.facebook({
			clientId: '471837599630371'
		});

		$authProvider.google({
			clientId: '1035478814047-41n8v2umgsupknvmj7q0e6n1gr4nauav.apps.googleusercontent.com'
		});

		$authProvider.twitter({
			url: '/auth/twitter'
		});

		$authProvider.github({
			clientId: 'b303ff4b216c0571f6ce'
		});
	}

	authRun.$inject = ['$rootScope', '$location', '$auth'];

	function authRun($rootScope, $location, $auth) {
		$rootScope.$on('$routeChangeStart', function(event, next, current) {
			if (next && next.$$route && next.$$route.secure && !$auth.isAuthenticated()) {
				$rootScope.authPath = $location.path();

				$rootScope.$evalAsync(function() {
					// send user to login
					$location.path('/login');
				});
			}
		});
	}

})();
// routes
(function() {
	'use strict';

	angular
		.module('myApp')
		.config(appConfig);

	appConfig.$inject = ['$routeProvider', '$locationProvider'];

	function appConfig($routeProvider, $locationProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'ng-app/events/Events.view.html',
				secure: true
			})
			.when('/login', {
				templateUrl: 'ng-app/login/Login.view.html'
			})
			.when('/event/:eventId', {
				templateUrl: 'ng-app/event-detail/EventDetail.view.html',
				secure: true
			})
			.when('/event/:eventId/edit', {
				templateUrl: 'ng-app/admin/EditEvent.view.html',
				secure: true
			})
			.when('/account', {
				templateUrl: 'ng-app/account/Account.view.html',
				secure: true,
				reloadOnSearch: false
			})
			.when('/admin', {
				templateUrl: 'ng-app/admin/Admin.view.html',
				secure: true,
				reloadOnSearch: false
			})
			.otherwise({
				redirectTo: '/'
			});

		$locationProvider
			.html5Mode({
				enabled: true
			})
			.hashPrefix('!');
	}
})();
(function() {

	angular
		.module('myApp')
		.directive('detectAdblock', detectAdblock);

	detectAdblock.$inject = ['$timeout', '$location'];

	function detectAdblock($timeout, $location) {

		detectAdblockLink.$inject = ['$scope', '$elem', '$attrs'];

		function detectAdblockLink($scope, $elem, $attrs) {
			// data object
			$scope.ab = {};

			// hostname for messaging
			$scope.ab.host = $location.host();

			/**
			 * Check if ads are blocked - called in $timeout to let AdBlockers run
			 *
			 * @private
			 */
			function _areAdsBlocked() {
				var _a = $elem.find('.ad-test');

				$scope.ab.blocked = _a.height() <= 0 || !$elem.find('.ad-test:visible').length;
			}

			$timeout(_areAdsBlocked, 200);
		}

		return {
			restrict: 'EA',
			link: detectAdblockLink,
			template:   '<div class="ad-test fa-facebook fa-twitter" style="height:1px;"></div>' +
						'<div ng-if="ab.blocked" class="ab-message alert alert-danger">' +
							'<i class="fa fa-ban"></i> <strong>AdBlock</strong> is prohibiting important functionality! Please disable ad blocking on <strong>{{ab.host}}</strong>. This site is ad-free.' +
						'</div>'
		}
	}

})();
// User API $http calls
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('eventData', eventData);

	/**
	 * GET promise response function
	 * Checks typeof data returned and succeeds if JS object, throws error if not
	 *
	 * @param response {*} data from $http
	 * @returns {*} object, array
	 * @private
	 */
	function _getRes(response) {
		if (typeof response.data === 'object') {
			return response.data;
		} else {
			throw new Error('retrieved data is not typeof object.');
		}
	}

	eventData.$inject = ['$http'];

	function eventData($http) {
		/**
		 * Get event by ID
		 *
		 * @param id {string} event MongoDB _id
		 * @returns {promise}
		 */
		this.getEvent = function(id) {
			return $http({
				method: 'GET',
				url: '/api/event/' + id
			}).then(_getRes);
		};

		/**
		 * Get all events
		 *
		 * @returns {promise}
		 */
		this.getAllEvents = function() {
			return $http
				.get('/api/events')
				.then(_getRes);
		};

		/**
		 * Create a new event
		 *
		 * @param eventData {object} new event data
		 * @returns {promise}
		 */
		this.createEvent = function(eventData) {
			return $http
				.post('/api/event/new', eventData);
		};

		/**
		 * Update an event
		 *
		 * @param eventData {object} updated event data
		 * @param id {string} event MongoDB _id
		 * @returns {promise}
		 */
		this.updateEvent = function(id, eventData) {
			return $http
				.put('/api/event/' + id, eventData);
		};

		/**
		 * Delete an event
		 *
		 * @param id {string} event MongoDB _id
		 * @returns {promise}
		 */
		this.deleteEvent = function(id) {
			return $http
				.delete('/api/event/' + id);
		}
	}
})();
// Fetch local JSON data
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('localData', localData);

	/**
	 * GET promise response function
	 * Checks typeof data returned and succeeds if JS object, throws error if not
	 *
	 * @param response {*} data from $http
	 * @returns {*} object, array
	 * @private
	 */
	function _getRes(response) {
		if (typeof response.data === 'object') {
			return response.data;
		} else {
			throw new Error('retrieved data is not typeof object.');
		}
	}

	localData.$inject = ['$http'];

	function localData($http) {
		/**
		 * Get local JSON data file and return results
		 *
		 * @returns {promise}
		 */
		this.getJSON = function() {
			return $http
				.get('/ng-app/data/data.json')
				.then(_getRes);
		}
	}
})();
(function() {
	'use strict';

	var angularMediaCheck = angular.module('mediaCheck', []);

	angularMediaCheck.service('mediaCheck', ['$window', '$timeout', function ($window, $timeout) {
		this.init = function (options) {
			var $scope = options['scope'],
				query = options['mq'],
				debounce = options['debounce'],
				$win = angular.element($window),
				breakpoints,
				createListener = void 0,
				hasMatchMedia = $window.matchMedia !== undefined && !!$window.matchMedia('!').addListener,
				mqListListener,
				mmListener,
				debounceResize,
				mq = void 0,
				mqChange = void 0,
				debounceSpeed = !!debounce ? debounce : 250;

			if (hasMatchMedia) {
				mqChange = function (mq) {
					if (mq.matches && typeof options.enter === 'function') {
						options.enter(mq);
					} else {
						if (typeof options.exit === 'function') {
							options.exit(mq);
						}
					}
					if (typeof options.change === 'function') {
						options.change(mq);
					}
				};

				createListener = function () {
					mq = $window.matchMedia(query);
					mqListListener = function () {
						return mqChange(mq)
					};

					mq.addListener(mqListListener);

					// bind to the orientationchange event and fire mqChange
					$win.bind('orientationchange', mqListListener);

					// cleanup listeners when $scope is $destroyed
					$scope.$on('$destroy', function () {
						mq.removeListener(mqListListener);
						$win.unbind('orientationchange', mqListListener);
					});

					return mqChange(mq);
				};

				return createListener();

			} else {
				breakpoints = {};

				mqChange = function (mq) {
					if (mq.matches) {
						if (!!breakpoints[query] === false && (typeof options.enter === 'function')) {
							options.enter(mq);
						}
					} else {
						if (breakpoints[query] === true || breakpoints[query] == null) {
							if (typeof options.exit === 'function') {
								options.exit(mq);
							}
						}
					}

					if ((mq.matches && (!breakpoints[query]) || (!mq.matches && (breakpoints[query] === true || breakpoints[query] == null)))) {
						if (typeof options.change === 'function') {
							options.change(mq);
						}
					}

					return breakpoints[query] = mq.matches;
				};

				var convertEmToPx = function (value) {
					var emElement = document.createElement('div');

					emElement.style.width = '1em';
					emElement.style.position = 'absolute';
					document.body.appendChild(emElement);
					px = value * emElement.offsetWidth;
					document.body.removeChild(emElement);

					return px;
				};

				var getPXValue = function (width, unit) {
					var value;
					value = void 0;
					switch (unit) {
						case 'em':
							value = convertEmToPx(width);
							break;
						default:
							value = width;
					}
					return value;
				};

				breakpoints[query] = null;

				mmListener = function () {
					var parts = query.match(/\((.*)-.*:\s*([\d\.]*)(.*)\)/),
						constraint = parts[1],
						value = getPXValue(parseInt(parts[2], 10), parts[3]),
						fakeMatchMedia = {},
						windowWidth = $window.innerWidth || document.documentElement.clientWidth;

					fakeMatchMedia.matches = constraint === 'max' && value > windowWidth || constraint === 'min' && value < windowWidth;

					return mqChange(fakeMatchMedia);
				};

				var fakeMatchMediaResize = function () {
					clearTimeout(debounceResize);
					debounceResize = $timeout(mmListener, debounceSpeed);
				};

				$win.bind('resize', fakeMatchMediaResize);

				$scope.$on('$destroy', function () {
					$win.unbind('resize', fakeMatchMediaResize);
				});

				return mmListener();
			}
		};
	}]);
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.filter('prettyDate', prettyDate);

	function prettyDate() {
		return function (dateStr) {
			var d = new Date(dateStr),
				monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
				month = monthsArr[d.getMonth()],
				day = d.getDate(),
				year = d.getFullYear(),
				prettyDate;

			prettyDate = month + ' ' + day + ' ' + year;

			return prettyDate;
		};
	}
})();
// User API $http calls
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('rsvpData', rsvpData);

	/**
	 * GET promise response function
	 * Checks typeof data returned and succeeds if JS object, throws error if not
	 *
	 * @param response {*} data from $http
	 * @returns {*} object, array
	 * @private
	 */
	function _getRes(response) {
		if (typeof response.data === 'object') {
			return response.data;
		} else {
			throw new Error('retrieved data is not typeof object.');
		}
	}

	rsvpData.$inject = ['$http'];

	function rsvpData($http) {
		/**
		 * Get all RSVPed guests for a specific event by event ID
		 *
		 * @param eventId {string} event MongoDB _id
		 * @returns {promise}
		 */
		this.getEventGuests = function(eventId) {
			return $http
				.get('/api/rsvps/event/' + eventId)
				.then(_getRes);
		};

		/**
		 * Create a new RSVP for an event
		 *
		 * @param eventId {string} event MongoDB _id
		 * @param rsvpData {object} new RSVP data
		 * @returns {promise}
		 */
		this.createRsvp = function(eventId, rsvpData) {
			return $http
				.post('/api/rsvp/event/' + eventId, rsvpData);
		};

		/**
		 * Update an RSVP by specific RSVP ID
		 *
		 * @param rsvpId {string} RSVP MongoDB _id
		 * @param rsvpData {object} updated RSVP data
		 * @returns {promise}
		 */
		this.updateRsvp = function(rsvpId, rsvpData) {
			return $http
				.put('/api/rsvp/' + rsvpId, rsvpData);
		};
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.filter('trustAsHTML', trustAsHTML);

	trustAsHTML.$inject = ['$sce'];

	function trustAsHTML($sce) {
		return function (text) {
			return $sce.trustAsHtml(text);
		};
	}
})();
// User directive
(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('user', user);

	user.$inject = ['userData', '$auth'];

	function user(userData, $auth) {

		/**
		 * User directive controller
		 */
		function userCtrl() {
			// controllerAs ViewModel
			var u = this;

			/**
			 * Check if the current user is authenticated
			 *
			 * @returns {boolean}
			 */
			u.isAuthenticated = function() {
				return $auth.isAuthenticated();
			};

			// API request to get the user, passing success callback function that sets the user's info
			userData.getUser().then(function(data) {
				u.user = data;
			});
		}

		return {
			restrict: 'EA',
			controller: userCtrl,
			controllerAs: 'u',
			template: '<div ng-if="u.isAuthenticated() && !!u.user" class="user clearfix"><img ng-if="!!u.user.picture" ng-src="{{u.user.picture}}" class="user-picture" /><span class="user-displayName">{{u.user.displayName}}</span></div>'
		};
	}
})();
// User API $http calls
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('userData', userData);

	/**
	 * GET promise response function
	 * Checks typeof data returned and succeeds if JS object, throws error if not
	 *
	 * @param response {*} data from $http
	 * @returns {*} object, array
	 * @private
	 */
	function _getRes(response) {
		if (typeof response.data === 'object') {
			return response.data;
		} else {
			throw new Error('retrieved data is not typeof object.');
		}
	}

	userData.$inject = ['$http'];

	function userData($http) {
		/**
		 * Get current user's data
		 *
		 * @returns {promise}
		 */
		this.getUser = function() {
			return $http
				.get('/api/me')
				.then(_getRes);
		};

		/**
		 * Update current user's profile data
		 *
		 * @param profileData {object} updated profile data
		 * @returns {promise}
		 */
		this.updateUser = function(profileData) {
			return $http
				.put('/api/me', profileData);
		};

		/**
		 * Get all users (admin authorized only)
		 *
		 * @returns {promise}
		 */
		this.getAllUsers = function() {
			return $http
				.get('/api/users')
				.then(_getRes);
		};
	}
})();
// For events based on viewport size - updates as viewport is resized
(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('viewSwitch', viewSwitch);

	viewSwitch.$inject = ['mediaCheck', 'MQ', '$timeout'];

	function viewSwitch(mediaCheck, MQ, $timeout) {

		viewSwitchLink.$inject = ['$scope'];

		/**
		 * viewSwitch directive link function
		 *
		 * @param $scope
		 */
		function viewSwitchLink($scope) {
			// data object
			$scope.vs = {};

			/**
			 * Function to execute on enter media query
			 *
			 * @private
			 */
			function _enterFn() {
				$timeout(function () {
					$scope.vs.viewformat = 'small';
				});
			}

			/**
			 * Function to execute on exit media query
			 *
			 * @private
			 */
			function _exitFn() {
				$timeout(function () {
					$scope.vs.viewformat = 'large';
				});
			}

			// Initialize mediaCheck
			mediaCheck.init({
				scope: $scope,
				mq: MQ.SMALL,
				enter: _enterFn,
				exit: _exitFn
			});
		}

		return {
			restrict: 'EA',
			link: viewSwitchLink
		};
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('EventDetailCtrl', EventDetailCtrl);

	EventDetailCtrl.$inject = ['$scope', '$routeParams', '$auth', 'userData', 'eventData', '$rootScope', 'Event'];

	function EventDetailCtrl($scope, $routeParams, $auth, userData, eventData, $rootScope, Event) {
		var event = this,
			_eventId = $routeParams.eventId;

		/**
		 * Determines if the user is authenticated
		 *
		 * @returns {boolean}
		 */
		event.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		event.showModal = false;

		event.openRsvpModal = function() {
			event.showModal = true;
		};

		/**
		 * Fetch the user's data and process RSVP information
		 *
		 * @private
		 */
		function _getUserData() {

			/**
			 * Function for successful API call retrieving user data
			 * Check if user is admin
			 * Then calls RSVP data and determines if user has RSVPed to this event
			 *
			 * @param data {object} promise provided by $http success
			 * @private
			 */
			function _userSuccess(data) {
				event.user = data;
				event.isAdmin = data.isAdmin;

				var _rsvps = event.user.rsvps;

				for (var i = 0; i < _rsvps.length; i++) {
					var thisRsvp = _rsvps[i];

					if (thisRsvp.eventId === _eventId) {
						event.rsvpObj = thisRsvp;
						break;
					}
				}

				event.noRsvp = !event.rsvpObj;
				event.rsvpBtnText = event.noRsvp ? 'RSVP' : 'Update my RSVP';
				event.rsvpReady = true;
			}

			userData.getUser().then(_userSuccess);
		}

		_getUserData();

		// when RSVP has been submitted, update user data
		$rootScope.$on('rsvpSubmitted', _getUserData);

		function _generateIcal() {
			event.cal = ics();

			var _startD = Event.getJSDatetime(event.detail.startDate, event.detail.startTime),
				_endD = Event.getJSDatetime(event.detail.endDate, event.detail.endTime);

			event.cal.addEvent(event.detail.title, event.detail.description, event.detail.location, _startD, _endD);
		}

		event.downloadIcs = function() {
			event.cal.download();
		};

		/**
		 * Function for successful API call getting single event detail
		 *
		 * @param data {object} promise provided by $http success
		 * @private
		 */
		function _eventSuccess(data) {
			event.detail = data;
			event.detail.prettyDate = Event.getPrettyDatetime(event.detail);
			event.detail.expired = Event.expired(event.detail);
			event.eventReady = true;
		}

		eventData.getEvent(_eventId).then(_eventSuccess);

		var _watchRsvpReady = $scope.$watch('event.rsvpReady', function(newVal, oldVal) {
			if (newVal && event.detail && event.detail.rsvp && event.rsvpObj) {
				_generateIcal();
			}
		});
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('rsvpForm', rsvpForm);

	rsvpForm.$inject = ['rsvpData', '$timeout', '$rootScope'];

	function rsvpForm(rsvpData, $timeout, $rootScope) {

		rsvpFormCtrl.$inject = ['$scope'];

		function rsvpFormCtrl($scope) {
			// controllerAs syntax
			var rf = this;

			// check if form is create or edit (does the model already exist or not)
			var _isCreate = !rf.formModel,
				_isEdit = rf.formModel;

			rf.numberRegex = /^([1-9]|10)$/;

			if (_isCreate && rf.userName) {
				rf.formModel = {
					userId: rf.userId,
					eventName: rf.event.title,
					name: rf.userName
				};
			}

			/**
			 * Watch user's attending input and if true, set default number of guests to 1
			 *
			 * @type {*|function()}
			 * @private
			 */
			var _watchAttending = $scope.$watch('rf.formModel.attending', function(newVal, oldVal) {
				if (newVal === true) {
					rf.formModel.guests = 1;

					// deregister $watch
					_watchAttending();
				}
			});

			/**
			 * Reset the state of the form Submit button
			 *
			 * @private
			 */
			function _btnSubmitReset() {
				rf.btnSaved = false;
				rf.btnSubmitText = _isCreate ? 'Submit RSVP' : 'Update RSVP';
			}

			_btnSubmitReset();

			/**
			 * Function for RSVP API call succeeded
			 *
			 * @private
			 */
			function _rsvpSuccess() {
				rf.btnSaved = true;
				rf.btnSubmitText = _isCreate ? 'Submitted!' : 'Updated!';

				$rootScope.$broadcast('rsvpSubmitted');

				$timeout(function() {
					_btnSubmitReset();
					rf.showModal = false;
				}, 1000);
			}

			/**
			 * Function for RSVP API call error
			 *
			 * @private
			 */
			function _rsvpError() {
				rf.btnSaved = 'error';
				rf.btnSubmitText = _isCreate ? 'Error submitting!' : 'Error updating!';

				$timeout(_btnSubmitReset, 3000);
			}

			/**
			 * Click submit button
			 * Submit RSVP to API
			 * Form @ rsvpForm.tpl.html
			 */
			rf.submitRsvp = function() {
				rf.btnSubmitText = 'Sending...';

				if (_isCreate) {
					rsvpData.createRsvp(rf.event._id, rf.formModel).then(_rsvpSuccess, _rsvpError);

				} else if (_isEdit) {
					rsvpData.updateRsvp(rf.formModel._id, rf.formModel).then(_rsvpSuccess, _rsvpError);
				}
			};

			/**
			 * Click function to close the modal window
			 */
			rf.closeModal = function() {
				rf.showModal = false;
			}
		}

		return {
			restrict: 'EA',
			scope: {
				event: '=',
				userName: '@',
				userId: '@',
				formModel: '=',
				showModal: '='
			},
			templateUrl: '/ng-app/event-detail/rsvpForm.tpl.html',
			controller: rsvpFormCtrl,
			controllerAs: 'rf',
			bindToController: true
		}
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('EventsCtrl', EventsCtrl);

	EventsCtrl.$inject = ['$auth', 'eventData', 'Event'];

	function EventsCtrl($auth, eventData, Event) {
		var events = this;

		/**
		 * Determines if the user is authenticated
		 *
		 * @returns {boolean}
		 */
		events.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		/**
		 * Function for successful API call getting events list
		 *
		 * @param data {Array} promise provided by $http success
		 * @private
		 */
		function _eventsSuccess(data) {
			events.allEvents = data;

			for (var i = 0; i < events.allEvents.length; i++) {
				var thisEvt = events.allEvents[i];

				thisEvt.startDateJS = Event.getJSDatetime(thisEvt.startDate, thisEvt.startTime);
				thisEvt.expired = Event.expired(thisEvt);
			}

			events.eventsReady = true;
		}

		eventData.getAllEvents().then(_eventsSuccess);

		/**
		 * Custom sort function
		 * Get event start date and change to real date to sort by
		 *
		 * @param evt {object} event object
		 * @returns {Date}
		 */
		events.sortStartDate = function(evt) {
			return Event.getJSDatetime(evt.startDate, evt.startTime);
		};

		/**
		 * Clear search query
		 */
		//events.clearQuery = function() {
		//	events.query = '';
		//};
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AccountCtrl', AccountCtrl);

	AccountCtrl.$inject = ['$scope', '$location', '$auth', 'userData', '$timeout', 'OAUTH', 'User'];

	function AccountCtrl($scope, $location, $auth, userData, $timeout, OAUTH, User) {
		// controllerAs ViewModel
		var account = this;

		// All available login services
		account.logins = OAUTH.LOGINS;

		/**
		 * Is the user authenticated?
		 *
		 * @returns {boolean}
		 */
		account.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		var _tab = $location.search().view;

		account.tabs = [
			{
				name: 'User Info',
				query: 'user-info'
			},
			{
				name: 'Manage Logins',
				query: 'manage-logins'
			},
			{
				name: 'RSVPs',
				query: 'rsvps'
			}
		];

		account.currentTab = _tab ? _tab : 'user-info';

		/**
		 * Change tabs by watching for route update
		 */
		$scope.$on('$routeUpdate', function(event, next) {
			account.currentTab = next.params.view || 'user-info';
		});

		/**
		 * Get user's profile information
		 */
		account.getProfile = function() {
			/**
			 * Function for successful API call getting user's profile data
			 * Show Account UI
			 *
			 * @param data {object} promise provided by $http success
			 * @private
			 */
			function _getUserSuccess(data) {
				account.user = data;
				account.administrator = account.user.isAdmin;
				account.linkedAccounts = User.getLinkedAccounts(account.user, 'account');
				account.showAccount = true;
				account.rsvps = account.user.rsvps;
			}

			/**
			 * Function for error API call getting user's profile data
			 * Show an error alert in the UI
			 *
			 * @param error
			 * @private
			 */
			function _getUserError(error) {
				account.errorGettingUser = true;
			}

			userData.getUser().then(_getUserSuccess, _getUserError);
		};

		/**
		 * Reset profile save button to initial state
		 *
		 * @private
		 */
		function _btnSaveReset() {
			account.btnSaved = false;
			account.btnSaveText = 'Save';
		}

		_btnSaveReset();

		/**
		 * Watch display name changes to check for empty or null string
		 * Set button text accordingly
		 *
		 * @param newVal {string} updated displayName value from input field
		 * @param oldVal {*} previous displayName value
		 * @private
		 */
		function _watchDisplayName(newVal, oldVal) {
			if (newVal === '' || newVal === null) {
				account.btnSaveText = 'Enter Name';
			} else {
				account.btnSaveText = 'Save';
			}
		}
		$scope.$watch('account.user.displayName', _watchDisplayName);

		/**
		 * Update user's profile information
		 * Called on submission of update form
		 */
		account.updateProfile = function() {
			var profileData = { displayName: account.user.displayName };

			/**
			 * Success callback when profile has been updated
			 *
			 * @private
			 */
			function _updateSuccess() {
				account.btnSaved = true;
				account.btnSaveText = 'Saved!';

				$timeout(_btnSaveReset, 2500);
			}

			/**
			 * Error callback when profile update has failed
			 *
			 * @private
			 */
			function _updateError() {
				account.btnSaved = 'error';
				account.btnSaveText = 'Error saving!';

				$timeout(_btnSaveReset, 3000);
			}

			if (!!account.user.displayName) {
				// Set status to Saving... and update upon success or error in callbacks
				account.btnSaveText = 'Saving...';

				// Update the user, passing profile data and assigning success and error callbacks
				userData.updateUser(profileData).then(_updateSuccess, _updateError);
			}
		};

		/**
		 * Link third-party provider
		 *
		 * @param {string} provider
		 */
		account.link = function(provider) {
			$auth.link(provider)
				.then(function() {
					account.getProfile();
				})
				.catch(function(response) {
					alert(response.data.message);
				});
		};

		/**
		 * Unlink third-party provider
		 *
		 * @param {string} provider
		 */
		account.unlink = function(provider) {
			$auth.unlink(provider)
				.then(function() {
					account.getProfile();
				})
				.catch(function(response) {
					alert(response.data ? response.data.message : 'Could not unlink ' + provider + ' account');
				});
		};

		account.getProfile();
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('HeaderCtrl', headerCtrl);

	headerCtrl.$inject = ['$scope', '$location', 'localData', '$auth', 'userData'];

	function headerCtrl($scope, $location, localData, $auth, userData) {
		// controllerAs ViewModel
		var header = this;

		/**
		 * Log the user out of whatever authentication they've signed in with
		 */
		header.logout = function() {
			header.adminUser = undefined;
			$auth.logout('/login');
		};

		/**
		 * If user is authenticated and adminUser is undefined,
		 * get the user and set adminUser boolean.
		 *
		 * Do this on first controller load (init, refresh)
		 * and subsequent location changes (ie, catching logout, login, etc).
		 *
		 * @private
		 */
		function _checkUserAdmin() {
			// if user is authenticated and not defined yet, check if they're an admin
			if ($auth.isAuthenticated() && header.adminUser === undefined) {
				userData.getUser()
					.then(function(data) {
						header.adminUser = data.isAdmin;
					});
			}
		}
		_checkUserAdmin();
		$scope.$on('$locationChangeSuccess', _checkUserAdmin);

		/**
		 * Is the user authenticated?
		 *
		 * @returns {boolean}
		 */
		header.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		/**
		 * Currently active nav item when '/' index
		 *
		 * @param {string} path
		 * @returns {boolean}
		 */
		header.indexIsActive = function(path) {
			// path should be '/'
			return $location.path() === path;
		};

		/**
		 * Currently active nav item
		 *
		 * @param {string} path
		 * @returns {boolean}
		 */
		header.navIsActive = function(path) {
			return $location.path().substr(0, path.length) === path;
		};
	}

})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('navControl', navControl);

	navControl.$inject = ['mediaCheck', 'MQ', '$timeout'];

	function navControl(mediaCheck, MQ, $timeout) {

		navControlLink.$inject = ['$scope', '$element', '$attrs'];

		function navControlLink($scope) {
			// data object
			$scope.nav = {};

			var _body = angular.element('body'),
				_navOpen;

			/**
			 * Open mobile navigation
			 *
			 * @private
			 */
			function _openNav() {
				_body
					.removeClass('nav-closed')
					.addClass('nav-open');

				_navOpen = true;
			}

			/**
			 * Close mobile navigation
			 *
			 * @private
			 */
			function _closeNav() {
				_body
					.removeClass('nav-open')
					.addClass('nav-closed');

				_navOpen = false;
			}

			/**
			 * Function to execute when entering mobile media query
			 * Close nav and set up menu toggling functionality
			 *
			 * @private
			 */
			function _enterMobile() {
				_closeNav();

				$timeout(function () {
					/**
					 * Toggle mobile navigation open/closed
					 */
					$scope.nav.toggleNav = function () {
						if (!_navOpen) {
							_openNav();
						} else {
							_closeNav();
						}
					};
				});

				$scope.$on('$locationChangeSuccess', _closeNav);
			}

			/**
			 * Function to execute when exiting mobile media query
			 * Disable menu toggling and remove body classes
			 *
			 * @private
			 */
			function _exitMobile() {
				$timeout(function () {
					$scope.nav.toggleNav = null;
				});

				_body.removeClass('nav-closed nav-open');
			}

			// Set up functionality to run on enter/exit of media query
			mediaCheck.init({
				scope: $scope,
				mq: MQ.SMALL,
				enter: _enterMobile,
				exit: _exitMobile
			});
		}

		return {
			restrict: 'EA',
			link: navControlLink
		};
	}

})();

(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('LoginCtrl', LoginCtrl);

	LoginCtrl.$inject = ['$auth', 'OAUTH', '$rootScope', '$location'];

	function LoginCtrl($auth, OAUTH, $rootScope, $location) {
		// controllerAs ViewModel
		var login = this;

		login.logins = OAUTH.LOGINS;

		/**
		 * Authenticate the user via Oauth with the specified provider
		 *
		 * @param {string} provider - (twitter, facebook, github, google)
		 */
		login.authenticate = function(provider) {
			login.loggingIn = true;

			/**
			 * Successfully authenticated
			 * Go to initially intended authenticated path
			 *
			 * @param response {object} promise response
			 * @private
			 */
			function _authSuccess(response) {
				login.loggingIn = false;

				if ($rootScope.authPath) {
					$location.path($rootScope.authPath);
				}
			}

			$auth.authenticate(provider)
				.then(_authSuccess)
				.catch(function(response) {
					console.log(response.data);
					login.loggingIn = 'error';
					login.loginMsg = ''
				});
		}
	}
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUuanMiLCJhZG1pbi9BZG1pbi5jdHJsLmpzIiwiYWRtaW4vQWRtaW5FdmVudExpc3QuY3RybC5qcyIsImFkbWluL0VkaXRFdmVudC5jdHJsLmpzIiwiYWRtaW4vZXZlbnRGb3JtLmRpci5qcyIsImFkbWluL3ZpZXdFdmVudEd1ZXN0cy5kaXIuanMiLCJjb3JlL0V2ZW50LmZhY3RvcnkuanMiLCJjb3JlL01RLmNvbnN0YW50LmpzIiwiY29yZS9PQVVUSC5jb25zdGFudC5qcyIsImNvcmUvVXNlci5mYWN0b3J5LmpzIiwiY29yZS9VdGlscy5mYWN0b3J5LmpzIiwiY29yZS9hcHAuYXV0aC5qcyIsImNvcmUvYXBwLmNvbmZpZy5qcyIsImNvcmUvZGV0ZWN0QWRCbG9jay5kaXIuanMiLCJjb3JlL2V2ZW50RGF0YS5zZXJ2aWNlLmpzIiwiY29yZS9sb2NhbERhdGEuc2VydmljZS5qcyIsImNvcmUvbWVkaWFDaGVjay5zZXJ2aWNlLmpzIiwiY29yZS9wcmV0dHlEYXRlLmZpbHRlci5qcyIsImNvcmUvcnN2cERhdGEuc2VydmljZS5qcyIsImNvcmUvdHJ1c3RBc0hUTUwuZmlsdGVyLmpzIiwiY29yZS91c2VyLmRpci5qcyIsImNvcmUvdXNlckRhdGEuc2VydmljZS5qcyIsImNvcmUvdmlld1N3aXRjaC5kaXIuanMiLCJldmVudC1kZXRhaWwvRXZlbnREZXRhaWwuY3RybC5qcyIsImV2ZW50LWRldGFpbC9yc3ZwRm9ybS5kaXIuanMiLCJldmVudHMvRXZlbnRzLmN0cmwuanMiLCJhY2NvdW50L0FjY291bnQuY3RybC5qcyIsImhlYWRlci9IZWFkZXIuY3RybC5qcyIsImhlYWRlci9uYXZDb250cm9sLmRpci5qcyIsImxvZ2luL0xvZ2luLmN0cmwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibmctYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhclxuXHQubW9kdWxlKCdteUFwcCcsIFsnbmdSb3V0ZScsICduZ1Jlc291cmNlJywgJ25nU2FuaXRpemUnLCAnbmdNZXNzYWdlcycsICdtZWRpYUNoZWNrJywgJ3NhdGVsbGl6ZXInXSk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuY29udHJvbGxlcignQWRtaW5DdHJsJywgQWRtaW5DdHJsKTtcblxuXHRBZG1pbkN0cmwuJGluamVjdCA9IFsnJHNjb3BlJywgJyRsb2NhdGlvbicsICckYXV0aCcsICd1c2VyRGF0YScsICdVc2VyJywgJ3JzdnBEYXRhJ107XG5cblx0ZnVuY3Rpb24gQWRtaW5DdHJsKCRzY29wZSwgJGxvY2F0aW9uLCAkYXV0aCwgdXNlckRhdGEsIFVzZXIsIHJzdnBEYXRhKSB7XG5cdFx0Ly8gY29udHJvbGxlckFzIFZpZXdNb2RlbFxuXHRcdHZhciBhZG1pbiA9IHRoaXM7XG5cblx0XHQvLyB2ZXJpZnkgdGhhdCB1c2VyIGlzIGFkbWluXG5cdFx0dXNlckRhdGEuZ2V0VXNlcigpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0YWRtaW4uYWRtaW5SZWFkeSA9IHRydWU7XG5cblx0XHRcdGlmIChkYXRhLmlzQWRtaW4pIHtcblx0XHRcdFx0YWRtaW4uc2hvd0FkbWluID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8qKlxuXHRcdCAqIERldGVybWluZXMgaWYgdGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZFxuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdFx0ICovXG5cdFx0YWRtaW4uaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gJGF1dGguaXNBdXRoZW50aWNhdGVkKCk7XG5cdFx0fTtcblxuXHRcdHZhciBfdGFiID0gJGxvY2F0aW9uLnNlYXJjaCgpLnZpZXc7XG5cblx0XHRhZG1pbi50YWJzID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiAnRXZlbnRzJyxcblx0XHRcdFx0cXVlcnk6ICdldmVudHMnXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiAnQWRkIEV2ZW50Jyxcblx0XHRcdFx0cXVlcnk6ICdhZGQtZXZlbnQnXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiAnVXNlcnMnLFxuXHRcdFx0XHRxdWVyeTogJ3VzZXJzJ1xuXHRcdFx0fVxuXHRcdF07XG5cblx0XHRhZG1pbi5jdXJyZW50VGFiID0gX3RhYiA/IF90YWIgOiAnZXZlbnRzJztcblxuXHRcdC8qKlxuXHRcdCAqIENoYW5nZSB0YWJzIGJ5IHdhdGNoaW5nIGZvciByb3V0ZSB1cGRhdGVcblx0XHQgKi9cblx0XHQkc2NvcGUuJG9uKCckcm91dGVVcGRhdGUnLCBmdW5jdGlvbihldmVudCwgbmV4dCkge1xuXHRcdFx0YWRtaW4uY3VycmVudFRhYiA9IG5leHQucGFyYW1zLnZpZXcgfHwgJ2V2ZW50cyc7XG5cdFx0fSk7XG5cblx0XHQvKipcblx0XHQgKiBGdW5jdGlvbiBmb3Igc3VjY2Vzc2Z1bCBBUEkgY2FsbCBnZXR0aW5nIHVzZXIgbGlzdFxuXHRcdCAqIFNob3cgQWRtaW4gVUlcblx0XHQgKiBEaXNwbGF5IGxpc3Qgb2YgdXNlcnNcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSBkYXRhIHtBcnJheX0gcHJvbWlzZSBwcm92aWRlZCBieSAkaHR0cCBzdWNjZXNzXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHRmdW5jdGlvbiBfZ2V0QWxsVXNlcnNTdWNjZXNzKGRhdGEpIHtcblx0XHRcdGFkbWluLnVzZXJzID0gZGF0YTtcblxuXHRcdFx0YW5ndWxhci5mb3JFYWNoKGFkbWluLnVzZXJzLCBmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRcdHVzZXIubGlua2VkQWNjb3VudHMgPSBVc2VyLmdldExpbmtlZEFjY291bnRzKHVzZXIpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0dXNlckRhdGEuZ2V0QWxsVXNlcnMoKS50aGVuKF9nZXRBbGxVc2Vyc1N1Y2Nlc3MpO1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyBSU1ZQZWQgZ3Vlc3QgbW9kYWxcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSBldmVudElkIHtzdHJpbmd9IGV2ZW50IElEIHRvIGdldCBSU1ZQcyBmb3Jcblx0XHQgKiBAcGFyYW0gZXZlbnROYW1lIHtzdHJpbmd9IGV2ZW50IG5hbWUgdG8gZ2V0IFJTVlBzIGZvclxuXHRcdCAqL1xuXHRcdGFkbWluLnNob3dHdWVzdHMgPSBmdW5jdGlvbihldmVudElkLCBldmVudE5hbWUpIHtcblx0XHRcdGFkbWluLnNob3dHdWVzdHNFdmVudElkID0gZXZlbnRJZDtcblx0XHRcdGFkbWluLnNob3dHdWVzdHNFdmVudE5hbWUgPSBldmVudE5hbWU7XG5cdFx0XHRhZG1pbi5zaG93TW9kYWwgPSB0cnVlO1xuXHRcdH07XG5cdH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuY29udHJvbGxlcignQWRtaW5FdmVudExpc3RDdHJsJywgQWRtaW5FdmVudExpc3RDdHJsKTtcblxuXHRBZG1pbkV2ZW50TGlzdEN0cmwuJGluamVjdCA9IFsnZXZlbnREYXRhJywgJyRsb2NhdGlvbicsICckdGltZW91dCcsICdFdmVudCddO1xuXG5cdGZ1bmN0aW9uIEFkbWluRXZlbnRMaXN0Q3RybChldmVudERhdGEsICRsb2NhdGlvbiwgJHRpbWVvdXQsIEV2ZW50KSB7XG5cdFx0Ly8gY29udHJvbGxlckFzIFZpZXdNb2RlbFxuXHRcdHZhciBhRXZ0ID0gdGhpcztcblxuXHRcdGFFdnQuZXZ0VXJsID0gJGxvY2F0aW9uLnByb3RvY29sKCkgKyAnOi8vJyArICRsb2NhdGlvbi5ob3N0KCkgKyAnL2V2ZW50Lyc7XG5cblx0XHQvKipcblx0XHQgKiBIaWRlIFVSTCBpbnB1dCBmaWVsZCB3aGVuIGJsdXJyZWRcblx0XHQgKi9cblx0XHRhRXZ0LmJsdXJVcmxJbnB1dCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0YUV2dC5jb3B5SW5wdXQgPSBudWxsO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IFVSTCBpbnB1dCBmaWVsZCB3aGVuIElEIGxpbmsgaXMgY2xpY2tlZFxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIGluZGV4XG5cdFx0ICovXG5cdFx0YUV2dC5zaG93VXJsSW5wdXQgPSBmdW5jdGlvbihpbmRleCkge1xuXHRcdFx0YUV2dC5jb3B5SW5wdXQgPSBpbmRleDtcblxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGFuZ3VsYXIuZWxlbWVudCgnI2UnICsgaW5kZXgpLmZpbmQoJ2lucHV0Jykuc2VsZWN0KCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogRnVuY3Rpb24gZm9yIHN1Y2Nlc3NmdWwgQVBJIGNhbGwgZ2V0dGluZyBhbGwgZXZlbnRzXG5cdFx0ICogU2hvdyBBZG1pbiBFdmVudHMgVUlcblx0XHQgKiBEaXNwbGF5IGxpc3Qgb2YgZXZlbnRzXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gZGF0YSB7QXJyYXl9IHByb21pc2UgcHJvdmlkZWQgYnkgJGh0dHAgc3VjY2Vzc1xuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gX2dldEFsbEV2ZW50c1N1Y2Nlc3MoZGF0YSkge1xuXHRcdFx0YUV2dC5ldmVudHMgPSBkYXRhO1xuXHRcdFx0YUV2dC5ldmVudHNSZWFkeSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0ZXZlbnREYXRhLmdldEFsbEV2ZW50cygpLnRoZW4oX2dldEFsbEV2ZW50c1N1Y2Nlc3MpO1xuXG5cdFx0LyoqXG5cdFx0ICogQ3VzdG9tIHNvcnQgZnVuY3Rpb25cblx0XHQgKiBHZXQgZXZlbnQgc3RhcnQgZGF0ZSBhbmQgY2hhbmdlIHRvIHJlYWwgZGF0ZSB0byBzb3J0IGJ5XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gZXZ0IHtvYmplY3R9IGV2ZW50IG9iamVjdFxuXHRcdCAqIEByZXR1cm5zIHtEYXRlfVxuXHRcdCAqL1xuXHRcdGFFdnQuc29ydFN0YXJ0RGF0ZSA9IGZ1bmN0aW9uKGV2dCkge1xuXHRcdFx0cmV0dXJuIEV2ZW50LmdldEpTRGF0ZXRpbWUoZXZ0LnN0YXJ0RGF0ZSwgZXZ0LnN0YXJ0VGltZSk7XG5cdFx0fTtcblx0fVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5jb250cm9sbGVyKCdFZGl0RXZlbnRDdHJsJywgRWRpdEV2ZW50Q3RybCk7XG5cblx0RWRpdEV2ZW50Q3RybC4kaW5qZWN0ID0gWyckYXV0aCcsICd1c2VyRGF0YScsICdldmVudERhdGEnLCAnJHJvdXRlUGFyYW1zJywgJyRsb2NhdGlvbicsICckdGltZW91dCddO1xuXG5cdGZ1bmN0aW9uIEVkaXRFdmVudEN0cmwoJGF1dGgsIHVzZXJEYXRhLCBldmVudERhdGEsICRyb3V0ZVBhcmFtcywgJGxvY2F0aW9uLCAkdGltZW91dCkge1xuXHRcdC8vIGNvbnRyb2xsZXJBcyBWaWV3TW9kZWxcblx0XHR2YXIgZWRpdCA9IHRoaXM7XG5cblx0XHQvLyBnZXQgdGhlIGV2ZW50IElEXG5cdFx0dmFyIF9ldmVudElkID0gJHJvdXRlUGFyYW1zLmV2ZW50SWQ7XG5cblx0XHQvLyB0YWJzXG5cdFx0ZWRpdC50YWJzID0gWydVcGRhdGUgRGV0YWlscycsICdEZWxldGUgRXZlbnQnXTtcblx0XHRlZGl0LmN1cnJlbnRUYWIgPSAwO1xuXG5cdFx0ZWRpdC5jaGFuZ2VUYWIgPSBmdW5jdGlvbihpbmRleCkge1xuXHRcdFx0ZWRpdC5jdXJyZW50VGFiID0gaW5kZXg7XG5cdFx0fTtcblxuXHRcdC8vIHZlcmlmeSB0aGF0IHVzZXIgaXMgYWRtaW5cblx0XHR1c2VyRGF0YS5nZXRVc2VyKCkudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRlZGl0LnNob3dFZGl0ID0gZGF0YS5pc0FkbWluID8gdHJ1ZSA6IGZhbHNlO1xuXHRcdH0pO1xuXG5cdFx0LyoqXG5cdFx0ICogRGV0ZXJtaW5lcyBpZiB0aGUgdXNlciBpcyBhdXRoZW50aWNhdGVkXG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0XHQgKi9cblx0XHRlZGl0LmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuICRhdXRoLmlzQXV0aGVudGljYXRlZCgpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBGdW5jdGlvbiByZXR1cm5lZCBvbiBzdWNjZXNzZnVsIEFQSSBjYWxsIGZvciB0aGlzIGV2ZW50XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gZGF0YSB7b2JqZWN0fSBldmVudCBkYXRhXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHRmdW5jdGlvbiBfZ2V0RXZlbnRTdWNjZXNzKGRhdGEpIHtcblx0XHRcdGVkaXQuZWRpdEV2ZW50ID0gZGF0YTtcblx0XHRcdGVkaXQuc2hvd0VkaXRGb3JtID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRldmVudERhdGEuZ2V0RXZlbnQoX2V2ZW50SWQpLnRoZW4oX2dldEV2ZW50U3VjY2Vzcyk7XG5cblx0XHQvKipcblx0XHQgKiBSZXNldCB0aGUgZGVsZXRlIGJ1dHRvbiB0byBkZWZhdWx0IHN0YXRlXG5cdFx0ICpcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIF9idG5EZWxldGVSZXNldCgpIHtcblx0XHRcdGVkaXQuYnRuRGVsZXRlID0gZmFsc2U7XG5cdFx0XHRlZGl0LmJ0bkRlbGV0ZVRleHQgPSAnRGVsZXRlIEV2ZW50Jztcblx0XHR9XG5cblx0XHRfYnRuRGVsZXRlUmVzZXQoKTtcblxuXHRcdC8qKlxuXHRcdCAqIEZ1bmN0aW9uIHJldHVybmVkIG9uIHN1Y2Nlc3NmdWwgZGVsZXRpb24gb2YgZXZlbnRcblx0XHQgKlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gX2RlbGV0ZVN1Y2Nlc3MoKSB7XG5cdFx0XHRlZGl0LmJ0bkRlbGV0ZVRleHQgPSAnRGVsZXRlZCEnO1xuXHRcdFx0ZWRpdC5idG5EZWxldGUgPSB0cnVlO1xuXHRcdFx0ZWRpdC5lZGl0RXZlbnQgPSB7fTtcblxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCRsb2NhdGlvbi5wYXRoKCcvYWRtaW4nKTtcblx0XHRcdH0sIDE1MDApO1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIEZ1bmN0aW9uIHJldHVybmVkIG9uIGVycm9yIGRlbGV0aW5nIGV2ZW50XG5cdFx0ICpcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIF9kZWxldGVFcnJvcigpIHtcblx0XHRcdGVkaXQuYnRuRGVsZXRlVGV4dCA9ICdFcnJvciBkZWxldGluZyEnO1xuXG5cdFx0XHQkdGltZW91dChfYnRuRGVsZXRlUmVzZXQsIDMwMDApO1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIERlbGV0ZSB0aGUgZXZlbnRcblx0XHQgKi9cblx0XHRlZGl0LmRlbGV0ZUV2ZW50ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRlZGl0LmJ0bkRlbGV0ZVRleHQgPSAnRGVsZXRpbmcuLi4nO1xuXG5cdFx0XHRldmVudERhdGEuZGVsZXRlRXZlbnQoX2V2ZW50SWQpLnRoZW4oX2RlbGV0ZVN1Y2Nlc3MsIF9kZWxldGVFcnJvcik7XG5cdFx0fTtcblx0fVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5kaXJlY3RpdmUoJ2V2ZW50Rm9ybScsIGV2ZW50Rm9ybSk7XG5cblx0ZXZlbnRGb3JtLiRpbmplY3QgPSBbJ2V2ZW50RGF0YScsICckdGltZW91dCddO1xuXG5cdGZ1bmN0aW9uIGV2ZW50Rm9ybShldmVudERhdGEsICR0aW1lb3V0KSB7XG5cblx0XHRldmVudEZvcm1DdHJsLiRpbmplY3QgPSBbJyRzY29wZSddO1xuXG5cdFx0ZnVuY3Rpb24gZXZlbnRGb3JtQ3RybCgkc2NvcGUpIHtcblx0XHRcdC8vIGNvbnRyb2xsZXJBcyBzeW50YXhcblx0XHRcdHZhciBlZiA9IHRoaXM7XG5cblx0XHRcdC8vIGNoZWNrIGlmIGZvcm0gaXMgY3JlYXRlIG9yIGVkaXRcblx0XHRcdHZhciBfaXNDcmVhdGUgPSBqUXVlcnkuaXNFbXB0eU9iamVjdChlZi5wcmVmaWxsTW9kZWwpLFxuXHRcdFx0XHRfaXNFZGl0ID0gIWpRdWVyeS5pc0VtcHR5T2JqZWN0KGVmLnByZWZpbGxNb2RlbCk7XG5cblx0XHRcdGVmLmRhdGVSZWdleCA9IC9eKCgwP1sxMzU3OF18MTB8MTIpKC18XFwvKSgoWzEtOV0pfCgwWzEtOV0pfChbMTJdKShbMC05XT8pfCgzWzAxXT8pKSgtfFxcLykoKDE5KShbMi05XSkoXFxkezF9KXwoMjApKFswMV0pKFxcZHsxfSl8KFs4OTAxXSkoXFxkezF9KSl8KDA/WzI0NjldfDExKSgtfFxcLykoKFsxLTldKXwoMFsxLTldKXwoWzEyXSkoWzAtOV0/KXwoM1swXT8pKSgtfFxcLykoKDE5KShbMi05XSkoXFxkezF9KXwoMjApKFswMV0pKFxcZHsxfSl8KFs4OTAxXSkoXFxkezF9KSkpJC87XG5cdFx0XHRlZi50aW1lUmVnZXggPSAvXigwP1sxLTldfDFbMDEyXSkoOlswLTVdXFxkKSBbQVBhcF1bbU1dJC9pO1xuXG5cdFx0XHRpZiAoX2lzRWRpdCkge1xuXHRcdFx0XHRlZi5mb3JtTW9kZWwgPSBlZi5wcmVmaWxsTW9kZWw7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogT24gc3RhcnQgZGF0ZSB2YWxpZCBibHVyLCB1cGRhdGUgZW5kIGRhdGUgaWYgZW1wdHlcblx0XHRcdCAqL1xuXHRcdFx0ZWYuc3RhcnREYXRlQmx1ciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAoIWVmLmZvcm1Nb2RlbC5lbmREYXRlKSB7XG5cdFx0XHRcdFx0ZWYuZm9ybU1vZGVsLmVuZERhdGUgPSBlZi5mb3JtTW9kZWwuc3RhcnREYXRlO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHQvKipcblx0XHRcdCAqIFJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgZm9ybSBTdWJtaXQgYnV0dG9uXG5cdFx0XHQgKlxuXHRcdFx0ICogQHByaXZhdGVcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gX2J0blN1Ym1pdFJlc2V0KCkge1xuXHRcdFx0XHRlZi5idG5TYXZlZCA9IGZhbHNlO1xuXHRcdFx0XHRlZi5idG5TdWJtaXRUZXh0ID0gX2lzQ3JlYXRlID8gJ1N1Ym1pdCcgOiAnVXBkYXRlJztcblx0XHRcdH1cblxuXHRcdFx0X2J0blN1Ym1pdFJlc2V0KCk7XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogRnVuY3Rpb24gZm9yIGV2ZW50IEFQSSBjYWxsIHN1Y2NlZWRlZFxuXHRcdFx0ICpcblx0XHRcdCAqIEBwcml2YXRlXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIF9ldmVudFN1Y2Nlc3MoKSB7XG5cdFx0XHRcdGVmLmJ0blNhdmVkID0gdHJ1ZTtcblx0XHRcdFx0ZWYuYnRuU3VibWl0VGV4dCA9IF9pc0NyZWF0ZSA/ICdTYXZlZCEnIDogJ1VwZGF0ZWQhJztcblxuXHRcdFx0XHRpZiAoX2lzQ3JlYXRlKSB7XG5cdFx0XHRcdFx0ZWYuZm9ybU1vZGVsID0ge307XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoX2lzRWRpdCkge1xuXHRcdFx0XHRcdGVmLnNob3dVcGRhdGVEZXRhaWxMaW5rID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCR0aW1lb3V0KF9idG5TdWJtaXRSZXNldCwgMzAwMCk7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogRnVuY3Rpb24gZm9yIGV2ZW50IEFQSSBjYWxsIGVycm9yXG5cdFx0XHQgKlxuXHRcdFx0ICogQHByaXZhdGVcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gX2V2ZW50RXJyb3IoKSB7XG5cdFx0XHRcdGVmLmJ0blNhdmVkID0gJ2Vycm9yJztcblx0XHRcdFx0ZWYuYnRuU3VibWl0VGV4dCA9IF9pc0NyZWF0ZSA/ICdFcnJvciBzYXZpbmchJyA6ICdFcnJvciB1cGRhdGluZyEnO1xuXG5cdFx0XHRcdCR0aW1lb3V0KF9idG5TdWJtaXRSZXNldCwgMzAwMCk7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQ2xpY2sgc3VibWl0IGJ1dHRvblxuXHRcdFx0ICogU3VibWl0IG5ldyBldmVudCB0byBBUElcblx0XHRcdCAqIEZvcm0gQCBldmVudEZvcm0udHBsLmh0bWxcblx0XHRcdCAqL1xuXHRcdFx0ZWYuc3VibWl0RXZlbnQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZWYuYnRuU3VibWl0VGV4dCA9ICdTYXZpbmcuLi4nO1xuXG5cdFx0XHRcdGlmIChfaXNDcmVhdGUpIHtcblx0XHRcdFx0XHRldmVudERhdGEuY3JlYXRlRXZlbnQoZWYuZm9ybU1vZGVsKS50aGVuKF9ldmVudFN1Y2Nlc3MsIF9ldmVudEVycm9yKTtcblxuXHRcdFx0XHR9IGVsc2UgaWYgKF9pc0VkaXQpIHtcblx0XHRcdFx0XHRldmVudERhdGEudXBkYXRlRXZlbnQoZWYuZm9ybU1vZGVsLl9pZCwgZWYuZm9ybU1vZGVsKS50aGVuKF9ldmVudFN1Y2Nlc3MsIF9ldmVudEVycm9yKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0XHRzY29wZToge1xuXHRcdFx0XHRwcmVmaWxsTW9kZWw6ICc9J1xuXHRcdFx0fSxcblx0XHRcdHRlbXBsYXRlVXJsOiAnL25nLWFwcC9hZG1pbi9ldmVudEZvcm0udHBsLmh0bWwnLFxuXHRcdFx0Y29udHJvbGxlcjogZXZlbnRGb3JtQ3RybCxcblx0XHRcdGNvbnRyb2xsZXJBczogJ2VmJyxcblx0XHRcdGJpbmRUb0NvbnRyb2xsZXI6IHRydWVcblx0XHR9XG5cdH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuZGlyZWN0aXZlKCd2aWV3RXZlbnRHdWVzdHMnLCB2aWV3RXZlbnRHdWVzdHMpO1xuXG5cdHZpZXdFdmVudEd1ZXN0cy4kaW5qZWN0ID0gWydyc3ZwRGF0YSddO1xuXG5cdGZ1bmN0aW9uIHZpZXdFdmVudEd1ZXN0cyhyc3ZwRGF0YSkge1xuXG5cdFx0dmlld0V2ZW50R3Vlc3RzQ3RybC4kaW5qZWN0ID0gWyckc2NvcGUnXTtcblxuXHRcdGZ1bmN0aW9uIHZpZXdFdmVudEd1ZXN0c0N0cmwoJHNjb3BlKSB7XG5cdFx0XHQvLyBjb250cm9sbGVyQXMgc3ludGF4XG5cdFx0XHR2YXIgZyA9IHRoaXM7XG5cblx0XHRcdCRzY29wZS4kd2F0Y2goJ2cuZXZlbnRJZCcsIGZ1bmN0aW9uKG5ld1ZhbCwgb2xkVmFsKSB7XG5cdFx0XHRcdGcuZ3Vlc3RzUmVhZHkgPSBmYWxzZTtcblxuXHRcdFx0XHQvKipcblx0XHRcdFx0ICogRnVuY3Rpb24gZm9yIHN1Y2Nlc3NmdWwgQVBJIGNhbGwgZ2V0dGluZyBSU1ZQcyBmb3IgdGhpcyBldmVudFxuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBAcGFyYW0gZGF0YSB7QXJyYXl9IGd1ZXN0cyBhcnJheVxuXHRcdFx0XHQgKiBAcHJpdmF0ZVxuXHRcdFx0XHQgKi9cblx0XHRcdFx0ZnVuY3Rpb24gX2dldEd1ZXN0c1N1Y2Nlc3MoZGF0YSkge1xuXHRcdFx0XHRcdHZhciBfdG90YWxHdWVzdHMgPSAwO1xuXG5cdFx0XHRcdFx0Zy5ndWVzdHMgPSBkYXRhO1xuXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBnLmd1ZXN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0X3RvdGFsR3Vlc3RzKz1nLmd1ZXN0c1tpXS5ndWVzdHM7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Zy50b3RhbEd1ZXN0cyA9IF90b3RhbEd1ZXN0cztcblx0XHRcdFx0XHRnLmd1ZXN0c1JlYWR5ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJzdnBEYXRhLmdldEV2ZW50R3Vlc3RzKG5ld1ZhbCkudGhlbihfZ2V0R3Vlc3RzU3VjY2Vzcyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBDbG9zZSB0aGlzIG1vZGFsIGRpcmVjdGl2ZVxuXHRcdFx0ICovXG5cdFx0XHRnLmNsb3NlTW9kYWwgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Zy5zaG93TW9kYWwgPSBmYWxzZTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdFx0c2NvcGU6IHtcblx0XHRcdFx0ZXZlbnRJZDogJz0nLFxuXHRcdFx0XHRldmVudE5hbWU6ICc9Jyxcblx0XHRcdFx0c2hvd01vZGFsOiAnPSdcblx0XHRcdH0sXG5cdFx0XHR0ZW1wbGF0ZVVybDogJy9uZy1hcHAvYWRtaW4vdmlld0V2ZW50R3Vlc3RzLnRwbC5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXI6IHZpZXdFdmVudEd1ZXN0c0N0cmwsXG5cdFx0XHRjb250cm9sbGVyQXM6ICdnJyxcblx0XHRcdGJpbmRUb0NvbnRyb2xsZXI6IHRydWVcblx0XHR9XG5cdH1cbn0pKCk7IiwiLy8gRXZlbnQgZnVuY3Rpb25zXG4oZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5mYWN0b3J5KCdFdmVudCcsIEV2ZW50KTtcblxuXHRFdmVudC4kaW5qZWN0ID0gWydVdGlscycsICdwcmV0dHlEYXRlRmlsdGVyJ107XG5cblx0ZnVuY3Rpb24gRXZlbnQoVXRpbHMsIHByZXR0eURhdGVGaWx0ZXIpIHtcblx0XHQvKipcblx0XHQgKiBHZW5lcmF0ZSBhIHByZXR0eSBkYXRlIGZvciBVSSBkaXNwbGF5IGZyb20gdGhlIHN0YXJ0IGFuZCBlbmQgZGF0ZXRpbWVzXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gZXZlbnRPYmoge29iamVjdH0gdGhlIGV2ZW50IG9iamVjdFxuXHRcdCAqIEByZXR1cm5zIHtzdHJpbmd9IHByZXR0eSBzdGFydCBhbmQgZW5kIGRhdGUgLyB0aW1lIHN0cmluZ1xuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIGdldFByZXR0eURhdGV0aW1lKGV2ZW50T2JqKSB7XG5cdFx0XHR2YXIgc3RhcnREYXRlID0gZXZlbnRPYmouc3RhcnREYXRlLFxuXHRcdFx0XHRzdGFydFRpbWUgPSBldmVudE9iai5zdGFydFRpbWUsXG5cdFx0XHRcdGVuZERhdGUgPSBldmVudE9iai5lbmREYXRlLFxuXHRcdFx0XHRlbmRUaW1lID0gZXZlbnRPYmouZW5kVGltZSxcblx0XHRcdFx0cHJldHR5U3RhcnREYXRlID0gcHJldHR5RGF0ZUZpbHRlcihzdGFydERhdGUpLFxuXHRcdFx0XHRwcmV0dHlFbmREYXRlID0gcHJldHR5RGF0ZUZpbHRlcihlbmREYXRlKSxcblx0XHRcdFx0cHJldHR5RGF0ZXRpbWU7XG5cblx0XHRcdGlmIChzdGFydERhdGUgPT09IGVuZERhdGUpIHtcblx0XHRcdFx0Ly8gZXZlbnQgc3RhcnRzIGFuZCBlbmRzIG9uIHRoZSBzYW1lIGRheVxuXHRcdFx0XHQvLyBBcHIgMjkgMjAxNSwgMTI6MDAgUE0gLSA1OjAwIFBNXG5cdFx0XHRcdHByZXR0eURhdGV0aW1lID0gcHJldHR5U3RhcnREYXRlICsgJywgJyArIHN0YXJ0VGltZSArICcgLSAnICsgZW5kVGltZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIGV2ZW50IHN0YXJ0cyBhbmQgZW5kcyBvbiBkaWZmZXJlbnQgZGF5c1xuXHRcdFx0XHQvLyBEZWMgMzEgMjAxNCwgODowMCBQTSAtIEphbiAxIDIwMTUsIDExOjAwIEFNXG5cdFx0XHRcdHByZXR0eURhdGV0aW1lID0gcHJldHR5U3RhcnREYXRlICsgJywgJyArIHN0YXJ0VGltZSArICcgLSAnICsgcHJldHR5RW5kRGF0ZSArICcsICcgKyBlbmRUaW1lO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcHJldHR5RGF0ZXRpbWU7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogR2V0IEphdmFTY3JpcHQgRGF0ZSBmcm9tIGV2ZW50IGRhdGUgYW5kIHRpbWUgc3RyaW5nc1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIGRhdGVTdHIge3N0cmluZ30gbW0vZGQveXl5XG5cdFx0ICogQHBhcmFtIHRpbWVTdHIge3N0cmluZ30gaGg6bW0gQU0vUE1cblx0XHQgKiBAcmV0dXJucyB7RGF0ZX1cblx0XHQgKi9cblx0XHRmdW5jdGlvbiBnZXRKU0RhdGV0aW1lKGRhdGVTdHIsIHRpbWVTdHIpIHtcblx0XHRcdHZhciBkID0gbmV3IERhdGUoZGF0ZVN0ciksXG5cdFx0XHRcdHRpbWVBcnIgPSB0aW1lU3RyLnNwbGl0KCcgJyksXG5cdFx0XHRcdHRpbWUgPSB0aW1lQXJyWzBdLnNwbGl0KCc6JyksXG5cdFx0XHRcdGhvdXJzID0gdGltZVswXSAqIDEsXG5cdFx0XHRcdG1pbnV0ZXMgPSB0aW1lWzFdLFxuXHRcdFx0XHRhbXBtID0gdGltZUFyclsxXSxcblx0XHRcdFx0ZnVsbGRhdGU7XG5cblx0XHRcdGlmIChhbXBtID09ICdQTScpIHtcblx0XHRcdFx0aWYgKGhvdXJzICE9PSAxMikge1xuXHRcdFx0XHRcdGhvdXJzID0gaG91cnMgKyAxMjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRmdWxsZGF0ZSA9IG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgZC5nZXRNb250aCgpLCBkLmdldERhdGUoKSwgaG91cnMsIG1pbnV0ZXMpO1xuXG5cdFx0XHRyZXR1cm4gZnVsbGRhdGU7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogRGV0ZXJtaW5lIGlmIGV2ZW50IGlzIGV4cGlyZWRcblx0XHQgKiAoZW5kIGRhdGUvdGltZSBoYXMgcGFzc2VkIGN1cnJlbnQgZGF0ZS90aW1lKVxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIGV2dCB7b2JqZWN0fSBldmVudCBvYmplY3Rcblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0XHQgKi9cblx0XHRmdW5jdGlvbiBleHBpcmVkKGV2dCkge1xuXHRcdFx0dmFyIGpzU3RhcnREYXRlID0gZ2V0SlNEYXRldGltZShldnQuZW5kRGF0ZSwgZXZ0LmVuZFRpbWUpLFxuXHRcdFx0XHRub3cgPSBuZXcgRGF0ZSgpO1xuXG5cdFx0XHRyZXR1cm4ganNTdGFydERhdGUgPCBub3c7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGdldFByZXR0eURhdGV0aW1lOiBnZXRQcmV0dHlEYXRldGltZSxcblx0XHRcdGdldEpTRGF0ZXRpbWU6IGdldEpTRGF0ZXRpbWUsXG5cdFx0XHRleHBpcmVkOiBleHBpcmVkXG5cdFx0fTtcblx0fVxufSkoKTsiLCIvLyBtZWRpYSBxdWVyeSBjb25zdGFudHNcbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LmNvbnN0YW50KCdNUScsIHtcblx0XHRcdFNNQUxMOiAnKG1heC13aWR0aDogNzY3cHgpJyxcblx0XHRcdExBUkdFOiAnKG1pbi13aWR0aDogNzY4cHgpJ1xuXHRcdH0pO1xufSkoKTsiLCIvLyBsb2dpbi9PYXV0aCBjb25zdGFudHNcbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LmNvbnN0YW50KCdPQVVUSCcsIHtcblx0XHRcdExPR0lOUzogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YWNjb3VudDogJ2dvb2dsZScsXG5cdFx0XHRcdFx0bmFtZTogJ0dvb2dsZScsXG5cdFx0XHRcdFx0dXJsOiAnaHR0cDovL2FjY291bnRzLmdvb2dsZS5jb20nXG5cdFx0XHRcdH0sIHtcblx0XHRcdFx0XHRhY2NvdW50OiAndHdpdHRlcicsXG5cdFx0XHRcdFx0bmFtZTogJ1R3aXR0ZXInLFxuXHRcdFx0XHRcdHVybDogJ2h0dHA6Ly90d2l0dGVyLmNvbSdcblx0XHRcdFx0fSwge1xuXHRcdFx0XHRcdGFjY291bnQ6ICdmYWNlYm9vaycsXG5cdFx0XHRcdFx0bmFtZTogJ0ZhY2Vib29rJyxcblx0XHRcdFx0XHR1cmw6ICdodHRwOi8vZmFjZWJvb2suY29tJ1xuXHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0YWNjb3VudDogJ2dpdGh1YicsXG5cdFx0XHRcdFx0bmFtZTogJ0dpdEh1YicsXG5cdFx0XHRcdFx0dXJsOiAnaHR0cDovL2dpdGh1Yi5jb20nXG5cdFx0XHRcdH1cblx0XHRcdF1cblx0XHR9KTtcbn0pKCk7IiwiLy8gVXNlciBmdW5jdGlvbnNcbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LmZhY3RvcnkoJ1VzZXInLCBVc2VyKTtcblxuXHRVc2VyLiRpbmplY3QgPSBbJ09BVVRIJ107XG5cblx0ZnVuY3Rpb24gVXNlcihPQVVUSCkge1xuXG5cdFx0LyoqXG5cdFx0ICogQ3JlYXRlIGFycmF5IG9mIGEgdXNlcidzIGN1cnJlbnRseS1saW5rZWQgYWNjb3VudCBsb2dpbnNcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB1c2VyT2JqXG5cdFx0ICogQHJldHVybnMge0FycmF5fVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIGdldExpbmtlZEFjY291bnRzKHVzZXJPYmopIHtcblx0XHRcdHZhciBsaW5rZWRBY2NvdW50cyA9IFtdO1xuXG5cdFx0XHRhbmd1bGFyLmZvckVhY2goT0FVVEguTE9HSU5TLCBmdW5jdGlvbihhY3RPYmopIHtcblx0XHRcdFx0dmFyIGFjdCA9IGFjdE9iai5hY2NvdW50O1xuXG5cdFx0XHRcdGlmICh1c2VyT2JqW2FjdF0pIHtcblx0XHRcdFx0XHRsaW5rZWRBY2NvdW50cy5wdXNoKGFjdCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gbGlua2VkQWNjb3VudHM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGdldExpbmtlZEFjY291bnRzOiBnZXRMaW5rZWRBY2NvdW50c1xuXHRcdH07XG5cdH1cbn0pKCk7IiwiLy8gVXRpbGl0eSBmdW5jdGlvbnNcbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LmZhY3RvcnkoJ1V0aWxzJywgVXRpbHMpO1xuXG5cdGZ1bmN0aW9uIFV0aWxzKCkge1xuXHRcdC8qKlxuXHRcdCAqIEdldCBvcmRpbmFsIHZhbHVlXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gbiB7bnVtYmVyfSBpZiBhIHN0cmluZyBpcyBwcm92aWRlZCwgJSB3aWxsIGF0dGVtcHQgdG8gY29udmVydCB0byBudW1iZXJcblx0XHQgKiBAcmV0dXJucyB7c3RyaW5nfSB0aCwgc3QsIG5kLCByZFxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIGdldE9yZGluYWwobikge1xuXHRcdFx0dmFyIG9yZEFyciA9IFsndGgnLCAnc3QnLCAnbmQnLCAncmQnXSxcblx0XHRcdFx0bW9kdWx1cyA9IG4gJSAxMDA7XG5cblx0XHRcdHJldHVybiBvcmRBcnJbKG1vZHVsdXMgLSAyMCkgJSAxMF0gfHwgb3JkQXJyW21vZHVsdXNdIHx8IG9yZEFyclswXTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Z2V0T3JkaW5hbDogZ2V0T3JkaW5hbFxuXHRcdH07XG5cdH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuY29uZmlnKGF1dGhDb25maWcpXG5cdFx0LnJ1bihhdXRoUnVuKTtcblxuXHRhdXRoQ29uZmlnLiRpbmplY3QgPSBbJyRhdXRoUHJvdmlkZXInXTtcblxuXHRmdW5jdGlvbiBhdXRoQ29uZmlnKCRhdXRoUHJvdmlkZXIpIHtcblx0XHQkYXV0aFByb3ZpZGVyLmxvZ2luVXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MS9hdXRoL2xvZ2luJztcblxuXHRcdCRhdXRoUHJvdmlkZXIuZmFjZWJvb2soe1xuXHRcdFx0Y2xpZW50SWQ6ICc0NzE4Mzc1OTk2MzAzNzEnXG5cdFx0fSk7XG5cblx0XHQkYXV0aFByb3ZpZGVyLmdvb2dsZSh7XG5cdFx0XHRjbGllbnRJZDogJzEwMzU0Nzg4MTQwNDctNDFuOHYydW1nc3Vwa252bWo3cTBlNm4xZ3I0bmF1YXYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20nXG5cdFx0fSk7XG5cblx0XHQkYXV0aFByb3ZpZGVyLnR3aXR0ZXIoe1xuXHRcdFx0dXJsOiAnL2F1dGgvdHdpdHRlcidcblx0XHR9KTtcblxuXHRcdCRhdXRoUHJvdmlkZXIuZ2l0aHViKHtcblx0XHRcdGNsaWVudElkOiAnYjMwM2ZmNGIyMTZjMDU3MWY2Y2UnXG5cdFx0fSk7XG5cdH1cblxuXHRhdXRoUnVuLiRpbmplY3QgPSBbJyRyb290U2NvcGUnLCAnJGxvY2F0aW9uJywgJyRhdXRoJ107XG5cblx0ZnVuY3Rpb24gYXV0aFJ1bigkcm9vdFNjb3BlLCAkbG9jYXRpb24sICRhdXRoKSB7XG5cdFx0JHJvb3RTY29wZS4kb24oJyRyb3V0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIG5leHQsIGN1cnJlbnQpIHtcblx0XHRcdGlmIChuZXh0ICYmIG5leHQuJCRyb3V0ZSAmJiBuZXh0LiQkcm91dGUuc2VjdXJlICYmICEkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuXHRcdFx0XHQkcm9vdFNjb3BlLmF1dGhQYXRoID0gJGxvY2F0aW9uLnBhdGgoKTtcblxuXHRcdFx0XHQkcm9vdFNjb3BlLiRldmFsQXN5bmMoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0Ly8gc2VuZCB1c2VyIHRvIGxvZ2luXG5cdFx0XHRcdFx0JGxvY2F0aW9uLnBhdGgoJy9sb2dpbicpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG59KSgpOyIsIi8vIHJvdXRlc1xuKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuY29uZmlnKGFwcENvbmZpZyk7XG5cblx0YXBwQ29uZmlnLiRpbmplY3QgPSBbJyRyb3V0ZVByb3ZpZGVyJywgJyRsb2NhdGlvblByb3ZpZGVyJ107XG5cblx0ZnVuY3Rpb24gYXBwQ29uZmlnKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuXHRcdCRyb3V0ZVByb3ZpZGVyXG5cdFx0XHQud2hlbignLycsIHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICduZy1hcHAvZXZlbnRzL0V2ZW50cy52aWV3Lmh0bWwnLFxuXHRcdFx0XHRzZWN1cmU6IHRydWVcblx0XHRcdH0pXG5cdFx0XHQud2hlbignL2xvZ2luJywge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJ25nLWFwcC9sb2dpbi9Mb2dpbi52aWV3Lmh0bWwnXG5cdFx0XHR9KVxuXHRcdFx0LndoZW4oJy9ldmVudC86ZXZlbnRJZCcsIHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICduZy1hcHAvZXZlbnQtZGV0YWlsL0V2ZW50RGV0YWlsLnZpZXcuaHRtbCcsXG5cdFx0XHRcdHNlY3VyZTogdHJ1ZVxuXHRcdFx0fSlcblx0XHRcdC53aGVuKCcvZXZlbnQvOmV2ZW50SWQvZWRpdCcsIHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICduZy1hcHAvYWRtaW4vRWRpdEV2ZW50LnZpZXcuaHRtbCcsXG5cdFx0XHRcdHNlY3VyZTogdHJ1ZVxuXHRcdFx0fSlcblx0XHRcdC53aGVuKCcvYWNjb3VudCcsIHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICduZy1hcHAvYWNjb3VudC9BY2NvdW50LnZpZXcuaHRtbCcsXG5cdFx0XHRcdHNlY3VyZTogdHJ1ZSxcblx0XHRcdFx0cmVsb2FkT25TZWFyY2g6IGZhbHNlXG5cdFx0XHR9KVxuXHRcdFx0LndoZW4oJy9hZG1pbicsIHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICduZy1hcHAvYWRtaW4vQWRtaW4udmlldy5odG1sJyxcblx0XHRcdFx0c2VjdXJlOiB0cnVlLFxuXHRcdFx0XHRyZWxvYWRPblNlYXJjaDogZmFsc2Vcblx0XHRcdH0pXG5cdFx0XHQub3RoZXJ3aXNlKHtcblx0XHRcdFx0cmVkaXJlY3RUbzogJy8nXG5cdFx0XHR9KTtcblxuXHRcdCRsb2NhdGlvblByb3ZpZGVyXG5cdFx0XHQuaHRtbDVNb2RlKHtcblx0XHRcdFx0ZW5hYmxlZDogdHJ1ZVxuXHRcdFx0fSlcblx0XHRcdC5oYXNoUHJlZml4KCchJyk7XG5cdH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LmRpcmVjdGl2ZSgnZGV0ZWN0QWRibG9jaycsIGRldGVjdEFkYmxvY2spO1xuXG5cdGRldGVjdEFkYmxvY2suJGluamVjdCA9IFsnJHRpbWVvdXQnLCAnJGxvY2F0aW9uJ107XG5cblx0ZnVuY3Rpb24gZGV0ZWN0QWRibG9jaygkdGltZW91dCwgJGxvY2F0aW9uKSB7XG5cblx0XHRkZXRlY3RBZGJsb2NrTGluay4kaW5qZWN0ID0gWyckc2NvcGUnLCAnJGVsZW0nLCAnJGF0dHJzJ107XG5cblx0XHRmdW5jdGlvbiBkZXRlY3RBZGJsb2NrTGluaygkc2NvcGUsICRlbGVtLCAkYXR0cnMpIHtcblx0XHRcdC8vIGRhdGEgb2JqZWN0XG5cdFx0XHQkc2NvcGUuYWIgPSB7fTtcblxuXHRcdFx0Ly8gaG9zdG5hbWUgZm9yIG1lc3NhZ2luZ1xuXHRcdFx0JHNjb3BlLmFiLmhvc3QgPSAkbG9jYXRpb24uaG9zdCgpO1xuXG5cdFx0XHQvKipcblx0XHRcdCAqIENoZWNrIGlmIGFkcyBhcmUgYmxvY2tlZCAtIGNhbGxlZCBpbiAkdGltZW91dCB0byBsZXQgQWRCbG9ja2VycyBydW5cblx0XHRcdCAqXG5cdFx0XHQgKiBAcHJpdmF0ZVxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBfYXJlQWRzQmxvY2tlZCgpIHtcblx0XHRcdFx0dmFyIF9hID0gJGVsZW0uZmluZCgnLmFkLXRlc3QnKTtcblxuXHRcdFx0XHQkc2NvcGUuYWIuYmxvY2tlZCA9IF9hLmhlaWdodCgpIDw9IDAgfHwgISRlbGVtLmZpbmQoJy5hZC10ZXN0OnZpc2libGUnKS5sZW5ndGg7XG5cdFx0XHR9XG5cblx0XHRcdCR0aW1lb3V0KF9hcmVBZHNCbG9ja2VkLCAyMDApO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRcdGxpbms6IGRldGVjdEFkYmxvY2tMaW5rLFxuXHRcdFx0dGVtcGxhdGU6ICAgJzxkaXYgY2xhc3M9XCJhZC10ZXN0IGZhLWZhY2Vib29rIGZhLXR3aXR0ZXJcIiBzdHlsZT1cImhlaWdodDoxcHg7XCI+PC9kaXY+JyArXG5cdFx0XHRcdFx0XHQnPGRpdiBuZy1pZj1cImFiLmJsb2NrZWRcIiBjbGFzcz1cImFiLW1lc3NhZ2UgYWxlcnQgYWxlcnQtZGFuZ2VyXCI+JyArXG5cdFx0XHRcdFx0XHRcdCc8aSBjbGFzcz1cImZhIGZhLWJhblwiPjwvaT4gPHN0cm9uZz5BZEJsb2NrPC9zdHJvbmc+IGlzIHByb2hpYml0aW5nIGltcG9ydGFudCBmdW5jdGlvbmFsaXR5ISBQbGVhc2UgZGlzYWJsZSBhZCBibG9ja2luZyBvbiA8c3Ryb25nPnt7YWIuaG9zdH19PC9zdHJvbmc+LiBUaGlzIHNpdGUgaXMgYWQtZnJlZS4nICtcblx0XHRcdFx0XHRcdCc8L2Rpdj4nXG5cdFx0fVxuXHR9XG5cbn0pKCk7IiwiLy8gVXNlciBBUEkgJGh0dHAgY2FsbHNcbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LnNlcnZpY2UoJ2V2ZW50RGF0YScsIGV2ZW50RGF0YSk7XG5cblx0LyoqXG5cdCAqIEdFVCBwcm9taXNlIHJlc3BvbnNlIGZ1bmN0aW9uXG5cdCAqIENoZWNrcyB0eXBlb2YgZGF0YSByZXR1cm5lZCBhbmQgc3VjY2VlZHMgaWYgSlMgb2JqZWN0LCB0aHJvd3MgZXJyb3IgaWYgbm90XG5cdCAqXG5cdCAqIEBwYXJhbSByZXNwb25zZSB7Kn0gZGF0YSBmcm9tICRodHRwXG5cdCAqIEByZXR1cm5zIHsqfSBvYmplY3QsIGFycmF5XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBfZ2V0UmVzKHJlc3BvbnNlKSB7XG5cdFx0aWYgKHR5cGVvZiByZXNwb25zZS5kYXRhID09PSAnb2JqZWN0Jykge1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcigncmV0cmlldmVkIGRhdGEgaXMgbm90IHR5cGVvZiBvYmplY3QuJyk7XG5cdFx0fVxuXHR9XG5cblx0ZXZlbnREYXRhLiRpbmplY3QgPSBbJyRodHRwJ107XG5cblx0ZnVuY3Rpb24gZXZlbnREYXRhKCRodHRwKSB7XG5cdFx0LyoqXG5cdFx0ICogR2V0IGV2ZW50IGJ5IElEXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gaWQge3N0cmluZ30gZXZlbnQgTW9uZ29EQiBfaWRcblx0XHQgKiBAcmV0dXJucyB7cHJvbWlzZX1cblx0XHQgKi9cblx0XHR0aGlzLmdldEV2ZW50ID0gZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogJy9hcGkvZXZlbnQvJyArIGlkXG5cdFx0XHR9KS50aGVuKF9nZXRSZXMpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBHZXQgYWxsIGV2ZW50c1xuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge3Byb21pc2V9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRBbGxFdmVudHMgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiAkaHR0cFxuXHRcdFx0XHQuZ2V0KCcvYXBpL2V2ZW50cycpXG5cdFx0XHRcdC50aGVuKF9nZXRSZXMpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBDcmVhdGUgYSBuZXcgZXZlbnRcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSBldmVudERhdGEge29iamVjdH0gbmV3IGV2ZW50IGRhdGFcblx0XHQgKiBAcmV0dXJucyB7cHJvbWlzZX1cblx0XHQgKi9cblx0XHR0aGlzLmNyZWF0ZUV2ZW50ID0gZnVuY3Rpb24oZXZlbnREYXRhKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHBcblx0XHRcdFx0LnBvc3QoJy9hcGkvZXZlbnQvbmV3JywgZXZlbnREYXRhKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVXBkYXRlIGFuIGV2ZW50XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gZXZlbnREYXRhIHtvYmplY3R9IHVwZGF0ZWQgZXZlbnQgZGF0YVxuXHRcdCAqIEBwYXJhbSBpZCB7c3RyaW5nfSBldmVudCBNb25nb0RCIF9pZFxuXHRcdCAqIEByZXR1cm5zIHtwcm9taXNlfVxuXHRcdCAqL1xuXHRcdHRoaXMudXBkYXRlRXZlbnQgPSBmdW5jdGlvbihpZCwgZXZlbnREYXRhKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHBcblx0XHRcdFx0LnB1dCgnL2FwaS9ldmVudC8nICsgaWQsIGV2ZW50RGF0YSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIERlbGV0ZSBhbiBldmVudFxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIGlkIHtzdHJpbmd9IGV2ZW50IE1vbmdvREIgX2lkXG5cdFx0ICogQHJldHVybnMge3Byb21pc2V9XG5cdFx0ICovXG5cdFx0dGhpcy5kZWxldGVFdmVudCA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHBcblx0XHRcdFx0LmRlbGV0ZSgnL2FwaS9ldmVudC8nICsgaWQpO1xuXHRcdH1cblx0fVxufSkoKTsiLCIvLyBGZXRjaCBsb2NhbCBKU09OIGRhdGFcbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LnNlcnZpY2UoJ2xvY2FsRGF0YScsIGxvY2FsRGF0YSk7XG5cblx0LyoqXG5cdCAqIEdFVCBwcm9taXNlIHJlc3BvbnNlIGZ1bmN0aW9uXG5cdCAqIENoZWNrcyB0eXBlb2YgZGF0YSByZXR1cm5lZCBhbmQgc3VjY2VlZHMgaWYgSlMgb2JqZWN0LCB0aHJvd3MgZXJyb3IgaWYgbm90XG5cdCAqXG5cdCAqIEBwYXJhbSByZXNwb25zZSB7Kn0gZGF0YSBmcm9tICRodHRwXG5cdCAqIEByZXR1cm5zIHsqfSBvYmplY3QsIGFycmF5XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBfZ2V0UmVzKHJlc3BvbnNlKSB7XG5cdFx0aWYgKHR5cGVvZiByZXNwb25zZS5kYXRhID09PSAnb2JqZWN0Jykge1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcigncmV0cmlldmVkIGRhdGEgaXMgbm90IHR5cGVvZiBvYmplY3QuJyk7XG5cdFx0fVxuXHR9XG5cblx0bG9jYWxEYXRhLiRpbmplY3QgPSBbJyRodHRwJ107XG5cblx0ZnVuY3Rpb24gbG9jYWxEYXRhKCRodHRwKSB7XG5cdFx0LyoqXG5cdFx0ICogR2V0IGxvY2FsIEpTT04gZGF0YSBmaWxlIGFuZCByZXR1cm4gcmVzdWx0c1xuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge3Byb21pc2V9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRKU09OID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHBcblx0XHRcdFx0LmdldCgnL25nLWFwcC9kYXRhL2RhdGEuanNvbicpXG5cdFx0XHRcdC50aGVuKF9nZXRSZXMpO1xuXHRcdH1cblx0fVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgYW5ndWxhck1lZGlhQ2hlY2sgPSBhbmd1bGFyLm1vZHVsZSgnbWVkaWFDaGVjaycsIFtdKTtcblxuXHRhbmd1bGFyTWVkaWFDaGVjay5zZXJ2aWNlKCdtZWRpYUNoZWNrJywgWyckd2luZG93JywgJyR0aW1lb3V0JywgZnVuY3Rpb24gKCR3aW5kb3csICR0aW1lb3V0KSB7XG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0XHRcdHZhciAkc2NvcGUgPSBvcHRpb25zWydzY29wZSddLFxuXHRcdFx0XHRxdWVyeSA9IG9wdGlvbnNbJ21xJ10sXG5cdFx0XHRcdGRlYm91bmNlID0gb3B0aW9uc1snZGVib3VuY2UnXSxcblx0XHRcdFx0JHdpbiA9IGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KSxcblx0XHRcdFx0YnJlYWtwb2ludHMsXG5cdFx0XHRcdGNyZWF0ZUxpc3RlbmVyID0gdm9pZCAwLFxuXHRcdFx0XHRoYXNNYXRjaE1lZGlhID0gJHdpbmRvdy5tYXRjaE1lZGlhICE9PSB1bmRlZmluZWQgJiYgISEkd2luZG93Lm1hdGNoTWVkaWEoJyEnKS5hZGRMaXN0ZW5lcixcblx0XHRcdFx0bXFMaXN0TGlzdGVuZXIsXG5cdFx0XHRcdG1tTGlzdGVuZXIsXG5cdFx0XHRcdGRlYm91bmNlUmVzaXplLFxuXHRcdFx0XHRtcSA9IHZvaWQgMCxcblx0XHRcdFx0bXFDaGFuZ2UgPSB2b2lkIDAsXG5cdFx0XHRcdGRlYm91bmNlU3BlZWQgPSAhIWRlYm91bmNlID8gZGVib3VuY2UgOiAyNTA7XG5cblx0XHRcdGlmIChoYXNNYXRjaE1lZGlhKSB7XG5cdFx0XHRcdG1xQ2hhbmdlID0gZnVuY3Rpb24gKG1xKSB7XG5cdFx0XHRcdFx0aWYgKG1xLm1hdGNoZXMgJiYgdHlwZW9mIG9wdGlvbnMuZW50ZXIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdG9wdGlvbnMuZW50ZXIobXEpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMuZXhpdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHRvcHRpb25zLmV4aXQobXEpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMuY2hhbmdlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRvcHRpb25zLmNoYW5nZShtcSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNyZWF0ZUxpc3RlbmVyID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdG1xID0gJHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5KTtcblx0XHRcdFx0XHRtcUxpc3RMaXN0ZW5lciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdHJldHVybiBtcUNoYW5nZShtcSlcblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0bXEuYWRkTGlzdGVuZXIobXFMaXN0TGlzdGVuZXIpO1xuXG5cdFx0XHRcdFx0Ly8gYmluZCB0byB0aGUgb3JpZW50YXRpb25jaGFuZ2UgZXZlbnQgYW5kIGZpcmUgbXFDaGFuZ2Vcblx0XHRcdFx0XHQkd2luLmJpbmQoJ29yaWVudGF0aW9uY2hhbmdlJywgbXFMaXN0TGlzdGVuZXIpO1xuXG5cdFx0XHRcdFx0Ly8gY2xlYW51cCBsaXN0ZW5lcnMgd2hlbiAkc2NvcGUgaXMgJGRlc3Ryb3llZFxuXHRcdFx0XHRcdCRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0bXEucmVtb3ZlTGlzdGVuZXIobXFMaXN0TGlzdGVuZXIpO1xuXHRcdFx0XHRcdFx0JHdpbi51bmJpbmQoJ29yaWVudGF0aW9uY2hhbmdlJywgbXFMaXN0TGlzdGVuZXIpO1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0cmV0dXJuIG1xQ2hhbmdlKG1xKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRyZXR1cm4gY3JlYXRlTGlzdGVuZXIoKTtcblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YnJlYWtwb2ludHMgPSB7fTtcblxuXHRcdFx0XHRtcUNoYW5nZSA9IGZ1bmN0aW9uIChtcSkge1xuXHRcdFx0XHRcdGlmIChtcS5tYXRjaGVzKSB7XG5cdFx0XHRcdFx0XHRpZiAoISFicmVha3BvaW50c1txdWVyeV0gPT09IGZhbHNlICYmICh0eXBlb2Ygb3B0aW9ucy5lbnRlciA9PT0gJ2Z1bmN0aW9uJykpIHtcblx0XHRcdFx0XHRcdFx0b3B0aW9ucy5lbnRlcihtcSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmIChicmVha3BvaW50c1txdWVyeV0gPT09IHRydWUgfHwgYnJlYWtwb2ludHNbcXVlcnldID09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLmV4aXQgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdFx0XHRvcHRpb25zLmV4aXQobXEpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKChtcS5tYXRjaGVzICYmICghYnJlYWtwb2ludHNbcXVlcnldKSB8fCAoIW1xLm1hdGNoZXMgJiYgKGJyZWFrcG9pbnRzW3F1ZXJ5XSA9PT0gdHJ1ZSB8fCBicmVha3BvaW50c1txdWVyeV0gPT0gbnVsbCkpKSkge1xuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLmNoYW5nZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHRvcHRpb25zLmNoYW5nZShtcSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIGJyZWFrcG9pbnRzW3F1ZXJ5XSA9IG1xLm1hdGNoZXM7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGNvbnZlcnRFbVRvUHggPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0XHRcdFx0XHR2YXIgZW1FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cblx0XHRcdFx0XHRlbUVsZW1lbnQuc3R5bGUud2lkdGggPSAnMWVtJztcblx0XHRcdFx0XHRlbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZW1FbGVtZW50KTtcblx0XHRcdFx0XHRweCA9IHZhbHVlICogZW1FbGVtZW50Lm9mZnNldFdpZHRoO1xuXHRcdFx0XHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZW1FbGVtZW50KTtcblxuXHRcdFx0XHRcdHJldHVybiBweDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgZ2V0UFhWYWx1ZSA9IGZ1bmN0aW9uICh3aWR0aCwgdW5pdCkge1xuXHRcdFx0XHRcdHZhciB2YWx1ZTtcblx0XHRcdFx0XHR2YWx1ZSA9IHZvaWQgMDtcblx0XHRcdFx0XHRzd2l0Y2ggKHVuaXQpIHtcblx0XHRcdFx0XHRcdGNhc2UgJ2VtJzpcblx0XHRcdFx0XHRcdFx0dmFsdWUgPSBjb252ZXJ0RW1Ub1B4KHdpZHRoKTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHR2YWx1ZSA9IHdpZHRoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0YnJlYWtwb2ludHNbcXVlcnldID0gbnVsbDtcblxuXHRcdFx0XHRtbUxpc3RlbmVyID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHZhciBwYXJ0cyA9IHF1ZXJ5Lm1hdGNoKC9cXCgoLiopLS4qOlxccyooW1xcZFxcLl0qKSguKilcXCkvKSxcblx0XHRcdFx0XHRcdGNvbnN0cmFpbnQgPSBwYXJ0c1sxXSxcblx0XHRcdFx0XHRcdHZhbHVlID0gZ2V0UFhWYWx1ZShwYXJzZUludChwYXJ0c1syXSwgMTApLCBwYXJ0c1szXSksXG5cdFx0XHRcdFx0XHRmYWtlTWF0Y2hNZWRpYSA9IHt9LFxuXHRcdFx0XHRcdFx0d2luZG93V2lkdGggPSAkd2luZG93LmlubmVyV2lkdGggfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xuXG5cdFx0XHRcdFx0ZmFrZU1hdGNoTWVkaWEubWF0Y2hlcyA9IGNvbnN0cmFpbnQgPT09ICdtYXgnICYmIHZhbHVlID4gd2luZG93V2lkdGggfHwgY29uc3RyYWludCA9PT0gJ21pbicgJiYgdmFsdWUgPCB3aW5kb3dXaWR0aDtcblxuXHRcdFx0XHRcdHJldHVybiBtcUNoYW5nZShmYWtlTWF0Y2hNZWRpYSk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGZha2VNYXRjaE1lZGlhUmVzaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGNsZWFyVGltZW91dChkZWJvdW5jZVJlc2l6ZSk7XG5cdFx0XHRcdFx0ZGVib3VuY2VSZXNpemUgPSAkdGltZW91dChtbUxpc3RlbmVyLCBkZWJvdW5jZVNwZWVkKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkd2luLmJpbmQoJ3Jlc2l6ZScsIGZha2VNYXRjaE1lZGlhUmVzaXplKTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkd2luLnVuYmluZCgncmVzaXplJywgZmFrZU1hdGNoTWVkaWFSZXNpemUpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gbW1MaXN0ZW5lcigpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1dKTtcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuZmlsdGVyKCdwcmV0dHlEYXRlJywgcHJldHR5RGF0ZSk7XG5cblx0ZnVuY3Rpb24gcHJldHR5RGF0ZSgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGRhdGVTdHIpIHtcblx0XHRcdHZhciBkID0gbmV3IERhdGUoZGF0ZVN0ciksXG5cdFx0XHRcdG1vbnRoc0FyciA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXSxcblx0XHRcdFx0bW9udGggPSBtb250aHNBcnJbZC5nZXRNb250aCgpXSxcblx0XHRcdFx0ZGF5ID0gZC5nZXREYXRlKCksXG5cdFx0XHRcdHllYXIgPSBkLmdldEZ1bGxZZWFyKCksXG5cdFx0XHRcdHByZXR0eURhdGU7XG5cblx0XHRcdHByZXR0eURhdGUgPSBtb250aCArICcgJyArIGRheSArICcgJyArIHllYXI7XG5cblx0XHRcdHJldHVybiBwcmV0dHlEYXRlO1xuXHRcdH07XG5cdH1cbn0pKCk7IiwiLy8gVXNlciBBUEkgJGh0dHAgY2FsbHNcbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LnNlcnZpY2UoJ3JzdnBEYXRhJywgcnN2cERhdGEpO1xuXG5cdC8qKlxuXHQgKiBHRVQgcHJvbWlzZSByZXNwb25zZSBmdW5jdGlvblxuXHQgKiBDaGVja3MgdHlwZW9mIGRhdGEgcmV0dXJuZWQgYW5kIHN1Y2NlZWRzIGlmIEpTIG9iamVjdCwgdGhyb3dzIGVycm9yIGlmIG5vdFxuXHQgKlxuXHQgKiBAcGFyYW0gcmVzcG9uc2Ugeyp9IGRhdGEgZnJvbSAkaHR0cFxuXHQgKiBAcmV0dXJucyB7Kn0gb2JqZWN0LCBhcnJheVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gX2dldFJlcyhyZXNwb25zZSkge1xuXHRcdGlmICh0eXBlb2YgcmVzcG9uc2UuZGF0YSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ3JldHJpZXZlZCBkYXRhIGlzIG5vdCB0eXBlb2Ygb2JqZWN0LicpO1xuXHRcdH1cblx0fVxuXG5cdHJzdnBEYXRhLiRpbmplY3QgPSBbJyRodHRwJ107XG5cblx0ZnVuY3Rpb24gcnN2cERhdGEoJGh0dHApIHtcblx0XHQvKipcblx0XHQgKiBHZXQgYWxsIFJTVlBlZCBndWVzdHMgZm9yIGEgc3BlY2lmaWMgZXZlbnQgYnkgZXZlbnQgSURcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSBldmVudElkIHtzdHJpbmd9IGV2ZW50IE1vbmdvREIgX2lkXG5cdFx0ICogQHJldHVybnMge3Byb21pc2V9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRFdmVudEd1ZXN0cyA9IGZ1bmN0aW9uKGV2ZW50SWQpIHtcblx0XHRcdHJldHVybiAkaHR0cFxuXHRcdFx0XHQuZ2V0KCcvYXBpL3JzdnBzL2V2ZW50LycgKyBldmVudElkKVxuXHRcdFx0XHQudGhlbihfZ2V0UmVzKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogQ3JlYXRlIGEgbmV3IFJTVlAgZm9yIGFuIGV2ZW50XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gZXZlbnRJZCB7c3RyaW5nfSBldmVudCBNb25nb0RCIF9pZFxuXHRcdCAqIEBwYXJhbSByc3ZwRGF0YSB7b2JqZWN0fSBuZXcgUlNWUCBkYXRhXG5cdFx0ICogQHJldHVybnMge3Byb21pc2V9XG5cdFx0ICovXG5cdFx0dGhpcy5jcmVhdGVSc3ZwID0gZnVuY3Rpb24oZXZlbnRJZCwgcnN2cERhdGEpIHtcblx0XHRcdHJldHVybiAkaHR0cFxuXHRcdFx0XHQucG9zdCgnL2FwaS9yc3ZwL2V2ZW50LycgKyBldmVudElkLCByc3ZwRGF0YSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZSBhbiBSU1ZQIGJ5IHNwZWNpZmljIFJTVlAgSURcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSByc3ZwSWQge3N0cmluZ30gUlNWUCBNb25nb0RCIF9pZFxuXHRcdCAqIEBwYXJhbSByc3ZwRGF0YSB7b2JqZWN0fSB1cGRhdGVkIFJTVlAgZGF0YVxuXHRcdCAqIEByZXR1cm5zIHtwcm9taXNlfVxuXHRcdCAqL1xuXHRcdHRoaXMudXBkYXRlUnN2cCA9IGZ1bmN0aW9uKHJzdnBJZCwgcnN2cERhdGEpIHtcblx0XHRcdHJldHVybiAkaHR0cFxuXHRcdFx0XHQucHV0KCcvYXBpL3JzdnAvJyArIHJzdnBJZCwgcnN2cERhdGEpO1xuXHRcdH07XG5cdH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuZmlsdGVyKCd0cnVzdEFzSFRNTCcsIHRydXN0QXNIVE1MKTtcblxuXHR0cnVzdEFzSFRNTC4kaW5qZWN0ID0gWyckc2NlJ107XG5cblx0ZnVuY3Rpb24gdHJ1c3RBc0hUTUwoJHNjZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAodGV4dCkge1xuXHRcdFx0cmV0dXJuICRzY2UudHJ1c3RBc0h0bWwodGV4dCk7XG5cdFx0fTtcblx0fVxufSkoKTsiLCIvLyBVc2VyIGRpcmVjdGl2ZVxuKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuZGlyZWN0aXZlKCd1c2VyJywgdXNlcik7XG5cblx0dXNlci4kaW5qZWN0ID0gWyd1c2VyRGF0YScsICckYXV0aCddO1xuXG5cdGZ1bmN0aW9uIHVzZXIodXNlckRhdGEsICRhdXRoKSB7XG5cblx0XHQvKipcblx0XHQgKiBVc2VyIGRpcmVjdGl2ZSBjb250cm9sbGVyXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gdXNlckN0cmwoKSB7XG5cdFx0XHQvLyBjb250cm9sbGVyQXMgVmlld01vZGVsXG5cdFx0XHR2YXIgdSA9IHRoaXM7XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQ2hlY2sgaWYgdGhlIGN1cnJlbnQgdXNlciBpcyBhdXRoZW50aWNhdGVkXG5cdFx0XHQgKlxuXHRcdFx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdFx0XHQgKi9cblx0XHRcdHUuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKTtcblx0XHRcdH07XG5cblx0XHRcdC8vIEFQSSByZXF1ZXN0IHRvIGdldCB0aGUgdXNlciwgcGFzc2luZyBzdWNjZXNzIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgc2V0cyB0aGUgdXNlcidzIGluZm9cblx0XHRcdHVzZXJEYXRhLmdldFVzZXIoKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0dS51c2VyID0gZGF0YTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRcdGNvbnRyb2xsZXI6IHVzZXJDdHJsLFxuXHRcdFx0Y29udHJvbGxlckFzOiAndScsXG5cdFx0XHR0ZW1wbGF0ZTogJzxkaXYgbmctaWY9XCJ1LmlzQXV0aGVudGljYXRlZCgpICYmICEhdS51c2VyXCIgY2xhc3M9XCJ1c2VyIGNsZWFyZml4XCI+PGltZyBuZy1pZj1cIiEhdS51c2VyLnBpY3R1cmVcIiBuZy1zcmM9XCJ7e3UudXNlci5waWN0dXJlfX1cIiBjbGFzcz1cInVzZXItcGljdHVyZVwiIC8+PHNwYW4gY2xhc3M9XCJ1c2VyLWRpc3BsYXlOYW1lXCI+e3t1LnVzZXIuZGlzcGxheU5hbWV9fTwvc3Bhbj48L2Rpdj4nXG5cdFx0fTtcblx0fVxufSkoKTsiLCIvLyBVc2VyIEFQSSAkaHR0cCBjYWxsc1xuKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuc2VydmljZSgndXNlckRhdGEnLCB1c2VyRGF0YSk7XG5cblx0LyoqXG5cdCAqIEdFVCBwcm9taXNlIHJlc3BvbnNlIGZ1bmN0aW9uXG5cdCAqIENoZWNrcyB0eXBlb2YgZGF0YSByZXR1cm5lZCBhbmQgc3VjY2VlZHMgaWYgSlMgb2JqZWN0LCB0aHJvd3MgZXJyb3IgaWYgbm90XG5cdCAqXG5cdCAqIEBwYXJhbSByZXNwb25zZSB7Kn0gZGF0YSBmcm9tICRodHRwXG5cdCAqIEByZXR1cm5zIHsqfSBvYmplY3QsIGFycmF5XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBfZ2V0UmVzKHJlc3BvbnNlKSB7XG5cdFx0aWYgKHR5cGVvZiByZXNwb25zZS5kYXRhID09PSAnb2JqZWN0Jykge1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcigncmV0cmlldmVkIGRhdGEgaXMgbm90IHR5cGVvZiBvYmplY3QuJyk7XG5cdFx0fVxuXHR9XG5cblx0dXNlckRhdGEuJGluamVjdCA9IFsnJGh0dHAnXTtcblxuXHRmdW5jdGlvbiB1c2VyRGF0YSgkaHR0cCkge1xuXHRcdC8qKlxuXHRcdCAqIEdldCBjdXJyZW50IHVzZXIncyBkYXRhXG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7cHJvbWlzZX1cblx0XHQgKi9cblx0XHR0aGlzLmdldFVzZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiAkaHR0cFxuXHRcdFx0XHQuZ2V0KCcvYXBpL21lJylcblx0XHRcdFx0LnRoZW4oX2dldFJlcyk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZSBjdXJyZW50IHVzZXIncyBwcm9maWxlIGRhdGFcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSBwcm9maWxlRGF0YSB7b2JqZWN0fSB1cGRhdGVkIHByb2ZpbGUgZGF0YVxuXHRcdCAqIEByZXR1cm5zIHtwcm9taXNlfVxuXHRcdCAqL1xuXHRcdHRoaXMudXBkYXRlVXNlciA9IGZ1bmN0aW9uKHByb2ZpbGVEYXRhKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHBcblx0XHRcdFx0LnB1dCgnL2FwaS9tZScsIHByb2ZpbGVEYXRhKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogR2V0IGFsbCB1c2VycyAoYWRtaW4gYXV0aG9yaXplZCBvbmx5KVxuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge3Byb21pc2V9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRBbGxVc2VycyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuICRodHRwXG5cdFx0XHRcdC5nZXQoJy9hcGkvdXNlcnMnKVxuXHRcdFx0XHQudGhlbihfZ2V0UmVzKTtcblx0XHR9O1xuXHR9XG59KSgpOyIsIi8vIEZvciBldmVudHMgYmFzZWQgb24gdmlld3BvcnQgc2l6ZSAtIHVwZGF0ZXMgYXMgdmlld3BvcnQgaXMgcmVzaXplZFxuKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuZGlyZWN0aXZlKCd2aWV3U3dpdGNoJywgdmlld1N3aXRjaCk7XG5cblx0dmlld1N3aXRjaC4kaW5qZWN0ID0gWydtZWRpYUNoZWNrJywgJ01RJywgJyR0aW1lb3V0J107XG5cblx0ZnVuY3Rpb24gdmlld1N3aXRjaChtZWRpYUNoZWNrLCBNUSwgJHRpbWVvdXQpIHtcblxuXHRcdHZpZXdTd2l0Y2hMaW5rLiRpbmplY3QgPSBbJyRzY29wZSddO1xuXG5cdFx0LyoqXG5cdFx0ICogdmlld1N3aXRjaCBkaXJlY3RpdmUgbGluayBmdW5jdGlvblxuXHRcdCAqXG5cdFx0ICogQHBhcmFtICRzY29wZVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIHZpZXdTd2l0Y2hMaW5rKCRzY29wZSkge1xuXHRcdFx0Ly8gZGF0YSBvYmplY3Rcblx0XHRcdCRzY29wZS52cyA9IHt9O1xuXG5cdFx0XHQvKipcblx0XHRcdCAqIEZ1bmN0aW9uIHRvIGV4ZWN1dGUgb24gZW50ZXIgbWVkaWEgcXVlcnlcblx0XHRcdCAqXG5cdFx0XHQgKiBAcHJpdmF0ZVxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBfZW50ZXJGbigpIHtcblx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS52cy52aWV3Zm9ybWF0ID0gJ3NtYWxsJztcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogRnVuY3Rpb24gdG8gZXhlY3V0ZSBvbiBleGl0IG1lZGlhIHF1ZXJ5XG5cdFx0XHQgKlxuXHRcdFx0ICogQHByaXZhdGVcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gX2V4aXRGbigpIHtcblx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS52cy52aWV3Zm9ybWF0ID0gJ2xhcmdlJztcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEluaXRpYWxpemUgbWVkaWFDaGVja1xuXHRcdFx0bWVkaWFDaGVjay5pbml0KHtcblx0XHRcdFx0c2NvcGU6ICRzY29wZSxcblx0XHRcdFx0bXE6IE1RLlNNQUxMLFxuXHRcdFx0XHRlbnRlcjogX2VudGVyRm4sXG5cdFx0XHRcdGV4aXQ6IF9leGl0Rm5cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRcdGxpbms6IHZpZXdTd2l0Y2hMaW5rXG5cdFx0fTtcblx0fVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5jb250cm9sbGVyKCdFdmVudERldGFpbEN0cmwnLCBFdmVudERldGFpbEN0cmwpO1xuXG5cdEV2ZW50RGV0YWlsQ3RybC4kaW5qZWN0ID0gWyckc2NvcGUnLCAnJHJvdXRlUGFyYW1zJywgJyRhdXRoJywgJ3VzZXJEYXRhJywgJ2V2ZW50RGF0YScsICckcm9vdFNjb3BlJywgJ0V2ZW50J107XG5cblx0ZnVuY3Rpb24gRXZlbnREZXRhaWxDdHJsKCRzY29wZSwgJHJvdXRlUGFyYW1zLCAkYXV0aCwgdXNlckRhdGEsIGV2ZW50RGF0YSwgJHJvb3RTY29wZSwgRXZlbnQpIHtcblx0XHR2YXIgZXZlbnQgPSB0aGlzLFxuXHRcdFx0X2V2ZW50SWQgPSAkcm91dGVQYXJhbXMuZXZlbnRJZDtcblxuXHRcdC8qKlxuXHRcdCAqIERldGVybWluZXMgaWYgdGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZFxuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdFx0ICovXG5cdFx0ZXZlbnQuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gJGF1dGguaXNBdXRoZW50aWNhdGVkKCk7XG5cdFx0fTtcblxuXHRcdGV2ZW50LnNob3dNb2RhbCA9IGZhbHNlO1xuXG5cdFx0ZXZlbnQub3BlblJzdnBNb2RhbCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZXZlbnQuc2hvd01vZGFsID0gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogRmV0Y2ggdGhlIHVzZXIncyBkYXRhIGFuZCBwcm9jZXNzIFJTVlAgaW5mb3JtYXRpb25cblx0XHQgKlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gX2dldFVzZXJEYXRhKCkge1xuXG5cdFx0XHQvKipcblx0XHRcdCAqIEZ1bmN0aW9uIGZvciBzdWNjZXNzZnVsIEFQSSBjYWxsIHJldHJpZXZpbmcgdXNlciBkYXRhXG5cdFx0XHQgKiBDaGVjayBpZiB1c2VyIGlzIGFkbWluXG5cdFx0XHQgKiBUaGVuIGNhbGxzIFJTVlAgZGF0YSBhbmQgZGV0ZXJtaW5lcyBpZiB1c2VyIGhhcyBSU1ZQZWQgdG8gdGhpcyBldmVudFxuXHRcdFx0ICpcblx0XHRcdCAqIEBwYXJhbSBkYXRhIHtvYmplY3R9IHByb21pc2UgcHJvdmlkZWQgYnkgJGh0dHAgc3VjY2Vzc1xuXHRcdFx0ICogQHByaXZhdGVcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gX3VzZXJTdWNjZXNzKGRhdGEpIHtcblx0XHRcdFx0ZXZlbnQudXNlciA9IGRhdGE7XG5cdFx0XHRcdGV2ZW50LmlzQWRtaW4gPSBkYXRhLmlzQWRtaW47XG5cblx0XHRcdFx0dmFyIF9yc3ZwcyA9IGV2ZW50LnVzZXIucnN2cHM7XG5cblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBfcnN2cHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHR2YXIgdGhpc1JzdnAgPSBfcnN2cHNbaV07XG5cblx0XHRcdFx0XHRpZiAodGhpc1JzdnAuZXZlbnRJZCA9PT0gX2V2ZW50SWQpIHtcblx0XHRcdFx0XHRcdGV2ZW50LnJzdnBPYmogPSB0aGlzUnN2cDtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGV2ZW50Lm5vUnN2cCA9ICFldmVudC5yc3ZwT2JqO1xuXHRcdFx0XHRldmVudC5yc3ZwQnRuVGV4dCA9IGV2ZW50Lm5vUnN2cCA/ICdSU1ZQJyA6ICdVcGRhdGUgbXkgUlNWUCc7XG5cdFx0XHRcdGV2ZW50LnJzdnBSZWFkeSA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHVzZXJEYXRhLmdldFVzZXIoKS50aGVuKF91c2VyU3VjY2Vzcyk7XG5cdFx0fVxuXG5cdFx0X2dldFVzZXJEYXRhKCk7XG5cblx0XHQvLyB3aGVuIFJTVlAgaGFzIGJlZW4gc3VibWl0dGVkLCB1cGRhdGUgdXNlciBkYXRhXG5cdFx0JHJvb3RTY29wZS4kb24oJ3JzdnBTdWJtaXR0ZWQnLCBfZ2V0VXNlckRhdGEpO1xuXG5cdFx0ZnVuY3Rpb24gX2dlbmVyYXRlSWNhbCgpIHtcblx0XHRcdGV2ZW50LmNhbCA9IGljcygpO1xuXG5cdFx0XHR2YXIgX3N0YXJ0RCA9IEV2ZW50LmdldEpTRGF0ZXRpbWUoZXZlbnQuZGV0YWlsLnN0YXJ0RGF0ZSwgZXZlbnQuZGV0YWlsLnN0YXJ0VGltZSksXG5cdFx0XHRcdF9lbmREID0gRXZlbnQuZ2V0SlNEYXRldGltZShldmVudC5kZXRhaWwuZW5kRGF0ZSwgZXZlbnQuZGV0YWlsLmVuZFRpbWUpO1xuXG5cdFx0XHRldmVudC5jYWwuYWRkRXZlbnQoZXZlbnQuZGV0YWlsLnRpdGxlLCBldmVudC5kZXRhaWwuZGVzY3JpcHRpb24sIGV2ZW50LmRldGFpbC5sb2NhdGlvbiwgX3N0YXJ0RCwgX2VuZEQpO1xuXHRcdH1cblxuXHRcdGV2ZW50LmRvd25sb2FkSWNzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRldmVudC5jYWwuZG93bmxvYWQoKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogRnVuY3Rpb24gZm9yIHN1Y2Nlc3NmdWwgQVBJIGNhbGwgZ2V0dGluZyBzaW5nbGUgZXZlbnQgZGV0YWlsXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gZGF0YSB7b2JqZWN0fSBwcm9taXNlIHByb3ZpZGVkIGJ5ICRodHRwIHN1Y2Nlc3Ncblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIF9ldmVudFN1Y2Nlc3MoZGF0YSkge1xuXHRcdFx0ZXZlbnQuZGV0YWlsID0gZGF0YTtcblx0XHRcdGV2ZW50LmRldGFpbC5wcmV0dHlEYXRlID0gRXZlbnQuZ2V0UHJldHR5RGF0ZXRpbWUoZXZlbnQuZGV0YWlsKTtcblx0XHRcdGV2ZW50LmRldGFpbC5leHBpcmVkID0gRXZlbnQuZXhwaXJlZChldmVudC5kZXRhaWwpO1xuXHRcdFx0ZXZlbnQuZXZlbnRSZWFkeSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0ZXZlbnREYXRhLmdldEV2ZW50KF9ldmVudElkKS50aGVuKF9ldmVudFN1Y2Nlc3MpO1xuXG5cdFx0dmFyIF93YXRjaFJzdnBSZWFkeSA9ICRzY29wZS4kd2F0Y2goJ2V2ZW50LnJzdnBSZWFkeScsIGZ1bmN0aW9uKG5ld1ZhbCwgb2xkVmFsKSB7XG5cdFx0XHRpZiAobmV3VmFsICYmIGV2ZW50LmRldGFpbCAmJiBldmVudC5kZXRhaWwucnN2cCAmJiBldmVudC5yc3ZwT2JqKSB7XG5cdFx0XHRcdF9nZW5lcmF0ZUljYWwoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5kaXJlY3RpdmUoJ3JzdnBGb3JtJywgcnN2cEZvcm0pO1xuXG5cdHJzdnBGb3JtLiRpbmplY3QgPSBbJ3JzdnBEYXRhJywgJyR0aW1lb3V0JywgJyRyb290U2NvcGUnXTtcblxuXHRmdW5jdGlvbiByc3ZwRm9ybShyc3ZwRGF0YSwgJHRpbWVvdXQsICRyb290U2NvcGUpIHtcblxuXHRcdHJzdnBGb3JtQ3RybC4kaW5qZWN0ID0gWyckc2NvcGUnXTtcblxuXHRcdGZ1bmN0aW9uIHJzdnBGb3JtQ3RybCgkc2NvcGUpIHtcblx0XHRcdC8vIGNvbnRyb2xsZXJBcyBzeW50YXhcblx0XHRcdHZhciByZiA9IHRoaXM7XG5cblx0XHRcdC8vIGNoZWNrIGlmIGZvcm0gaXMgY3JlYXRlIG9yIGVkaXQgKGRvZXMgdGhlIG1vZGVsIGFscmVhZHkgZXhpc3Qgb3Igbm90KVxuXHRcdFx0dmFyIF9pc0NyZWF0ZSA9ICFyZi5mb3JtTW9kZWwsXG5cdFx0XHRcdF9pc0VkaXQgPSByZi5mb3JtTW9kZWw7XG5cblx0XHRcdHJmLm51bWJlclJlZ2V4ID0gL14oWzEtOV18MTApJC87XG5cblx0XHRcdGlmIChfaXNDcmVhdGUgJiYgcmYudXNlck5hbWUpIHtcblx0XHRcdFx0cmYuZm9ybU1vZGVsID0ge1xuXHRcdFx0XHRcdHVzZXJJZDogcmYudXNlcklkLFxuXHRcdFx0XHRcdGV2ZW50TmFtZTogcmYuZXZlbnQudGl0bGUsXG5cdFx0XHRcdFx0bmFtZTogcmYudXNlck5hbWVcblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBXYXRjaCB1c2VyJ3MgYXR0ZW5kaW5nIGlucHV0IGFuZCBpZiB0cnVlLCBzZXQgZGVmYXVsdCBudW1iZXIgb2YgZ3Vlc3RzIHRvIDFcblx0XHRcdCAqXG5cdFx0XHQgKiBAdHlwZSB7KnxmdW5jdGlvbigpfVxuXHRcdFx0ICogQHByaXZhdGVcblx0XHRcdCAqL1xuXHRcdFx0dmFyIF93YXRjaEF0dGVuZGluZyA9ICRzY29wZS4kd2F0Y2goJ3JmLmZvcm1Nb2RlbC5hdHRlbmRpbmcnLCBmdW5jdGlvbihuZXdWYWwsIG9sZFZhbCkge1xuXHRcdFx0XHRpZiAobmV3VmFsID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0cmYuZm9ybU1vZGVsLmd1ZXN0cyA9IDE7XG5cblx0XHRcdFx0XHQvLyBkZXJlZ2lzdGVyICR3YXRjaFxuXHRcdFx0XHRcdF93YXRjaEF0dGVuZGluZygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBSZXNldCB0aGUgc3RhdGUgb2YgdGhlIGZvcm0gU3VibWl0IGJ1dHRvblxuXHRcdFx0ICpcblx0XHRcdCAqIEBwcml2YXRlXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIF9idG5TdWJtaXRSZXNldCgpIHtcblx0XHRcdFx0cmYuYnRuU2F2ZWQgPSBmYWxzZTtcblx0XHRcdFx0cmYuYnRuU3VibWl0VGV4dCA9IF9pc0NyZWF0ZSA/ICdTdWJtaXQgUlNWUCcgOiAnVXBkYXRlIFJTVlAnO1xuXHRcdFx0fVxuXG5cdFx0XHRfYnRuU3VibWl0UmVzZXQoKTtcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBGdW5jdGlvbiBmb3IgUlNWUCBBUEkgY2FsbCBzdWNjZWVkZWRcblx0XHRcdCAqXG5cdFx0XHQgKiBAcHJpdmF0ZVxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBfcnN2cFN1Y2Nlc3MoKSB7XG5cdFx0XHRcdHJmLmJ0blNhdmVkID0gdHJ1ZTtcblx0XHRcdFx0cmYuYnRuU3VibWl0VGV4dCA9IF9pc0NyZWF0ZSA/ICdTdWJtaXR0ZWQhJyA6ICdVcGRhdGVkISc7XG5cblx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdyc3ZwU3VibWl0dGVkJyk7XG5cblx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0X2J0blN1Ym1pdFJlc2V0KCk7XG5cdFx0XHRcdFx0cmYuc2hvd01vZGFsID0gZmFsc2U7XG5cdFx0XHRcdH0sIDEwMDApO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEZ1bmN0aW9uIGZvciBSU1ZQIEFQSSBjYWxsIGVycm9yXG5cdFx0XHQgKlxuXHRcdFx0ICogQHByaXZhdGVcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gX3JzdnBFcnJvcigpIHtcblx0XHRcdFx0cmYuYnRuU2F2ZWQgPSAnZXJyb3InO1xuXHRcdFx0XHRyZi5idG5TdWJtaXRUZXh0ID0gX2lzQ3JlYXRlID8gJ0Vycm9yIHN1Ym1pdHRpbmchJyA6ICdFcnJvciB1cGRhdGluZyEnO1xuXG5cdFx0XHRcdCR0aW1lb3V0KF9idG5TdWJtaXRSZXNldCwgMzAwMCk7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQ2xpY2sgc3VibWl0IGJ1dHRvblxuXHRcdFx0ICogU3VibWl0IFJTVlAgdG8gQVBJXG5cdFx0XHQgKiBGb3JtIEAgcnN2cEZvcm0udHBsLmh0bWxcblx0XHRcdCAqL1xuXHRcdFx0cmYuc3VibWl0UnN2cCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZi5idG5TdWJtaXRUZXh0ID0gJ1NlbmRpbmcuLi4nO1xuXG5cdFx0XHRcdGlmIChfaXNDcmVhdGUpIHtcblx0XHRcdFx0XHRyc3ZwRGF0YS5jcmVhdGVSc3ZwKHJmLmV2ZW50Ll9pZCwgcmYuZm9ybU1vZGVsKS50aGVuKF9yc3ZwU3VjY2VzcywgX3JzdnBFcnJvcik7XG5cblx0XHRcdFx0fSBlbHNlIGlmIChfaXNFZGl0KSB7XG5cdFx0XHRcdFx0cnN2cERhdGEudXBkYXRlUnN2cChyZi5mb3JtTW9kZWwuX2lkLCByZi5mb3JtTW9kZWwpLnRoZW4oX3JzdnBTdWNjZXNzLCBfcnN2cEVycm9yKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBDbGljayBmdW5jdGlvbiB0byBjbG9zZSB0aGUgbW9kYWwgd2luZG93XG5cdFx0XHQgKi9cblx0XHRcdHJmLmNsb3NlTW9kYWwgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmYuc2hvd01vZGFsID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdFx0c2NvcGU6IHtcblx0XHRcdFx0ZXZlbnQ6ICc9Jyxcblx0XHRcdFx0dXNlck5hbWU6ICdAJyxcblx0XHRcdFx0dXNlcklkOiAnQCcsXG5cdFx0XHRcdGZvcm1Nb2RlbDogJz0nLFxuXHRcdFx0XHRzaG93TW9kYWw6ICc9J1xuXHRcdFx0fSxcblx0XHRcdHRlbXBsYXRlVXJsOiAnL25nLWFwcC9ldmVudC1kZXRhaWwvcnN2cEZvcm0udHBsLmh0bWwnLFxuXHRcdFx0Y29udHJvbGxlcjogcnN2cEZvcm1DdHJsLFxuXHRcdFx0Y29udHJvbGxlckFzOiAncmYnLFxuXHRcdFx0YmluZFRvQ29udHJvbGxlcjogdHJ1ZVxuXHRcdH1cblx0fVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5jb250cm9sbGVyKCdFdmVudHNDdHJsJywgRXZlbnRzQ3RybCk7XG5cblx0RXZlbnRzQ3RybC4kaW5qZWN0ID0gWyckYXV0aCcsICdldmVudERhdGEnLCAnRXZlbnQnXTtcblxuXHRmdW5jdGlvbiBFdmVudHNDdHJsKCRhdXRoLCBldmVudERhdGEsIEV2ZW50KSB7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXM7XG5cblx0XHQvKipcblx0XHQgKiBEZXRlcm1pbmVzIGlmIHRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWRcblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHRcdCAqL1xuXHRcdGV2ZW50cy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiAkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogRnVuY3Rpb24gZm9yIHN1Y2Nlc3NmdWwgQVBJIGNhbGwgZ2V0dGluZyBldmVudHMgbGlzdFxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIGRhdGEge0FycmF5fSBwcm9taXNlIHByb3ZpZGVkIGJ5ICRodHRwIHN1Y2Nlc3Ncblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIF9ldmVudHNTdWNjZXNzKGRhdGEpIHtcblx0XHRcdGV2ZW50cy5hbGxFdmVudHMgPSBkYXRhO1xuXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGV2ZW50cy5hbGxFdmVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIHRoaXNFdnQgPSBldmVudHMuYWxsRXZlbnRzW2ldO1xuXG5cdFx0XHRcdHRoaXNFdnQuc3RhcnREYXRlSlMgPSBFdmVudC5nZXRKU0RhdGV0aW1lKHRoaXNFdnQuc3RhcnREYXRlLCB0aGlzRXZ0LnN0YXJ0VGltZSk7XG5cdFx0XHRcdHRoaXNFdnQuZXhwaXJlZCA9IEV2ZW50LmV4cGlyZWQodGhpc0V2dCk7XG5cdFx0XHR9XG5cblx0XHRcdGV2ZW50cy5ldmVudHNSZWFkeSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0ZXZlbnREYXRhLmdldEFsbEV2ZW50cygpLnRoZW4oX2V2ZW50c1N1Y2Nlc3MpO1xuXG5cdFx0LyoqXG5cdFx0ICogQ3VzdG9tIHNvcnQgZnVuY3Rpb25cblx0XHQgKiBHZXQgZXZlbnQgc3RhcnQgZGF0ZSBhbmQgY2hhbmdlIHRvIHJlYWwgZGF0ZSB0byBzb3J0IGJ5XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gZXZ0IHtvYmplY3R9IGV2ZW50IG9iamVjdFxuXHRcdCAqIEByZXR1cm5zIHtEYXRlfVxuXHRcdCAqL1xuXHRcdGV2ZW50cy5zb3J0U3RhcnREYXRlID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0XHRyZXR1cm4gRXZlbnQuZ2V0SlNEYXRldGltZShldnQuc3RhcnREYXRlLCBldnQuc3RhcnRUaW1lKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogQ2xlYXIgc2VhcmNoIHF1ZXJ5XG5cdFx0ICovXG5cdFx0Ly9ldmVudHMuY2xlYXJRdWVyeSA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vXHRldmVudHMucXVlcnkgPSAnJztcblx0XHQvL307XG5cdH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuY29udHJvbGxlcignQWNjb3VudEN0cmwnLCBBY2NvdW50Q3RybCk7XG5cblx0QWNjb3VudEN0cmwuJGluamVjdCA9IFsnJHNjb3BlJywgJyRsb2NhdGlvbicsICckYXV0aCcsICd1c2VyRGF0YScsICckdGltZW91dCcsICdPQVVUSCcsICdVc2VyJ107XG5cblx0ZnVuY3Rpb24gQWNjb3VudEN0cmwoJHNjb3BlLCAkbG9jYXRpb24sICRhdXRoLCB1c2VyRGF0YSwgJHRpbWVvdXQsIE9BVVRILCBVc2VyKSB7XG5cdFx0Ly8gY29udHJvbGxlckFzIFZpZXdNb2RlbFxuXHRcdHZhciBhY2NvdW50ID0gdGhpcztcblxuXHRcdC8vIEFsbCBhdmFpbGFibGUgbG9naW4gc2VydmljZXNcblx0XHRhY2NvdW50LmxvZ2lucyA9IE9BVVRILkxPR0lOUztcblxuXHRcdC8qKlxuXHRcdCAqIElzIHRoZSB1c2VyIGF1dGhlbnRpY2F0ZWQ/XG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0XHQgKi9cblx0XHRhY2NvdW50LmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuICRhdXRoLmlzQXV0aGVudGljYXRlZCgpO1xuXHRcdH07XG5cblx0XHR2YXIgX3RhYiA9ICRsb2NhdGlvbi5zZWFyY2goKS52aWV3O1xuXG5cdFx0YWNjb3VudC50YWJzID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiAnVXNlciBJbmZvJyxcblx0XHRcdFx0cXVlcnk6ICd1c2VyLWluZm8nXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiAnTWFuYWdlIExvZ2lucycsXG5cdFx0XHRcdHF1ZXJ5OiAnbWFuYWdlLWxvZ2lucydcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6ICdSU1ZQcycsXG5cdFx0XHRcdHF1ZXJ5OiAncnN2cHMnXG5cdFx0XHR9XG5cdFx0XTtcblxuXHRcdGFjY291bnQuY3VycmVudFRhYiA9IF90YWIgPyBfdGFiIDogJ3VzZXItaW5mbyc7XG5cblx0XHQvKipcblx0XHQgKiBDaGFuZ2UgdGFicyBieSB3YXRjaGluZyBmb3Igcm91dGUgdXBkYXRlXG5cdFx0ICovXG5cdFx0JHNjb3BlLiRvbignJHJvdXRlVXBkYXRlJywgZnVuY3Rpb24oZXZlbnQsIG5leHQpIHtcblx0XHRcdGFjY291bnQuY3VycmVudFRhYiA9IG5leHQucGFyYW1zLnZpZXcgfHwgJ3VzZXItaW5mbyc7XG5cdFx0fSk7XG5cblx0XHQvKipcblx0XHQgKiBHZXQgdXNlcidzIHByb2ZpbGUgaW5mb3JtYXRpb25cblx0XHQgKi9cblx0XHRhY2NvdW50LmdldFByb2ZpbGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdC8qKlxuXHRcdFx0ICogRnVuY3Rpb24gZm9yIHN1Y2Nlc3NmdWwgQVBJIGNhbGwgZ2V0dGluZyB1c2VyJ3MgcHJvZmlsZSBkYXRhXG5cdFx0XHQgKiBTaG93IEFjY291bnQgVUlcblx0XHRcdCAqXG5cdFx0XHQgKiBAcGFyYW0gZGF0YSB7b2JqZWN0fSBwcm9taXNlIHByb3ZpZGVkIGJ5ICRodHRwIHN1Y2Nlc3Ncblx0XHRcdCAqIEBwcml2YXRlXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIF9nZXRVc2VyU3VjY2VzcyhkYXRhKSB7XG5cdFx0XHRcdGFjY291bnQudXNlciA9IGRhdGE7XG5cdFx0XHRcdGFjY291bnQuYWRtaW5pc3RyYXRvciA9IGFjY291bnQudXNlci5pc0FkbWluO1xuXHRcdFx0XHRhY2NvdW50LmxpbmtlZEFjY291bnRzID0gVXNlci5nZXRMaW5rZWRBY2NvdW50cyhhY2NvdW50LnVzZXIsICdhY2NvdW50Jyk7XG5cdFx0XHRcdGFjY291bnQuc2hvd0FjY291bnQgPSB0cnVlO1xuXHRcdFx0XHRhY2NvdW50LnJzdnBzID0gYWNjb3VudC51c2VyLnJzdnBzO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEZ1bmN0aW9uIGZvciBlcnJvciBBUEkgY2FsbCBnZXR0aW5nIHVzZXIncyBwcm9maWxlIGRhdGFcblx0XHRcdCAqIFNob3cgYW4gZXJyb3IgYWxlcnQgaW4gdGhlIFVJXG5cdFx0XHQgKlxuXHRcdFx0ICogQHBhcmFtIGVycm9yXG5cdFx0XHQgKiBAcHJpdmF0ZVxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBfZ2V0VXNlckVycm9yKGVycm9yKSB7XG5cdFx0XHRcdGFjY291bnQuZXJyb3JHZXR0aW5nVXNlciA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHVzZXJEYXRhLmdldFVzZXIoKS50aGVuKF9nZXRVc2VyU3VjY2VzcywgX2dldFVzZXJFcnJvcik7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJlc2V0IHByb2ZpbGUgc2F2ZSBidXR0b24gdG8gaW5pdGlhbCBzdGF0ZVxuXHRcdCAqXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHRmdW5jdGlvbiBfYnRuU2F2ZVJlc2V0KCkge1xuXHRcdFx0YWNjb3VudC5idG5TYXZlZCA9IGZhbHNlO1xuXHRcdFx0YWNjb3VudC5idG5TYXZlVGV4dCA9ICdTYXZlJztcblx0XHR9XG5cblx0XHRfYnRuU2F2ZVJlc2V0KCk7XG5cblx0XHQvKipcblx0XHQgKiBXYXRjaCBkaXNwbGF5IG5hbWUgY2hhbmdlcyB0byBjaGVjayBmb3IgZW1wdHkgb3IgbnVsbCBzdHJpbmdcblx0XHQgKiBTZXQgYnV0dG9uIHRleHQgYWNjb3JkaW5nbHlcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSBuZXdWYWwge3N0cmluZ30gdXBkYXRlZCBkaXNwbGF5TmFtZSB2YWx1ZSBmcm9tIGlucHV0IGZpZWxkXG5cdFx0ICogQHBhcmFtIG9sZFZhbCB7Kn0gcHJldmlvdXMgZGlzcGxheU5hbWUgdmFsdWVcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdGZ1bmN0aW9uIF93YXRjaERpc3BsYXlOYW1lKG5ld1ZhbCwgb2xkVmFsKSB7XG5cdFx0XHRpZiAobmV3VmFsID09PSAnJyB8fCBuZXdWYWwgPT09IG51bGwpIHtcblx0XHRcdFx0YWNjb3VudC5idG5TYXZlVGV4dCA9ICdFbnRlciBOYW1lJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFjY291bnQuYnRuU2F2ZVRleHQgPSAnU2F2ZSc7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdCRzY29wZS4kd2F0Y2goJ2FjY291bnQudXNlci5kaXNwbGF5TmFtZScsIF93YXRjaERpc3BsYXlOYW1lKTtcblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZSB1c2VyJ3MgcHJvZmlsZSBpbmZvcm1hdGlvblxuXHRcdCAqIENhbGxlZCBvbiBzdWJtaXNzaW9uIG9mIHVwZGF0ZSBmb3JtXG5cdFx0ICovXG5cdFx0YWNjb3VudC51cGRhdGVQcm9maWxlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgcHJvZmlsZURhdGEgPSB7IGRpc3BsYXlOYW1lOiBhY2NvdW50LnVzZXIuZGlzcGxheU5hbWUgfTtcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBTdWNjZXNzIGNhbGxiYWNrIHdoZW4gcHJvZmlsZSBoYXMgYmVlbiB1cGRhdGVkXG5cdFx0XHQgKlxuXHRcdFx0ICogQHByaXZhdGVcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gX3VwZGF0ZVN1Y2Nlc3MoKSB7XG5cdFx0XHRcdGFjY291bnQuYnRuU2F2ZWQgPSB0cnVlO1xuXHRcdFx0XHRhY2NvdW50LmJ0blNhdmVUZXh0ID0gJ1NhdmVkISc7XG5cblx0XHRcdFx0JHRpbWVvdXQoX2J0blNhdmVSZXNldCwgMjUwMCk7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogRXJyb3IgY2FsbGJhY2sgd2hlbiBwcm9maWxlIHVwZGF0ZSBoYXMgZmFpbGVkXG5cdFx0XHQgKlxuXHRcdFx0ICogQHByaXZhdGVcblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gX3VwZGF0ZUVycm9yKCkge1xuXHRcdFx0XHRhY2NvdW50LmJ0blNhdmVkID0gJ2Vycm9yJztcblx0XHRcdFx0YWNjb3VudC5idG5TYXZlVGV4dCA9ICdFcnJvciBzYXZpbmchJztcblxuXHRcdFx0XHQkdGltZW91dChfYnRuU2F2ZVJlc2V0LCAzMDAwKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCEhYWNjb3VudC51c2VyLmRpc3BsYXlOYW1lKSB7XG5cdFx0XHRcdC8vIFNldCBzdGF0dXMgdG8gU2F2aW5nLi4uIGFuZCB1cGRhdGUgdXBvbiBzdWNjZXNzIG9yIGVycm9yIGluIGNhbGxiYWNrc1xuXHRcdFx0XHRhY2NvdW50LmJ0blNhdmVUZXh0ID0gJ1NhdmluZy4uLic7XG5cblx0XHRcdFx0Ly8gVXBkYXRlIHRoZSB1c2VyLCBwYXNzaW5nIHByb2ZpbGUgZGF0YSBhbmQgYXNzaWduaW5nIHN1Y2Nlc3MgYW5kIGVycm9yIGNhbGxiYWNrc1xuXHRcdFx0XHR1c2VyRGF0YS51cGRhdGVVc2VyKHByb2ZpbGVEYXRhKS50aGVuKF91cGRhdGVTdWNjZXNzLCBfdXBkYXRlRXJyb3IpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBMaW5rIHRoaXJkLXBhcnR5IHByb3ZpZGVyXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gcHJvdmlkZXJcblx0XHQgKi9cblx0XHRhY2NvdW50LmxpbmsgPSBmdW5jdGlvbihwcm92aWRlcikge1xuXHRcdFx0JGF1dGgubGluayhwcm92aWRlcilcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0YWNjb3VudC5nZXRQcm9maWxlKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdGFsZXJ0KHJlc3BvbnNlLmRhdGEubWVzc2FnZSk7XG5cdFx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBVbmxpbmsgdGhpcmQtcGFydHkgcHJvdmlkZXJcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBwcm92aWRlclxuXHRcdCAqL1xuXHRcdGFjY291bnQudW5saW5rID0gZnVuY3Rpb24ocHJvdmlkZXIpIHtcblx0XHRcdCRhdXRoLnVubGluayhwcm92aWRlcilcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0YWNjb3VudC5nZXRQcm9maWxlKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdGFsZXJ0KHJlc3BvbnNlLmRhdGEgPyByZXNwb25zZS5kYXRhLm1lc3NhZ2UgOiAnQ291bGQgbm90IHVubGluayAnICsgcHJvdmlkZXIgKyAnIGFjY291bnQnKTtcblx0XHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdGFjY291bnQuZ2V0UHJvZmlsZSgpO1xuXHR9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHQndXNlIHN0cmljdCc7XHJcblxyXG5cdGFuZ3VsYXJcclxuXHRcdC5tb2R1bGUoJ215QXBwJylcclxuXHRcdC5jb250cm9sbGVyKCdIZWFkZXJDdHJsJywgaGVhZGVyQ3RybCk7XHJcblxyXG5cdGhlYWRlckN0cmwuJGluamVjdCA9IFsnJHNjb3BlJywgJyRsb2NhdGlvbicsICdsb2NhbERhdGEnLCAnJGF1dGgnLCAndXNlckRhdGEnXTtcclxuXHJcblx0ZnVuY3Rpb24gaGVhZGVyQ3RybCgkc2NvcGUsICRsb2NhdGlvbiwgbG9jYWxEYXRhLCAkYXV0aCwgdXNlckRhdGEpIHtcclxuXHRcdC8vIGNvbnRyb2xsZXJBcyBWaWV3TW9kZWxcclxuXHRcdHZhciBoZWFkZXIgPSB0aGlzO1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogTG9nIHRoZSB1c2VyIG91dCBvZiB3aGF0ZXZlciBhdXRoZW50aWNhdGlvbiB0aGV5J3ZlIHNpZ25lZCBpbiB3aXRoXHJcblx0XHQgKi9cclxuXHRcdGhlYWRlci5sb2dvdXQgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0aGVhZGVyLmFkbWluVXNlciA9IHVuZGVmaW5lZDtcclxuXHRcdFx0JGF1dGgubG9nb3V0KCcvbG9naW4nKTtcclxuXHRcdH07XHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBJZiB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQgYW5kIGFkbWluVXNlciBpcyB1bmRlZmluZWQsXHJcblx0XHQgKiBnZXQgdGhlIHVzZXIgYW5kIHNldCBhZG1pblVzZXIgYm9vbGVhbi5cclxuXHRcdCAqXHJcblx0XHQgKiBEbyB0aGlzIG9uIGZpcnN0IGNvbnRyb2xsZXIgbG9hZCAoaW5pdCwgcmVmcmVzaClcclxuXHRcdCAqIGFuZCBzdWJzZXF1ZW50IGxvY2F0aW9uIGNoYW5nZXMgKGllLCBjYXRjaGluZyBsb2dvdXQsIGxvZ2luLCBldGMpLlxyXG5cdFx0ICpcclxuXHRcdCAqIEBwcml2YXRlXHJcblx0XHQgKi9cclxuXHRcdGZ1bmN0aW9uIF9jaGVja1VzZXJBZG1pbigpIHtcclxuXHRcdFx0Ly8gaWYgdXNlciBpcyBhdXRoZW50aWNhdGVkIGFuZCBub3QgZGVmaW5lZCB5ZXQsIGNoZWNrIGlmIHRoZXkncmUgYW4gYWRtaW5cclxuXHRcdFx0aWYgKCRhdXRoLmlzQXV0aGVudGljYXRlZCgpICYmIGhlYWRlci5hZG1pblVzZXIgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHVzZXJEYXRhLmdldFVzZXIoKVxyXG5cdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHRcdFx0XHRoZWFkZXIuYWRtaW5Vc2VyID0gZGF0YS5pc0FkbWluO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdF9jaGVja1VzZXJBZG1pbigpO1xyXG5cdFx0JHNjb3BlLiRvbignJGxvY2F0aW9uQ2hhbmdlU3VjY2VzcycsIF9jaGVja1VzZXJBZG1pbik7XHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBJcyB0aGUgdXNlciBhdXRoZW50aWNhdGVkP1xyXG5cdFx0ICpcclxuXHRcdCAqIEByZXR1cm5zIHtib29sZWFufVxyXG5cdFx0ICovXHJcblx0XHRoZWFkZXIuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiAkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKTtcclxuXHRcdH07XHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBDdXJyZW50bHkgYWN0aXZlIG5hdiBpdGVtIHdoZW4gJy8nIGluZGV4XHJcblx0XHQgKlxyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcclxuXHRcdCAqIEByZXR1cm5zIHtib29sZWFufVxyXG5cdFx0ICovXHJcblx0XHRoZWFkZXIuaW5kZXhJc0FjdGl2ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuXHRcdFx0Ly8gcGF0aCBzaG91bGQgYmUgJy8nXHJcblx0XHRcdHJldHVybiAkbG9jYXRpb24ucGF0aCgpID09PSBwYXRoO1xyXG5cdFx0fTtcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEN1cnJlbnRseSBhY3RpdmUgbmF2IGl0ZW1cclxuXHRcdCAqXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxyXG5cdFx0ICogQHJldHVybnMge2Jvb2xlYW59XHJcblx0XHQgKi9cclxuXHRcdGhlYWRlci5uYXZJc0FjdGl2ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuXHRcdFx0cmV0dXJuICRsb2NhdGlvbi5wYXRoKCkuc3Vic3RyKDAsIHBhdGgubGVuZ3RoKSA9PT0gcGF0aDtcclxuXHRcdH07XHJcblx0fVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5kaXJlY3RpdmUoJ25hdkNvbnRyb2wnLCBuYXZDb250cm9sKTtcblxuXHRuYXZDb250cm9sLiRpbmplY3QgPSBbJ21lZGlhQ2hlY2snLCAnTVEnLCAnJHRpbWVvdXQnXTtcblxuXHRmdW5jdGlvbiBuYXZDb250cm9sKG1lZGlhQ2hlY2ssIE1RLCAkdGltZW91dCkge1xuXG5cdFx0bmF2Q29udHJvbExpbmsuJGluamVjdCA9IFsnJHNjb3BlJywgJyRlbGVtZW50JywgJyRhdHRycyddO1xuXG5cdFx0ZnVuY3Rpb24gbmF2Q29udHJvbExpbmsoJHNjb3BlKSB7XG5cdFx0XHQvLyBkYXRhIG9iamVjdFxuXHRcdFx0JHNjb3BlLm5hdiA9IHt9O1xuXG5cdFx0XHR2YXIgX2JvZHkgPSBhbmd1bGFyLmVsZW1lbnQoJ2JvZHknKSxcblx0XHRcdFx0X25hdk9wZW47XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogT3BlbiBtb2JpbGUgbmF2aWdhdGlvblxuXHRcdFx0ICpcblx0XHRcdCAqIEBwcml2YXRlXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIF9vcGVuTmF2KCkge1xuXHRcdFx0XHRfYm9keVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcygnbmF2LWNsb3NlZCcpXG5cdFx0XHRcdFx0LmFkZENsYXNzKCduYXYtb3BlbicpO1xuXG5cdFx0XHRcdF9uYXZPcGVuID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBDbG9zZSBtb2JpbGUgbmF2aWdhdGlvblxuXHRcdFx0ICpcblx0XHRcdCAqIEBwcml2YXRlXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIF9jbG9zZU5hdigpIHtcblx0XHRcdFx0X2JvZHlcblx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoJ25hdi1vcGVuJylcblx0XHRcdFx0XHQuYWRkQ2xhc3MoJ25hdi1jbG9zZWQnKTtcblxuXHRcdFx0XHRfbmF2T3BlbiA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiBlbnRlcmluZyBtb2JpbGUgbWVkaWEgcXVlcnlcblx0XHRcdCAqIENsb3NlIG5hdiBhbmQgc2V0IHVwIG1lbnUgdG9nZ2xpbmcgZnVuY3Rpb25hbGl0eVxuXHRcdFx0ICpcblx0XHRcdCAqIEBwcml2YXRlXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIF9lbnRlck1vYmlsZSgpIHtcblx0XHRcdFx0X2Nsb3NlTmF2KCk7XG5cblx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdCAqIFRvZ2dsZSBtb2JpbGUgbmF2aWdhdGlvbiBvcGVuL2Nsb3NlZFxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdCRzY29wZS5uYXYudG9nZ2xlTmF2ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0aWYgKCFfbmF2T3Blbikge1xuXHRcdFx0XHRcdFx0XHRfb3Blbk5hdigpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0X2Nsb3NlTmF2KCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLiRvbignJGxvY2F0aW9uQ2hhbmdlU3VjY2VzcycsIF9jbG9zZU5hdik7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogRnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIGV4aXRpbmcgbW9iaWxlIG1lZGlhIHF1ZXJ5XG5cdFx0XHQgKiBEaXNhYmxlIG1lbnUgdG9nZ2xpbmcgYW5kIHJlbW92ZSBib2R5IGNsYXNzZXNcblx0XHRcdCAqXG5cdFx0XHQgKiBAcHJpdmF0ZVxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBfZXhpdE1vYmlsZSgpIHtcblx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5uYXYudG9nZ2xlTmF2ID0gbnVsbDtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X2JvZHkucmVtb3ZlQ2xhc3MoJ25hdi1jbG9zZWQgbmF2LW9wZW4nKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU2V0IHVwIGZ1bmN0aW9uYWxpdHkgdG8gcnVuIG9uIGVudGVyL2V4aXQgb2YgbWVkaWEgcXVlcnlcblx0XHRcdG1lZGlhQ2hlY2suaW5pdCh7XG5cdFx0XHRcdHNjb3BlOiAkc2NvcGUsXG5cdFx0XHRcdG1xOiBNUS5TTUFMTCxcblx0XHRcdFx0ZW50ZXI6IF9lbnRlck1vYmlsZSxcblx0XHRcdFx0ZXhpdDogX2V4aXRNb2JpbGVcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRcdGxpbms6IG5hdkNvbnRyb2xMaW5rXG5cdFx0fTtcblx0fVxuXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuY29udHJvbGxlcignTG9naW5DdHJsJywgTG9naW5DdHJsKTtcblxuXHRMb2dpbkN0cmwuJGluamVjdCA9IFsnJGF1dGgnLCAnT0FVVEgnLCAnJHJvb3RTY29wZScsICckbG9jYXRpb24nXTtcblxuXHRmdW5jdGlvbiBMb2dpbkN0cmwoJGF1dGgsIE9BVVRILCAkcm9vdFNjb3BlLCAkbG9jYXRpb24pIHtcblx0XHQvLyBjb250cm9sbGVyQXMgVmlld01vZGVsXG5cdFx0dmFyIGxvZ2luID0gdGhpcztcblxuXHRcdGxvZ2luLmxvZ2lucyA9IE9BVVRILkxPR0lOUztcblxuXHRcdC8qKlxuXHRcdCAqIEF1dGhlbnRpY2F0ZSB0aGUgdXNlciB2aWEgT2F1dGggd2l0aCB0aGUgc3BlY2lmaWVkIHByb3ZpZGVyXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gcHJvdmlkZXIgLSAodHdpdHRlciwgZmFjZWJvb2ssIGdpdGh1YiwgZ29vZ2xlKVxuXHRcdCAqL1xuXHRcdGxvZ2luLmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uKHByb3ZpZGVyKSB7XG5cdFx0XHRsb2dpbi5sb2dnaW5nSW4gPSB0cnVlO1xuXG5cdFx0XHQvKipcblx0XHRcdCAqIFN1Y2Nlc3NmdWxseSBhdXRoZW50aWNhdGVkXG5cdFx0XHQgKiBHbyB0byBpbml0aWFsbHkgaW50ZW5kZWQgYXV0aGVudGljYXRlZCBwYXRoXG5cdFx0XHQgKlxuXHRcdFx0ICogQHBhcmFtIHJlc3BvbnNlIHtvYmplY3R9IHByb21pc2UgcmVzcG9uc2Vcblx0XHRcdCAqIEBwcml2YXRlXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIF9hdXRoU3VjY2VzcyhyZXNwb25zZSkge1xuXHRcdFx0XHRsb2dpbi5sb2dnaW5nSW4gPSBmYWxzZTtcblxuXHRcdFx0XHRpZiAoJHJvb3RTY29wZS5hdXRoUGF0aCkge1xuXHRcdFx0XHRcdCRsb2NhdGlvbi5wYXRoKCRyb290U2NvcGUuYXV0aFBhdGgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdCRhdXRoLmF1dGhlbnRpY2F0ZShwcm92aWRlcilcblx0XHRcdFx0LnRoZW4oX2F1dGhTdWNjZXNzKVxuXHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHRsb2dpbi5sb2dnaW5nSW4gPSAnZXJyb3InO1xuXHRcdFx0XHRcdGxvZ2luLmxvZ2luTXNnID0gJydcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==