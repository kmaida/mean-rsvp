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