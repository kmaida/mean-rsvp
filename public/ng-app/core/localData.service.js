// fetch local JSON data
(function() {
	'use strict';

	angular
		.module('myApp')
		.service('localData', localData);

	localData.$inject = ['$http'];

	function localData($http) {
		this.getJSON = function(callback) {
			return $http
				.get('/ng-app/data/data.json')
				.success(callback)
				.error(function(error) { alert(error.message); });
		}
	}
})();