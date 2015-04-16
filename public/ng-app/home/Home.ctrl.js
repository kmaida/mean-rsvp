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
		 * Get local data from static JSON
		 *
		 * @param function (successful promise returns)
		 * @returns {object} data
		 */
		localData.getJSON()
			.then(function(response) {
				home.localData = response.data;
			});

		// Simple SCE example
		home.stringOfHTML = '<strong>Some bold text</strong> bound as HTML with a <a href="#">link</a>!';
	}
})();