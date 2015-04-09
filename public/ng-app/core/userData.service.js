// fetch user data
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('userData', userData);

	/**
	 * Default error callback for userData service API calls
	 *
	 * @param error
	 * @private
	 */
	function _defaultErrorCallback(error) {
		alert(error.message);
	}

	userData.$inject = ['$http'];

	function userData($http) {
		this.getUser = function(successCallback, errorCallback) {
			return $http
				.get('/api/me')
				.success(successCallback)
				.error(errorCallback || _defaultErrorCallback);
		};
		this.updateUser = function(profileData, successCallback, errorCallback) {
			return $http
				.put('/api/me', profileData)
				.success(successCallback)
				.error(errorCallback || _defaultErrorCallback);
		};
		this.getAllUsers = function(successCallback, errorCallback) {
			return $http
				.get('/api/users')
				.success(successCallback)
				.error(errorCallback || _defaultErrorCallback);
		}
	}
})();