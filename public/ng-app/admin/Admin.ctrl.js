(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AdminCtrl', AdminCtrl);

	AdminCtrl.$inject = ['$auth', 'userData', 'User', 'eventData', '$timeout', '$scope'];

	function AdminCtrl($auth, userData, User, eventData, $timeout, $scope) {
		// controllerAs ViewModel
		var admin = this;

		// verify that user is admin
		userData.getUser().then(function(data) {
			if (data.isAdmin) {
				admin.showAdmin = true;
			}
		});

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
		}

		userData.getAllUsers().then(_getAllUsersSuccess);
	}
})();