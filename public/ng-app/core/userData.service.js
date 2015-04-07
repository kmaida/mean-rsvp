// fetch user data
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('userData', userData);

	userData.$inject = ['$http'];

	function userData($http) {
		this.getUser = function(callback) {
			return $http
				.get('/api/me')
				.success(callback)
				.error(function(error) { alert(error.message); });
		};
		this.updateUser = function(profileData, callback) {
			return $http
				.put('/api/me', profileData)
				.success(callback)
				.error(function(error) { alert(error.message); });
		};
		this.getAllUsers = function(callback) {
			return $http
				.get('/api/users')
				.success(callback)
				.error(function(error) { console.log(error.message); });
		}
	}
})();