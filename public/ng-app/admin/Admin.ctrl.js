(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AdminCtrl', AdminCtrl);

	AdminCtrl.$inject = ['$auth', '$rootScope', 'userData', '$timeout'];

	function AdminCtrl($auth, $rootScope, userData, $timeout) {
		// controllerAs ViewModel
		var admin = this;

		/**
		 * Get all the users
		 *
		 * @returns {Array}
		 */
		userData.getAllUsers(function(data) {
			admin.showAdmin = true;
			admin.users = data;
		});
	}
})();