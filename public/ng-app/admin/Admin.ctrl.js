(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AdminCtrl', AdminCtrl);

	AdminCtrl.$inject = ['$auth', '$rootScope', 'userData', '$timeout'];

	function AdminCtrl($auth, $rootScope, userData, $timeout) {
		// controllerAs ViewModel
		var admin = this;

		userData.getAllUsers(function(data) {
			admin.showAdmin = true;
			admin.users = data;
			console.log(admin.users);
		});
	}
})();