(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AdminCtrl', AdminCtrl);

	AdminCtrl.$inject = ['userData', 'User'];

	function AdminCtrl(userData, User) {
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

			angular.forEach(admin.users, function(user) {
				user.linkedAccounts = User.getLinkedAccounts(user);

				console.log(user.linkedAccounts);
			});

			console.log(admin.users);
		});
	}
})();