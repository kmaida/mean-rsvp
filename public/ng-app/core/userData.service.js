// User API $http calls
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('userData', userData);

	/**
	 * Promise success function
	 *
	 * @param data
	 * @returns {*}
	 * @private
	 */
	function _promiseSuccess(data) {
		return data;
	}

	/**
	 * Promise error function
	 *
	 * @param error
	 * @private
	 */
	function _promiseError(error) {
		console.log('Error getting data:', error);
	}

	userData.$inject = ['$http'];

	function userData($http) {
		/**
		 * Get current user's data
		 *
		 * @returns {promise}
		 */
		this.getUser = function() {
			return $http
				.get('/api/me')
				.then(_promiseSuccess, _promiseError);
		};
		/**
		 * Update current user's profile data
		 *
		 * @param profileData {object}
		 * @param successCallback {function}
		 * @returns {*}
		 */
		this.updateUser = function(profileData, successCallback) {
			return $http
				.put('/api/me', profileData)
				.success(successCallback)
				.error(_promiseError);
		};
		/**
		 * Get all users (admin authorized only)
		 *
		 * @returns {promise}
		 */
		this.getAllUsers = function() {
			return $http
				.get('/api/users')
				.then(_promiseSuccess, _promiseError);
		}
	}
})();