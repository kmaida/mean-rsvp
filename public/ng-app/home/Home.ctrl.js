(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('HomeCtrl', HomeCtrl);

	HomeCtrl.$inject = ['GlobalObj', 'JSONData', '$window', '$rootScope', '$auth', 'userData'];

	function HomeCtrl(GlobalObj, JSONData, $window, $rootScope, $auth, userData) {
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

		home.user = $rootScope.user;

		// put global variables in scope
		home.global = GlobalObj;

		// simple data binding example
		home.name = 'Visitor';

		home.stringOfHTML = '<strong>Some bold text</strong> bound as HTML with a <a href="#">link</a>!';
	}
})();