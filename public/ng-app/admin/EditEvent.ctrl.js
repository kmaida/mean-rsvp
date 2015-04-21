(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('EditEventCtrl', EditEventCtrl);

	EditEventCtrl.$inject = ['$auth', 'userData', 'eventData', '$routeParams', '$location', '$timeout'];

	function EditEventCtrl($auth, userData, eventData, $routeParams, $location, $timeout) {
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

		function _btnDeleteReset() {
			edit.btnDelete = false;
			edit.btnDeleteText = 'Delete Event';
		}

		_btnDeleteReset();

		function _deleteSuccess() {
			edit.btnDeleteText = 'Deleted!';
			edit.btnDelete = true;
			edit.editEvent = {};

			$timeout(function() {
				$location.path('/admin');
			}, 2000);
		}

		function _deleteError() {
			edit.btnDeleteText = 'Error deleting!';

			$timeout(_btnDeleteReset, 3000);
		}

		edit.deleteEvent = function() {
			edit.btnDeleteText = 'Deleting...';

			eventData.deleteEvent(_eventId).then(_deleteSuccess, _deleteError);
		};
	}
})();