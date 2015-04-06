angular.module('myApp', ['ngRoute', 'ngResource', 'ngSanitize', 'ngMessages', 'mediaCheck', 'satellizer']);
(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AccountCtrl', AccountCtrl);

	AccountCtrl.$inject = ['$auth', '$rootScope', 'userData', '$timeout'];

	function AccountCtrl($auth, $rootScope, userData, $timeout) {
		// controllerAs ViewModel
		var account = this;

		account.logins = [
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
		];

		/***
		 * function getProfile()
		 *
		 * Get user's profile information.
		 */
		account.getProfile = function() {

			userData.getUser(function(data) {
				account.user = data;
				account.administrator = account.user.isAdmin;
				account.linkedAccounts = [];

				angular.forEach(account.logins, function(actObj) {
					var act = actObj.account;

					if (account.user[act]) {
						account.linkedAccounts.push(act);
					}
				});
			});
		};

		/***
		 * function btnSaveReset()
		 *
		 * Reset profile save button to initial state
		 */
		function btnSaveReset() {
			account.btnSaved = false;
			account.btnSaveText = 'Save';
		}

		btnSaveReset();

		/***
		 * function updateProfile()
		 *
		 * Update user's profile information.
		 */
		account.updateProfile = function() {
			var profileData = { displayName: account.user.displayName };

			userData.updateUser(profileData, function() {
				account.btnSaved = true;
				account.btnSaveText = 'Saved!';

				$timeout(btnSaveReset, 2500);
			});
		};

		/***
		 * function link()
		 *
		 * @param provider (string)
		 * Link third-party provider.
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

		/***
		 * function unlink()
		 *
		 * @param provider (string)
		 * Unlink third-party provider.
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
// "global" object to share between controllers
(function() {
	'use strict';

	angular
		.module('myApp')
		.factory('GlobalObj', GlobalObj);

	function GlobalObj() {
		return {
			greeting: 'Hello'
		};
	}
})();
angular.module('myApp')
// media query constants
	.constant('MQ', {
		SMALL: '(max-width: 767px)',
		LARGE: '(min-width: 768px)'
	});
(function() {
	'use strict';

	angular.module('myApp')
		.config(authConfig)
		.run(authRun);

	authConfig.$inject = ['$authProvider'];

	function authConfig($authProvider) {
		$authProvider.loginUrl = 'http://localhost:8080/auth/login';
		$authProvider.signupUrl = 'http://localhost:8080/auth/signup';

		$authProvider.facebook({
			clientId: '343789249146966'
		});

		$authProvider.google({
			clientId: '479651367330-trvf8efoo415ie0usfhm4i59410vk3j9.apps.googleusercontent.com'
		});

		$authProvider.twitter({
			url: '/auth/twitter'
		});

		$authProvider.github({
			clientId: '8096e95c2eba33b81adb'
		});
	}

	authRun.$inject = ['$rootScope', '$location', '$auth'];

	function authRun($rootScope, $location, $auth) {
		$rootScope.$on('$routeChangeStart', function(event, next, current) {
			if (next && next.$$route && next.$$route.secure) {
				if (!$auth.isAuthenticated()) {
					$rootScope.$evalAsync(function() {
						$location.path('/login');
					});
				}
			}
		});
	}

})();
// routes
(function() {
	'use strict';

	angular
		.module('myApp')
		.config(appRoutes);

	appRoutes.$inject = ['$routeProvider', '$locationProvider'];

	function appRoutes($routeProvider, $locationProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'ng-app/home/Home.view.html',
				secure: true
			})
			.when('/login', {
				templateUrl: 'ng-app/login/Login.view.html'
			})
			.when('/account', {
				templateUrl: 'ng-app/account/Account.view.html',
				secure: true
			})
			.when('/subpage', {
				templateUrl: 'ng-app/sub/Sub.view.html',
				secure: true
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
// fetch local JSON data
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('localData', localData);

	localData.$inject = ['$http'];

	function localData($http) {
		this.getJSON = function(callback) {
			return $http
				.get('/ng-app/data/data.json')
				.success(callback)
				.error(function(error) { alert(error.message); });
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

		function userCtrl() {
			// controllerAs ViewModel
			var u = this;

			u.isAuthenticated = function() {
				return $auth.isAuthenticated();
			};

			userData.getUser(function(user) {
				u.user = user;
			});
		}

		return {
			restrict: 'EA',
			controller: userCtrl,
			controllerAs: 'u',
			template: '<div ng-if="u.isAuthenticated() && !!u.user"><img ng-if="!!u.user.picture" ng-src="{{u.user.picture}}" class="img-userPicture" /> {{u.user.displayName}}</div>'
		};
	}
})();
// fetch user data
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('userData', userData);

	userData.$inject = ['$http'];

	function userData($http) {
		this.getUser = function(callback) {
			return $http
				.get('/api/me')
				.success(callback)
				.error(function(error) { alert(error.message); });
		};
		this.updateUser = function(profileData, callback) {
			return $http
				.put('/api/me', profileData)
				.success(callback)
				.error(function(error) { alert(error.message); });
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

		viewSwitchCtrl.$inject = ['$scope'];
		
		function viewSwitchCtrl($scope) {
			// controllerAs ViewModel
			var vs = this;

			mediaCheck.init({
				scope: $scope,
				mq: MQ.SMALL,
				enter: function () {
					$timeout(function () {
						vs.viewformat = 'small';
					});
				},
				exit: function () {
					$timeout(function () {
						vs.viewformat = 'large';
					});
				}
			});
		}

		return {
			restrict: 'EA',
			controller: viewSwitchCtrl,
			controllerAs: 'vs',
			// bindToController: true <-- use if isolate scope
		};
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('HeaderCtrl', headerCtrl);

	headerCtrl.$inject = ['$scope', '$location', 'localData', '$auth'];

	function headerCtrl($scope, $location, localData, $auth) {
		// controllerAs ViewModel
		var header = this;

		/***
		 * function logout()
		 *
		 * Log the user out of whatever authentication they've signed in with
		 */
		header.logout = function() {
			$auth.logout('/login');
		};

		/***
		 * function isAuthenticated()
		 *
		 * Is the user logged in?
		 *
		 * @returns {boolean}
		 */
		header.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		/***
		 * function getJSON()
		 *
		 * Get local data from static JSON
		 *
		 * @param function (success callback)
		 * @returns {*}
		 */
		localData.getJSON(function(data) {
			header.json = data;
		});

		/***
		 * function indexIsActive()
		 *
		 * Apply class to currently active nav item when '/' index
		 *
		 * @param path
		 * @returns {boolean}
		 */
		header.indexIsActive = function(path) {
			// path should be '/'
			return $location.path() === path;
		};

		/***
		 * function navIsActive()
		 *
		 * Apply class to currently active nav item
		 *
		 * @param path
		 * @returns {boolean}
		 */
		header.navIsActive = function (path) {
			return $location.path().substr(0, path.length) === path;
		};

		/***
		 * function $on('$locationChangeSuccess')
		 *
		 * Apply body class depending on what page you're on
		 * TODO: consider moving to a factory
		 */
		$scope.$on('$locationChangeSuccess', function(event, newUrl, oldUrl) {
			var getBodyClass = function (url) {
					var bodyClass = url.substr(url.lastIndexOf('/') + 1);

					return !!bodyClass ? 'page-' + bodyClass : 'page-home';
				},
				oldBodyClass = getBodyClass(oldUrl),
				newBodyClass = getBodyClass(newUrl);

			angular.element('body')
				.removeClass(oldBodyClass)
				.addClass(newBodyClass);
		});
	}

})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('navControl', navControl);

	navControl.$inject = ['mediaCheck', 'MQ', '$timeout'];

	/**
	 * function navControl()
	 *
	 * @param mediaCheck
	 * @param MQ
	 * @param $timeout
	 * @returns {{restrict: string, link: navControlLink}}
	 */
	function navControl(mediaCheck, MQ, $timeout) {

		navControlLink.$inject = ['$scope', '$element', '$attrs'];

		/**
		 * function navControlLink()
		 *
		 * @param $scope
		 * @param $element
		 * @param $attrs
		 *
		 * navControl directive link function
		 */
		function navControlLink($scope, $element, $attrs) {
			var body = angular.element('body'),
				openNav = function () {
					body
						.removeClass('nav-closed')
						.addClass('nav-open');

					$scope.navOpen = true;
				},
				closeNav = function () {
					body
						.removeClass('nav-open')
						.addClass('nav-closed');

					$scope.navOpen = false;
				};

			mediaCheck.init({
				scope: $scope,
				mq: MQ.SMALL,
				enter: function () {
					closeNav();

					$timeout(function () {
						$scope.toggleNav = function () {
							if (body.hasClass('nav-closed')) {
								openNav();
							} else {
								closeNav();
							}
						};
					});

					$scope.$on('$locationChangeSuccess', closeNav);
				},
				exit: function () {
					$timeout(function () {
						$scope.toggleNav = null;
					});

					body.removeClass('nav-closed nav-open');
				}
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
		.controller('HomeCtrl', HomeCtrl);

	HomeCtrl.$inject = ['GlobalObj', '$rootScope', '$auth', 'localData'];

	function HomeCtrl(GlobalObj, $rootScope, $auth, localData) {
		// controllerAs ViewModel
		var home = this;

		/***
		 * isAuthenticated()
		 *
		 * Determines if the user is logged in
		 *
		 * @returns {*}
		 */
		home.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		/***
		 * getJSON()
		 *
		 * Gets local JSON data
		 *
		 * @returns data response, executes success callback OR throws error
		 */
		localData.getJSON(function(data) {
			home.localData = data;
		});

		home.user = $rootScope.user;

		// put global variables in scope
		home.global = GlobalObj;

		// simple data binding example
		home.name = 'Visitor';

		home.stringOfHTML = '<strong>Some bold text</strong> bound as HTML with a <a href="#">link</a>!';
	}
})();
(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('LoginCtrl', LoginCtrl);

	LoginCtrl.$inject = ['GlobalObj', '$auth', '$rootScope', 'userData', '$window'];

	function LoginCtrl(GlobalObj, $auth, $rootScope, userData, $window) {
		// controllerAs ViewModel
		var login = this;

		// put global variables in scope
		login.global = GlobalObj;

		/***
		 * function authenticate()
		 *
		 * Authenticate the user via the provider (Twitter, Facebook, etc.)
		 *
		 * @param provider
		 */
		login.authenticate = function(provider) {
			$auth.authenticate(provider)
				.then(function(response) {
					// signed in
				})
				.catch(function(response) {
					console.log(response.data);
				});
		}
	}
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5nU3RhcnR1cC5qcyIsImFjY291bnQvQWNjb3VudC5jdHJsLmpzIiwiY29yZS9HbG9iYWxPYmouZmFjdG9yeS5qcyIsImNvcmUvTVEuY29uc3RhbnQuanMiLCJjb3JlL2FwcC5hdXRoLmpzIiwiY29yZS9hcHAucm91dGUuanMiLCJjb3JlL2xvY2FsRGF0YS5zZXJ2aWNlLmpzIiwiY29yZS9tZWRpYUNoZWNrLnNlcnZpY2UuanMiLCJjb3JlL3RydXN0QXNIVE1MLmZpbHRlci5qcyIsImNvcmUvdXNlci5kaXIuanMiLCJjb3JlL3VzZXJEYXRhLnNlcnZpY2UuanMiLCJjb3JlL3ZpZXdTd2l0Y2guZGlyLmpzIiwiaGVhZGVyL0hlYWRlci5jdHJsLmpzIiwiaGVhZGVyL05hdkNvbnRyb2wuZGlyLmpzIiwiaG9tZS9Ib21lLmN0cmwuanMiLCJsb2dpbi9Mb2dpbi5jdHJsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJuZy1hcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJhbmd1bGFyLm1vZHVsZSgnbXlBcHAnLCBbJ25nUm91dGUnLCAnbmdSZXNvdXJjZScsICduZ1Nhbml0aXplJywgJ25nTWVzc2FnZXMnLCAnbWVkaWFDaGVjaycsICdzYXRlbGxpemVyJ10pOyIsIihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LmNvbnRyb2xsZXIoJ0FjY291bnRDdHJsJywgQWNjb3VudEN0cmwpO1xuXG5cdEFjY291bnRDdHJsLiRpbmplY3QgPSBbJyRhdXRoJywgJyRyb290U2NvcGUnLCAndXNlckRhdGEnLCAnJHRpbWVvdXQnXTtcblxuXHRmdW5jdGlvbiBBY2NvdW50Q3RybCgkYXV0aCwgJHJvb3RTY29wZSwgdXNlckRhdGEsICR0aW1lb3V0KSB7XG5cdFx0Ly8gY29udHJvbGxlckFzIFZpZXdNb2RlbFxuXHRcdHZhciBhY2NvdW50ID0gdGhpcztcblxuXHRcdGFjY291bnQubG9naW5zID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRhY2NvdW50OiAnZ29vZ2xlJyxcblx0XHRcdFx0bmFtZTogJ0dvb2dsZScsXG5cdFx0XHRcdHVybDogJ2h0dHA6Ly9hY2NvdW50cy5nb29nbGUuY29tJ1xuXHRcdFx0fSwge1xuXHRcdFx0XHRhY2NvdW50OiAndHdpdHRlcicsXG5cdFx0XHRcdG5hbWU6ICdUd2l0dGVyJyxcblx0XHRcdFx0dXJsOiAnaHR0cDovL3R3aXR0ZXIuY29tJ1xuXHRcdFx0fSwge1xuXHRcdFx0XHRhY2NvdW50OiAnZmFjZWJvb2snLFxuXHRcdFx0XHRuYW1lOiAnRmFjZWJvb2snLFxuXHRcdFx0XHR1cmw6ICdodHRwOi8vZmFjZWJvb2suY29tJ1xuXHRcdFx0fSwge1xuXHRcdFx0XHRhY2NvdW50OiAnZ2l0aHViJyxcblx0XHRcdFx0bmFtZTogJ0dpdEh1YicsXG5cdFx0XHRcdHVybDogJ2h0dHA6Ly9naXRodWIuY29tJ1xuXHRcdFx0fVxuXHRcdF07XG5cblx0XHQvKioqXG5cdFx0ICogZnVuY3Rpb24gZ2V0UHJvZmlsZSgpXG5cdFx0ICpcblx0XHQgKiBHZXQgdXNlcidzIHByb2ZpbGUgaW5mb3JtYXRpb24uXG5cdFx0ICovXG5cdFx0YWNjb3VudC5nZXRQcm9maWxlID0gZnVuY3Rpb24oKSB7XG5cblx0XHRcdHVzZXJEYXRhLmdldFVzZXIoZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRhY2NvdW50LnVzZXIgPSBkYXRhO1xuXHRcdFx0XHRhY2NvdW50LmFkbWluaXN0cmF0b3IgPSBhY2NvdW50LnVzZXIuaXNBZG1pbjtcblx0XHRcdFx0YWNjb3VudC5saW5rZWRBY2NvdW50cyA9IFtdO1xuXG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChhY2NvdW50LmxvZ2lucywgZnVuY3Rpb24oYWN0T2JqKSB7XG5cdFx0XHRcdFx0dmFyIGFjdCA9IGFjdE9iai5hY2NvdW50O1xuXG5cdFx0XHRcdFx0aWYgKGFjY291bnQudXNlclthY3RdKSB7XG5cdFx0XHRcdFx0XHRhY2NvdW50LmxpbmtlZEFjY291bnRzLnB1c2goYWN0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdC8qKipcblx0XHQgKiBmdW5jdGlvbiBidG5TYXZlUmVzZXQoKVxuXHRcdCAqXG5cdFx0ICogUmVzZXQgcHJvZmlsZSBzYXZlIGJ1dHRvbiB0byBpbml0aWFsIHN0YXRlXG5cdFx0ICovXG5cdFx0ZnVuY3Rpb24gYnRuU2F2ZVJlc2V0KCkge1xuXHRcdFx0YWNjb3VudC5idG5TYXZlZCA9IGZhbHNlO1xuXHRcdFx0YWNjb3VudC5idG5TYXZlVGV4dCA9ICdTYXZlJztcblx0XHR9XG5cblx0XHRidG5TYXZlUmVzZXQoKTtcblxuXHRcdC8qKipcblx0XHQgKiBmdW5jdGlvbiB1cGRhdGVQcm9maWxlKClcblx0XHQgKlxuXHRcdCAqIFVwZGF0ZSB1c2VyJ3MgcHJvZmlsZSBpbmZvcm1hdGlvbi5cblx0XHQgKi9cblx0XHRhY2NvdW50LnVwZGF0ZVByb2ZpbGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBwcm9maWxlRGF0YSA9IHsgZGlzcGxheU5hbWU6IGFjY291bnQudXNlci5kaXNwbGF5TmFtZSB9O1xuXG5cdFx0XHR1c2VyRGF0YS51cGRhdGVVc2VyKHByb2ZpbGVEYXRhLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0YWNjb3VudC5idG5TYXZlZCA9IHRydWU7XG5cdFx0XHRcdGFjY291bnQuYnRuU2F2ZVRleHQgPSAnU2F2ZWQhJztcblxuXHRcdFx0XHQkdGltZW91dChidG5TYXZlUmVzZXQsIDI1MDApO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdC8qKipcblx0XHQgKiBmdW5jdGlvbiBsaW5rKClcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSBwcm92aWRlciAoc3RyaW5nKVxuXHRcdCAqIExpbmsgdGhpcmQtcGFydHkgcHJvdmlkZXIuXG5cdFx0ICovXG5cdFx0YWNjb3VudC5saW5rID0gZnVuY3Rpb24ocHJvdmlkZXIpIHtcblx0XHRcdCRhdXRoLmxpbmsocHJvdmlkZXIpXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGFjY291bnQuZ2V0UHJvZmlsZSgpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRhbGVydChyZXNwb25zZS5kYXRhLm1lc3NhZ2UpO1xuXHRcdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0LyoqKlxuXHRcdCAqIGZ1bmN0aW9uIHVubGluaygpXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gcHJvdmlkZXIgKHN0cmluZylcblx0XHQgKiBVbmxpbmsgdGhpcmQtcGFydHkgcHJvdmlkZXIuXG5cdFx0ICovXG5cdFx0YWNjb3VudC51bmxpbmsgPSBmdW5jdGlvbihwcm92aWRlcikge1xuXHRcdFx0JGF1dGgudW5saW5rKHByb3ZpZGVyKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRhY2NvdW50LmdldFByb2ZpbGUoKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0YWxlcnQocmVzcG9uc2UuZGF0YSA/IHJlc3BvbnNlLmRhdGEubWVzc2FnZSA6ICdDb3VsZCBub3QgdW5saW5rICcgKyBwcm92aWRlciArICcgYWNjb3VudCcpO1xuXHRcdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0YWNjb3VudC5nZXRQcm9maWxlKCk7XG5cdH1cbn0pKCk7IiwiLy8gXCJnbG9iYWxcIiBvYmplY3QgdG8gc2hhcmUgYmV0d2VlbiBjb250cm9sbGVyc1xuKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuZmFjdG9yeSgnR2xvYmFsT2JqJywgR2xvYmFsT2JqKTtcblxuXHRmdW5jdGlvbiBHbG9iYWxPYmooKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGdyZWV0aW5nOiAnSGVsbG8nXG5cdFx0fTtcblx0fVxufSkoKTsiLCJhbmd1bGFyLm1vZHVsZSgnbXlBcHAnKVxuLy8gbWVkaWEgcXVlcnkgY29uc3RhbnRzXG5cdC5jb25zdGFudCgnTVEnLCB7XG5cdFx0U01BTEw6ICcobWF4LXdpZHRoOiA3NjdweCknLFxuXHRcdExBUkdFOiAnKG1pbi13aWR0aDogNzY4cHgpJ1xuXHR9KTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5jb25maWcoYXV0aENvbmZpZylcblx0XHQucnVuKGF1dGhSdW4pO1xuXG5cdGF1dGhDb25maWcuJGluamVjdCA9IFsnJGF1dGhQcm92aWRlciddO1xuXG5cdGZ1bmN0aW9uIGF1dGhDb25maWcoJGF1dGhQcm92aWRlcikge1xuXHRcdCRhdXRoUHJvdmlkZXIubG9naW5VcmwgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgwL2F1dGgvbG9naW4nO1xuXHRcdCRhdXRoUHJvdmlkZXIuc2lnbnVwVXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9hdXRoL3NpZ251cCc7XG5cblx0XHQkYXV0aFByb3ZpZGVyLmZhY2Vib29rKHtcblx0XHRcdGNsaWVudElkOiAnMzQzNzg5MjQ5MTQ2OTY2J1xuXHRcdH0pO1xuXG5cdFx0JGF1dGhQcm92aWRlci5nb29nbGUoe1xuXHRcdFx0Y2xpZW50SWQ6ICc0Nzk2NTEzNjczMzAtdHJ2ZjhlZm9vNDE1aWUwdXNmaG00aTU5NDEwdmszajkuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20nXG5cdFx0fSk7XG5cblx0XHQkYXV0aFByb3ZpZGVyLnR3aXR0ZXIoe1xuXHRcdFx0dXJsOiAnL2F1dGgvdHdpdHRlcidcblx0XHR9KTtcblxuXHRcdCRhdXRoUHJvdmlkZXIuZ2l0aHViKHtcblx0XHRcdGNsaWVudElkOiAnODA5NmU5NWMyZWJhMzNiODFhZGInXG5cdFx0fSk7XG5cdH1cblxuXHRhdXRoUnVuLiRpbmplY3QgPSBbJyRyb290U2NvcGUnLCAnJGxvY2F0aW9uJywgJyRhdXRoJ107XG5cblx0ZnVuY3Rpb24gYXV0aFJ1bigkcm9vdFNjb3BlLCAkbG9jYXRpb24sICRhdXRoKSB7XG5cdFx0JHJvb3RTY29wZS4kb24oJyRyb3V0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIG5leHQsIGN1cnJlbnQpIHtcblx0XHRcdGlmIChuZXh0ICYmIG5leHQuJCRyb3V0ZSAmJiBuZXh0LiQkcm91dGUuc2VjdXJlKSB7XG5cdFx0XHRcdGlmICghJGF1dGguaXNBdXRoZW50aWNhdGVkKCkpIHtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRldmFsQXN5bmMoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHQkbG9jYXRpb24ucGF0aCgnL2xvZ2luJyk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG59KSgpOyIsIi8vIHJvdXRlc1xuKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ215QXBwJylcblx0XHQuY29uZmlnKGFwcFJvdXRlcyk7XG5cblx0YXBwUm91dGVzLiRpbmplY3QgPSBbJyRyb3V0ZVByb3ZpZGVyJywgJyRsb2NhdGlvblByb3ZpZGVyJ107XG5cblx0ZnVuY3Rpb24gYXBwUm91dGVzKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuXHRcdCRyb3V0ZVByb3ZpZGVyXG5cdFx0XHQud2hlbignLycsIHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICduZy1hcHAvaG9tZS9Ib21lLnZpZXcuaHRtbCcsXG5cdFx0XHRcdHNlY3VyZTogdHJ1ZVxuXHRcdFx0fSlcblx0XHRcdC53aGVuKCcvbG9naW4nLCB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnbmctYXBwL2xvZ2luL0xvZ2luLnZpZXcuaHRtbCdcblx0XHRcdH0pXG5cdFx0XHQud2hlbignL2FjY291bnQnLCB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnbmctYXBwL2FjY291bnQvQWNjb3VudC52aWV3Lmh0bWwnLFxuXHRcdFx0XHRzZWN1cmU6IHRydWVcblx0XHRcdH0pXG5cdFx0XHQud2hlbignL3N1YnBhZ2UnLCB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnbmctYXBwL3N1Yi9TdWIudmlldy5odG1sJyxcblx0XHRcdFx0c2VjdXJlOiB0cnVlXG5cdFx0XHR9KVxuXHRcdFx0Lm90aGVyd2lzZSh7XG5cdFx0XHRcdHJlZGlyZWN0VG86ICcvJ1xuXHRcdFx0fSk7XG5cdFx0JGxvY2F0aW9uUHJvdmlkZXJcblx0XHRcdC5odG1sNU1vZGUoe1xuXHRcdFx0XHRlbmFibGVkOiB0cnVlXG5cdFx0XHR9KVxuXHRcdFx0Lmhhc2hQcmVmaXgoJyEnKTtcblx0fVxufSkoKTsiLCIvLyBmZXRjaCBsb2NhbCBKU09OIGRhdGFcbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LnNlcnZpY2UoJ2xvY2FsRGF0YScsIGxvY2FsRGF0YSk7XG5cblx0bG9jYWxEYXRhLiRpbmplY3QgPSBbJyRodHRwJ107XG5cblx0ZnVuY3Rpb24gbG9jYWxEYXRhKCRodHRwKSB7XG5cdFx0dGhpcy5nZXRKU09OID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdHJldHVybiAkaHR0cFxuXHRcdFx0XHQuZ2V0KCcvbmctYXBwL2RhdGEvZGF0YS5qc29uJylcblx0XHRcdFx0LnN1Y2Nlc3MoY2FsbGJhY2spXG5cdFx0XHRcdC5lcnJvcihmdW5jdGlvbihlcnJvcikgeyBhbGVydChlcnJvci5tZXNzYWdlKTsgfSk7XG5cdFx0fVxuXHR9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBhbmd1bGFyTWVkaWFDaGVjayA9IGFuZ3VsYXIubW9kdWxlKCdtZWRpYUNoZWNrJywgW10pO1xuXG5cdGFuZ3VsYXJNZWRpYUNoZWNrLnNlcnZpY2UoJ21lZGlhQ2hlY2snLCBbJyR3aW5kb3cnLCAnJHRpbWVvdXQnLCBmdW5jdGlvbiAoJHdpbmRvdywgJHRpbWVvdXQpIHtcblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXHRcdFx0dmFyICRzY29wZSA9IG9wdGlvbnNbJ3Njb3BlJ10sXG5cdFx0XHRcdHF1ZXJ5ID0gb3B0aW9uc1snbXEnXSxcblx0XHRcdFx0ZGVib3VuY2UgPSBvcHRpb25zWydkZWJvdW5jZSddLFxuXHRcdFx0XHQkd2luID0gYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLFxuXHRcdFx0XHRicmVha3BvaW50cyxcblx0XHRcdFx0Y3JlYXRlTGlzdGVuZXIgPSB2b2lkIDAsXG5cdFx0XHRcdGhhc01hdGNoTWVkaWEgPSAkd2luZG93Lm1hdGNoTWVkaWEgIT09IHVuZGVmaW5lZCAmJiAhISR3aW5kb3cubWF0Y2hNZWRpYSgnIScpLmFkZExpc3RlbmVyLFxuXHRcdFx0XHRtcUxpc3RMaXN0ZW5lcixcblx0XHRcdFx0bW1MaXN0ZW5lcixcblx0XHRcdFx0ZGVib3VuY2VSZXNpemUsXG5cdFx0XHRcdG1xID0gdm9pZCAwLFxuXHRcdFx0XHRtcUNoYW5nZSA9IHZvaWQgMCxcblx0XHRcdFx0ZGVib3VuY2VTcGVlZCA9ICEhZGVib3VuY2UgPyBkZWJvdW5jZSA6IDI1MDtcblxuXHRcdFx0aWYgKGhhc01hdGNoTWVkaWEpIHtcblx0XHRcdFx0bXFDaGFuZ2UgPSBmdW5jdGlvbiAobXEpIHtcblx0XHRcdFx0XHRpZiAobXEubWF0Y2hlcyAmJiB0eXBlb2Ygb3B0aW9ucy5lbnRlciA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0b3B0aW9ucy5lbnRlcihtcSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5leGl0ID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdG9wdGlvbnMuZXhpdChtcSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5jaGFuZ2UgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdG9wdGlvbnMuY2hhbmdlKG1xKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y3JlYXRlTGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0bXEgPSAkd2luZG93Lm1hdGNoTWVkaWEocXVlcnkpO1xuXHRcdFx0XHRcdG1xTGlzdExpc3RlbmVyID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIG1xQ2hhbmdlKG1xKVxuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRtcS5hZGRMaXN0ZW5lcihtcUxpc3RMaXN0ZW5lcik7XG5cblx0XHRcdFx0XHQvLyBiaW5kIHRvIHRoZSBvcmllbnRhdGlvbmNoYW5nZSBldmVudCBhbmQgZmlyZSBtcUNoYW5nZVxuXHRcdFx0XHRcdCR3aW4uYmluZCgnb3JpZW50YXRpb25jaGFuZ2UnLCBtcUxpc3RMaXN0ZW5lcik7XG5cblx0XHRcdFx0XHQvLyBjbGVhbnVwIGxpc3RlbmVycyB3aGVuICRzY29wZSBpcyAkZGVzdHJveWVkXG5cdFx0XHRcdFx0JHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRtcS5yZW1vdmVMaXN0ZW5lcihtcUxpc3RMaXN0ZW5lcik7XG5cdFx0XHRcdFx0XHQkd2luLnVuYmluZCgnb3JpZW50YXRpb25jaGFuZ2UnLCBtcUxpc3RMaXN0ZW5lcik7XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gbXFDaGFuZ2UobXEpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHJldHVybiBjcmVhdGVMaXN0ZW5lcigpO1xuXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRicmVha3BvaW50cyA9IHt9O1xuXG5cdFx0XHRcdG1xQ2hhbmdlID0gZnVuY3Rpb24gKG1xKSB7XG5cdFx0XHRcdFx0aWYgKG1xLm1hdGNoZXMpIHtcblx0XHRcdFx0XHRcdGlmICghIWJyZWFrcG9pbnRzW3F1ZXJ5XSA9PT0gZmFsc2UgJiYgKHR5cGVvZiBvcHRpb25zLmVudGVyID09PSAnZnVuY3Rpb24nKSkge1xuXHRcdFx0XHRcdFx0XHRvcHRpb25zLmVudGVyKG1xKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0aWYgKGJyZWFrcG9pbnRzW3F1ZXJ5XSA9PT0gdHJ1ZSB8fCBicmVha3BvaW50c1txdWVyeV0gPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMuZXhpdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHRcdG9wdGlvbnMuZXhpdChtcSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoKG1xLm1hdGNoZXMgJiYgKCFicmVha3BvaW50c1txdWVyeV0pIHx8ICghbXEubWF0Y2hlcyAmJiAoYnJlYWtwb2ludHNbcXVlcnldID09PSB0cnVlIHx8IGJyZWFrcG9pbnRzW3F1ZXJ5XSA9PSBudWxsKSkpKSB7XG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMuY2hhbmdlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdG9wdGlvbnMuY2hhbmdlKG1xKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gYnJlYWtwb2ludHNbcXVlcnldID0gbXEubWF0Y2hlcztcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgY29udmVydEVtVG9QeCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdFx0XHRcdHZhciBlbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuXHRcdFx0XHRcdGVtRWxlbWVudC5zdHlsZS53aWR0aCA9ICcxZW0nO1xuXHRcdFx0XHRcdGVtRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbUVsZW1lbnQpO1xuXHRcdFx0XHRcdHB4ID0gdmFsdWUgKiBlbUVsZW1lbnQub2Zmc2V0V2lkdGg7XG5cdFx0XHRcdFx0ZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChlbUVsZW1lbnQpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIHB4O1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciBnZXRQWFZhbHVlID0gZnVuY3Rpb24gKHdpZHRoLCB1bml0KSB7XG5cdFx0XHRcdFx0dmFyIHZhbHVlO1xuXHRcdFx0XHRcdHZhbHVlID0gdm9pZCAwO1xuXHRcdFx0XHRcdHN3aXRjaCAodW5pdCkge1xuXHRcdFx0XHRcdFx0Y2FzZSAnZW0nOlxuXHRcdFx0XHRcdFx0XHR2YWx1ZSA9IGNvbnZlcnRFbVRvUHgod2lkdGgpO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdHZhbHVlID0gd2lkdGg7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRicmVha3BvaW50c1txdWVyeV0gPSBudWxsO1xuXG5cdFx0XHRcdG1tTGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dmFyIHBhcnRzID0gcXVlcnkubWF0Y2goL1xcKCguKiktLio6XFxzKihbXFxkXFwuXSopKC4qKVxcKS8pLFxuXHRcdFx0XHRcdFx0Y29uc3RyYWludCA9IHBhcnRzWzFdLFxuXHRcdFx0XHRcdFx0dmFsdWUgPSBnZXRQWFZhbHVlKHBhcnNlSW50KHBhcnRzWzJdLCAxMCksIHBhcnRzWzNdKSxcblx0XHRcdFx0XHRcdGZha2VNYXRjaE1lZGlhID0ge30sXG5cdFx0XHRcdFx0XHR3aW5kb3dXaWR0aCA9ICR3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG5cblx0XHRcdFx0XHRmYWtlTWF0Y2hNZWRpYS5tYXRjaGVzID0gY29uc3RyYWludCA9PT0gJ21heCcgJiYgdmFsdWUgPiB3aW5kb3dXaWR0aCB8fCBjb25zdHJhaW50ID09PSAnbWluJyAmJiB2YWx1ZSA8IHdpbmRvd1dpZHRoO1xuXG5cdFx0XHRcdFx0cmV0dXJuIG1xQ2hhbmdlKGZha2VNYXRjaE1lZGlhKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgZmFrZU1hdGNoTWVkaWFSZXNpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KGRlYm91bmNlUmVzaXplKTtcblx0XHRcdFx0XHRkZWJvdW5jZVJlc2l6ZSA9ICR0aW1lb3V0KG1tTGlzdGVuZXIsIGRlYm91bmNlU3BlZWQpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCR3aW4uYmluZCgncmVzaXplJywgZmFrZU1hdGNoTWVkaWFSZXNpemUpO1xuXG5cdFx0XHRcdCRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCR3aW4udW5iaW5kKCdyZXNpemUnLCBmYWtlTWF0Y2hNZWRpYVJlc2l6ZSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHJldHVybiBtbUxpc3RlbmVyKCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fV0pO1xufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5maWx0ZXIoJ3RydXN0QXNIVE1MJywgdHJ1c3RBc0hUTUwpO1xuXG5cdHRydXN0QXNIVE1MLiRpbmplY3QgPSBbJyRzY2UnXTtcblxuXHRmdW5jdGlvbiB0cnVzdEFzSFRNTCgkc2NlKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uICh0ZXh0KSB7XG5cdFx0XHRyZXR1cm4gJHNjZS50cnVzdEFzSHRtbCh0ZXh0KTtcblx0XHR9O1xuXHR9XG59KSgpOyIsIi8vIFVzZXIgZGlyZWN0aXZlXG4oZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5kaXJlY3RpdmUoJ3VzZXInLCB1c2VyKTtcblxuXHR1c2VyLiRpbmplY3QgPSBbJ3VzZXJEYXRhJywgJyRhdXRoJ107XG5cblx0ZnVuY3Rpb24gdXNlcih1c2VyRGF0YSwgJGF1dGgpIHtcblxuXHRcdGZ1bmN0aW9uIHVzZXJDdHJsKCkge1xuXHRcdFx0Ly8gY29udHJvbGxlckFzIFZpZXdNb2RlbFxuXHRcdFx0dmFyIHUgPSB0aGlzO1xuXG5cdFx0XHR1LmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gJGF1dGguaXNBdXRoZW50aWNhdGVkKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR1c2VyRGF0YS5nZXRVc2VyKGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdFx0dS51c2VyID0gdXNlcjtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRcdGNvbnRyb2xsZXI6IHVzZXJDdHJsLFxuXHRcdFx0Y29udHJvbGxlckFzOiAndScsXG5cdFx0XHR0ZW1wbGF0ZTogJzxkaXYgbmctaWY9XCJ1LmlzQXV0aGVudGljYXRlZCgpICYmICEhdS51c2VyXCI+PGltZyBuZy1pZj1cIiEhdS51c2VyLnBpY3R1cmVcIiBuZy1zcmM9XCJ7e3UudXNlci5waWN0dXJlfX1cIiBjbGFzcz1cImltZy11c2VyUGljdHVyZVwiIC8+IHt7dS51c2VyLmRpc3BsYXlOYW1lfX08L2Rpdj4nXG5cdFx0fTtcblx0fVxufSkoKTsiLCIvLyBmZXRjaCB1c2VyIGRhdGFcbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LnNlcnZpY2UoJ3VzZXJEYXRhJywgdXNlckRhdGEpO1xuXG5cdHVzZXJEYXRhLiRpbmplY3QgPSBbJyRodHRwJ107XG5cblx0ZnVuY3Rpb24gdXNlckRhdGEoJGh0dHApIHtcblx0XHR0aGlzLmdldFVzZXIgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHRcdFx0cmV0dXJuICRodHRwXG5cdFx0XHRcdC5nZXQoJy9hcGkvbWUnKVxuXHRcdFx0XHQuc3VjY2VzcyhjYWxsYmFjaylcblx0XHRcdFx0LmVycm9yKGZ1bmN0aW9uKGVycm9yKSB7IGFsZXJ0KGVycm9yLm1lc3NhZ2UpOyB9KTtcblx0XHR9O1xuXHRcdHRoaXMudXBkYXRlVXNlciA9IGZ1bmN0aW9uKHByb2ZpbGVEYXRhLCBjYWxsYmFjaykge1xuXHRcdFx0cmV0dXJuICRodHRwXG5cdFx0XHRcdC5wdXQoJy9hcGkvbWUnLCBwcm9maWxlRGF0YSlcblx0XHRcdFx0LnN1Y2Nlc3MoY2FsbGJhY2spXG5cdFx0XHRcdC5lcnJvcihmdW5jdGlvbihlcnJvcikgeyBhbGVydChlcnJvci5tZXNzYWdlKTsgfSk7XG5cdFx0fTtcblx0fVxufSkoKTsiLCIvLyBGb3IgZXZlbnRzIGJhc2VkIG9uIHZpZXdwb3J0IHNpemUgLSB1cGRhdGVzIGFzIHZpZXdwb3J0IGlzIHJlc2l6ZWRcbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LmRpcmVjdGl2ZSgndmlld1N3aXRjaCcsIHZpZXdTd2l0Y2gpO1xuXG5cdHZpZXdTd2l0Y2guJGluamVjdCA9IFsnbWVkaWFDaGVjaycsICdNUScsICckdGltZW91dCddO1xuXG5cdGZ1bmN0aW9uIHZpZXdTd2l0Y2gobWVkaWFDaGVjaywgTVEsICR0aW1lb3V0KSB7XG5cblx0XHR2aWV3U3dpdGNoQ3RybC4kaW5qZWN0ID0gWyckc2NvcGUnXTtcblx0XHRcblx0XHRmdW5jdGlvbiB2aWV3U3dpdGNoQ3RybCgkc2NvcGUpIHtcblx0XHRcdC8vIGNvbnRyb2xsZXJBcyBWaWV3TW9kZWxcblx0XHRcdHZhciB2cyA9IHRoaXM7XG5cblx0XHRcdG1lZGlhQ2hlY2suaW5pdCh7XG5cdFx0XHRcdHNjb3BlOiAkc2NvcGUsXG5cdFx0XHRcdG1xOiBNUS5TTUFMTCxcblx0XHRcdFx0ZW50ZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHR2cy52aWV3Zm9ybWF0ID0gJ3NtYWxsJztcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSxcblx0XHRcdFx0ZXhpdDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdHZzLnZpZXdmb3JtYXQgPSAnbGFyZ2UnO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0XHRjb250cm9sbGVyOiB2aWV3U3dpdGNoQ3RybCxcblx0XHRcdGNvbnRyb2xsZXJBczogJ3ZzJyxcblx0XHRcdC8vIGJpbmRUb0NvbnRyb2xsZXI6IHRydWUgPC0tIHVzZSBpZiBpc29sYXRlIHNjb3BlXG5cdFx0fTtcblx0fVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblx0J3VzZSBzdHJpY3QnO1xyXG5cclxuXHRhbmd1bGFyXHJcblx0XHQubW9kdWxlKCdteUFwcCcpXHJcblx0XHQuY29udHJvbGxlcignSGVhZGVyQ3RybCcsIGhlYWRlckN0cmwpO1xyXG5cclxuXHRoZWFkZXJDdHJsLiRpbmplY3QgPSBbJyRzY29wZScsICckbG9jYXRpb24nLCAnbG9jYWxEYXRhJywgJyRhdXRoJ107XHJcblxyXG5cdGZ1bmN0aW9uIGhlYWRlckN0cmwoJHNjb3BlLCAkbG9jYXRpb24sIGxvY2FsRGF0YSwgJGF1dGgpIHtcclxuXHRcdC8vIGNvbnRyb2xsZXJBcyBWaWV3TW9kZWxcclxuXHRcdHZhciBoZWFkZXIgPSB0aGlzO1xyXG5cclxuXHRcdC8qKipcclxuXHRcdCAqIGZ1bmN0aW9uIGxvZ291dCgpXHJcblx0XHQgKlxyXG5cdFx0ICogTG9nIHRoZSB1c2VyIG91dCBvZiB3aGF0ZXZlciBhdXRoZW50aWNhdGlvbiB0aGV5J3ZlIHNpZ25lZCBpbiB3aXRoXHJcblx0XHQgKi9cclxuXHRcdGhlYWRlci5sb2dvdXQgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0JGF1dGgubG9nb3V0KCcvbG9naW4nKTtcclxuXHRcdH07XHJcblxyXG5cdFx0LyoqKlxyXG5cdFx0ICogZnVuY3Rpb24gaXNBdXRoZW50aWNhdGVkKClcclxuXHRcdCAqXHJcblx0XHQgKiBJcyB0aGUgdXNlciBsb2dnZWQgaW4/XHJcblx0XHQgKlxyXG5cdFx0ICogQHJldHVybnMge2Jvb2xlYW59XHJcblx0XHQgKi9cclxuXHRcdGhlYWRlci5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuICRhdXRoLmlzQXV0aGVudGljYXRlZCgpO1xyXG5cdFx0fTtcclxuXHJcblx0XHQvKioqXHJcblx0XHQgKiBmdW5jdGlvbiBnZXRKU09OKClcclxuXHRcdCAqXHJcblx0XHQgKiBHZXQgbG9jYWwgZGF0YSBmcm9tIHN0YXRpYyBKU09OXHJcblx0XHQgKlxyXG5cdFx0ICogQHBhcmFtIGZ1bmN0aW9uIChzdWNjZXNzIGNhbGxiYWNrKVxyXG5cdFx0ICogQHJldHVybnMgeyp9XHJcblx0XHQgKi9cclxuXHRcdGxvY2FsRGF0YS5nZXRKU09OKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0aGVhZGVyLmpzb24gPSBkYXRhO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0LyoqKlxyXG5cdFx0ICogZnVuY3Rpb24gaW5kZXhJc0FjdGl2ZSgpXHJcblx0XHQgKlxyXG5cdFx0ICogQXBwbHkgY2xhc3MgdG8gY3VycmVudGx5IGFjdGl2ZSBuYXYgaXRlbSB3aGVuICcvJyBpbmRleFxyXG5cdFx0ICpcclxuXHRcdCAqIEBwYXJhbSBwYXRoXHJcblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuXHRcdCAqL1xyXG5cdFx0aGVhZGVyLmluZGV4SXNBY3RpdmUgPSBmdW5jdGlvbihwYXRoKSB7XHJcblx0XHRcdC8vIHBhdGggc2hvdWxkIGJlICcvJ1xyXG5cdFx0XHRyZXR1cm4gJGxvY2F0aW9uLnBhdGgoKSA9PT0gcGF0aDtcclxuXHRcdH07XHJcblxyXG5cdFx0LyoqKlxyXG5cdFx0ICogZnVuY3Rpb24gbmF2SXNBY3RpdmUoKVxyXG5cdFx0ICpcclxuXHRcdCAqIEFwcGx5IGNsYXNzIHRvIGN1cnJlbnRseSBhY3RpdmUgbmF2IGl0ZW1cclxuXHRcdCAqXHJcblx0XHQgKiBAcGFyYW0gcGF0aFxyXG5cdFx0ICogQHJldHVybnMge2Jvb2xlYW59XHJcblx0XHQgKi9cclxuXHRcdGhlYWRlci5uYXZJc0FjdGl2ZSA9IGZ1bmN0aW9uIChwYXRoKSB7XHJcblx0XHRcdHJldHVybiAkbG9jYXRpb24ucGF0aCgpLnN1YnN0cigwLCBwYXRoLmxlbmd0aCkgPT09IHBhdGg7XHJcblx0XHR9O1xyXG5cclxuXHRcdC8qKipcclxuXHRcdCAqIGZ1bmN0aW9uICRvbignJGxvY2F0aW9uQ2hhbmdlU3VjY2VzcycpXHJcblx0XHQgKlxyXG5cdFx0ICogQXBwbHkgYm9keSBjbGFzcyBkZXBlbmRpbmcgb24gd2hhdCBwYWdlIHlvdSdyZSBvblxyXG5cdFx0ICogVE9ETzogY29uc2lkZXIgbW92aW5nIHRvIGEgZmFjdG9yeVxyXG5cdFx0ICovXHJcblx0XHQkc2NvcGUuJG9uKCckbG9jYXRpb25DaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24oZXZlbnQsIG5ld1VybCwgb2xkVXJsKSB7XHJcblx0XHRcdHZhciBnZXRCb2R5Q2xhc3MgPSBmdW5jdGlvbiAodXJsKSB7XHJcblx0XHRcdFx0XHR2YXIgYm9keUNsYXNzID0gdXJsLnN1YnN0cih1cmwubGFzdEluZGV4T2YoJy8nKSArIDEpO1xyXG5cclxuXHRcdFx0XHRcdHJldHVybiAhIWJvZHlDbGFzcyA/ICdwYWdlLScgKyBib2R5Q2xhc3MgOiAncGFnZS1ob21lJztcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9sZEJvZHlDbGFzcyA9IGdldEJvZHlDbGFzcyhvbGRVcmwpLFxyXG5cdFx0XHRcdG5ld0JvZHlDbGFzcyA9IGdldEJvZHlDbGFzcyhuZXdVcmwpO1xyXG5cclxuXHRcdFx0YW5ndWxhci5lbGVtZW50KCdib2R5JylcclxuXHRcdFx0XHQucmVtb3ZlQ2xhc3Mob2xkQm9keUNsYXNzKVxyXG5cdFx0XHRcdC5hZGRDbGFzcyhuZXdCb2R5Q2xhc3MpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnbXlBcHAnKVxuXHRcdC5kaXJlY3RpdmUoJ25hdkNvbnRyb2wnLCBuYXZDb250cm9sKTtcblxuXHRuYXZDb250cm9sLiRpbmplY3QgPSBbJ21lZGlhQ2hlY2snLCAnTVEnLCAnJHRpbWVvdXQnXTtcblxuXHQvKipcblx0ICogZnVuY3Rpb24gbmF2Q29udHJvbCgpXG5cdCAqXG5cdCAqIEBwYXJhbSBtZWRpYUNoZWNrXG5cdCAqIEBwYXJhbSBNUVxuXHQgKiBAcGFyYW0gJHRpbWVvdXRcblx0ICogQHJldHVybnMge3tyZXN0cmljdDogc3RyaW5nLCBsaW5rOiBuYXZDb250cm9sTGlua319XG5cdCAqL1xuXHRmdW5jdGlvbiBuYXZDb250cm9sKG1lZGlhQ2hlY2ssIE1RLCAkdGltZW91dCkge1xuXG5cdFx0bmF2Q29udHJvbExpbmsuJGluamVjdCA9IFsnJHNjb3BlJywgJyRlbGVtZW50JywgJyRhdHRycyddO1xuXG5cdFx0LyoqXG5cdFx0ICogZnVuY3Rpb24gbmF2Q29udHJvbExpbmsoKVxuXHRcdCAqXG5cdFx0ICogQHBhcmFtICRzY29wZVxuXHRcdCAqIEBwYXJhbSAkZWxlbWVudFxuXHRcdCAqIEBwYXJhbSAkYXR0cnNcblx0XHQgKlxuXHRcdCAqIG5hdkNvbnRyb2wgZGlyZWN0aXZlIGxpbmsgZnVuY3Rpb25cblx0XHQgKi9cblx0XHRmdW5jdGlvbiBuYXZDb250cm9sTGluaygkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMpIHtcblx0XHRcdHZhciBib2R5ID0gYW5ndWxhci5lbGVtZW50KCdib2R5JyksXG5cdFx0XHRcdG9wZW5OYXYgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Ym9keVxuXHRcdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCduYXYtY2xvc2VkJylcblx0XHRcdFx0XHRcdC5hZGRDbGFzcygnbmF2LW9wZW4nKTtcblxuXHRcdFx0XHRcdCRzY29wZS5uYXZPcGVuID0gdHJ1ZTtcblx0XHRcdFx0fSxcblx0XHRcdFx0Y2xvc2VOYXYgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Ym9keVxuXHRcdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCduYXYtb3BlbicpXG5cdFx0XHRcdFx0XHQuYWRkQ2xhc3MoJ25hdi1jbG9zZWQnKTtcblxuXHRcdFx0XHRcdCRzY29wZS5uYXZPcGVuID0gZmFsc2U7XG5cdFx0XHRcdH07XG5cblx0XHRcdG1lZGlhQ2hlY2suaW5pdCh7XG5cdFx0XHRcdHNjb3BlOiAkc2NvcGUsXG5cdFx0XHRcdG1xOiBNUS5TTUFMTCxcblx0XHRcdFx0ZW50ZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRjbG9zZU5hdigpO1xuXG5cdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLnRvZ2dsZU5hdiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGJvZHkuaGFzQ2xhc3MoJ25hdi1jbG9zZWQnKSkge1xuXHRcdFx0XHRcdFx0XHRcdG9wZW5OYXYoKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRjbG9zZU5hdigpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0JHNjb3BlLiRvbignJGxvY2F0aW9uQ2hhbmdlU3VjY2VzcycsIGNsb3NlTmF2KTtcblx0XHRcdFx0fSxcblx0XHRcdFx0ZXhpdDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdCRzY29wZS50b2dnbGVOYXYgPSBudWxsO1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0Ym9keS5yZW1vdmVDbGFzcygnbmF2LWNsb3NlZCBuYXYtb3BlbicpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0XHRsaW5rOiBuYXZDb250cm9sTGlua1xuXHRcdH07XG5cdH1cblxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblx0J3VzZSBzdHJpY3QnO1xyXG5cclxuXHRhbmd1bGFyXHJcblx0XHQubW9kdWxlKCdteUFwcCcpXHJcblx0XHQuY29udHJvbGxlcignSG9tZUN0cmwnLCBIb21lQ3RybCk7XHJcblxyXG5cdEhvbWVDdHJsLiRpbmplY3QgPSBbJ0dsb2JhbE9iaicsICckcm9vdFNjb3BlJywgJyRhdXRoJywgJ2xvY2FsRGF0YSddO1xyXG5cclxuXHRmdW5jdGlvbiBIb21lQ3RybChHbG9iYWxPYmosICRyb290U2NvcGUsICRhdXRoLCBsb2NhbERhdGEpIHtcclxuXHRcdC8vIGNvbnRyb2xsZXJBcyBWaWV3TW9kZWxcclxuXHRcdHZhciBob21lID0gdGhpcztcclxuXHJcblx0XHQvKioqXHJcblx0XHQgKiBpc0F1dGhlbnRpY2F0ZWQoKVxyXG5cdFx0ICpcclxuXHRcdCAqIERldGVybWluZXMgaWYgdGhlIHVzZXIgaXMgbG9nZ2VkIGluXHJcblx0XHQgKlxyXG5cdFx0ICogQHJldHVybnMgeyp9XHJcblx0XHQgKi9cclxuXHRcdGhvbWUuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiAkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKTtcclxuXHRcdH07XHJcblxyXG5cdFx0LyoqKlxyXG5cdFx0ICogZ2V0SlNPTigpXHJcblx0XHQgKlxyXG5cdFx0ICogR2V0cyBsb2NhbCBKU09OIGRhdGFcclxuXHRcdCAqXHJcblx0XHQgKiBAcmV0dXJucyBkYXRhIHJlc3BvbnNlLCBleGVjdXRlcyBzdWNjZXNzIGNhbGxiYWNrIE9SIHRocm93cyBlcnJvclxyXG5cdFx0ICovXHJcblx0XHRsb2NhbERhdGEuZ2V0SlNPTihmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdGhvbWUubG9jYWxEYXRhID0gZGF0YTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdGhvbWUudXNlciA9ICRyb290U2NvcGUudXNlcjtcclxuXHJcblx0XHQvLyBwdXQgZ2xvYmFsIHZhcmlhYmxlcyBpbiBzY29wZVxyXG5cdFx0aG9tZS5nbG9iYWwgPSBHbG9iYWxPYmo7XHJcblxyXG5cdFx0Ly8gc2ltcGxlIGRhdGEgYmluZGluZyBleGFtcGxlXHJcblx0XHRob21lLm5hbWUgPSAnVmlzaXRvcic7XHJcblxyXG5cdFx0aG9tZS5zdHJpbmdPZkhUTUwgPSAnPHN0cm9uZz5Tb21lIGJvbGQgdGV4dDwvc3Ryb25nPiBib3VuZCBhcyBIVE1MIHdpdGggYSA8YSBocmVmPVwiI1wiPmxpbms8L2E+ISc7XHJcblx0fVxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdteUFwcCcpXG5cdFx0LmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIExvZ2luQ3RybCk7XG5cblx0TG9naW5DdHJsLiRpbmplY3QgPSBbJ0dsb2JhbE9iaicsICckYXV0aCcsICckcm9vdFNjb3BlJywgJ3VzZXJEYXRhJywgJyR3aW5kb3cnXTtcblxuXHRmdW5jdGlvbiBMb2dpbkN0cmwoR2xvYmFsT2JqLCAkYXV0aCwgJHJvb3RTY29wZSwgdXNlckRhdGEsICR3aW5kb3cpIHtcblx0XHQvLyBjb250cm9sbGVyQXMgVmlld01vZGVsXG5cdFx0dmFyIGxvZ2luID0gdGhpcztcblxuXHRcdC8vIHB1dCBnbG9iYWwgdmFyaWFibGVzIGluIHNjb3BlXG5cdFx0bG9naW4uZ2xvYmFsID0gR2xvYmFsT2JqO1xuXG5cdFx0LyoqKlxuXHRcdCAqIGZ1bmN0aW9uIGF1dGhlbnRpY2F0ZSgpXG5cdFx0ICpcblx0XHQgKiBBdXRoZW50aWNhdGUgdGhlIHVzZXIgdmlhIHRoZSBwcm92aWRlciAoVHdpdHRlciwgRmFjZWJvb2ssIGV0Yy4pXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0gcHJvdmlkZXJcblx0XHQgKi9cblx0XHRsb2dpbi5hdXRoZW50aWNhdGUgPSBmdW5jdGlvbihwcm92aWRlcikge1xuXHRcdFx0JGF1dGguYXV0aGVudGljYXRlKHByb3ZpZGVyKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdC8vIHNpZ25lZCBpblxuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==