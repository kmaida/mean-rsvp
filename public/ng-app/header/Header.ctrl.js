(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('HeaderCtrl', headerCtrl);

	headerCtrl.$inject = ['$scope', '$location', 'localData', '$auth', 'userData'];

	function headerCtrl($scope, $location, localData, $auth, userData) {
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
		 * function getUser()
		 *
		 * Check if the user is an administrator
		 */
		userData.getUser(function(user) {
			header.adminUser = user.isAdmin;
		});

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