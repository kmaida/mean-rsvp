(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('HomeCtrl', HomeCtrl);

	HomeCtrl.$inject = ['$auth', 'localData'];

	function HomeCtrl($auth, localData) {
		// controllerAs ViewModel
		var home = this;

		/**
		 * Determines if the user is authenticated
		 *
		 * @returns {boolean}
		 */
		home.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		/**
		 * Gets local JSON data
		 *
		 * @returns {*}
		 */
		localData.getJSON(function(data) {
			home.localData = data;
		});

		// Simple SCE example
		home.stringOfHTML = '<strong>Some bold text</strong> bound as HTML with a <a href="#">link</a>!';
	}
})();