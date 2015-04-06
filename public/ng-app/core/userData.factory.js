// fetch user data
(function() {
	'use strict';

	angular
		.module('myApp')
		.factory('userData', userData);

	userData.$inject = ['$http'];

	function userData($http) {
		return {
			getUser: function() {
				return $http.get('/api/me');
			},
			updateUser: function(profileData) {
				return $http.put('/api/me', profileData);
			}
		}
	}
})();