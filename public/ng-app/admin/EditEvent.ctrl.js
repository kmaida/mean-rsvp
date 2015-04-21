(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('EditEventCtrl', EditEventCtrl);

	EditEventCtrl.$inject = ['$auth', 'userData', 'eventData', '$routeParams'];

	function EditEventCtrl($auth, userData, eventData, $routeParams) {
		// controllerAs ViewModel
		var edit = this;

		var _eventId = $routeParams.eventId;

		// verify that user is admin
		userData.getUser().then(function(data) {
			if (data.isAdmin) {
				edit.showEdit = true;
			}
		});

		/**
		 * Determines if the user is authenticated
		 *
		 * @returns {boolean}
		 */
		edit.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		eventData.getEvent(_eventId).then(function(data) {
			edit.editEvent = data;
			edit.showEditForm = true;
		});

		function _deleteSuccess() {
			alert('Event deleted!');
		}

		edit.deleteEvent = function(id) {
			eventData.deleteEvent(id).then(_deleteSuccess);
		};
	}
})();