// fetch user data
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('userData', userData);

	userData.$inject = ['$http'];

	function userData($http) {
		this.defaultErrorCallback = function(error) {
			alert(error.message);
		};
		this.getUser = function(successCallback, errorCallback) {
			return $http
				.get('/api/me')
				.success(successCallback)
				.error(errorCallback || this.defaultErrorCallback);
		};
		this.updateUser = function(profileData, successCallback, errorCallback) {
			return $http
				.put('/api/me', profileData)
				.success(successCallback)
				.error(errorCallback || this.defaultErrorCallback);
		};
		this.getAllUsers = function(successCallback, errorCallback) {
			return $http
				.get('/api/users')
				.success(successCallback)
				.error(errorCallback || this.defaultErrorCallback);
		}
	}
})();