(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('EventsCtrl', EventsCtrl);

	EventsCtrl.$inject = ['$scope', '$auth'];

	function EventsCtrl($scope, $auth) {
		var events = this;

		/**
		 * Determines if the user is authenticated
		 *
		 * @returns {boolean}
		 */
		events.isAuthenticated = function() {
			return $auth.isAuthenticated();
		}
	}
})();