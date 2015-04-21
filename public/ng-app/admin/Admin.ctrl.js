(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AdminCtrl', AdminCtrl);

	AdminCtrl.$inject = ['$auth', 'userData', 'User', 'eventData', '$timeout'];

	function AdminCtrl($auth, userData, User, eventData, $timeout) {
		// controllerAs ViewModel
		var admin = this;

		/**
		 * Determines if the user is authenticated
		 *
		 * @returns {boolean}
		 */
		admin.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		admin.tabs = ['Events', 'Add Event', 'Users'];
		admin.currentTab = 0;

		/**
		 * Switch tabs
		 *
		 * @param tabIndex
		 */
		admin.changeTab = function(tabIndex) {
			admin.currentTab = tabIndex;
		};

		function _btnSubmitReset() {
			admin.btnSaved = false;
			admin.btnSubmitText = 'Submit';
		}

		_btnSubmitReset();

		function _newEventSuccess() {
			admin.btnSaved = true;
			admin.btnSubmitText = 'Saved!';
			admin.newEvent = {};

			$timeout(_btnSubmitReset, 3000);
		}

		function _newEventError() {
			admin.btnSaved = 'error';
			admin.btnSubmitText = 'Error saving!';

			$timeout(_btnSubmitReset, 3000);
		}

		/**
		 * Click submit button
		 * Submit new event to API
		 * Form @ eventAdd.tpl.html
		 */
		admin.submitNewEvent = function() {
			admin.btnSubmitText = 'Saving...';

			eventData.createEvent(admin.newEvent).then(_newEventSuccess, _newEventError);
		};

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

			admin.showAdmin = true;
		}

		userData.getAllUsers().then(_getAllUsersSuccess);
	}
})();