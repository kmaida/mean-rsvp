// User directive
(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('user', user);

	user.$inject = ['userData', '$auth'];

	function user(userData, $auth) {

		function userCtrl() {
			// controllerAs ViewModel
			var u = this;

			u.isAuthenticated = function() {
				return $auth.isAuthenticated();
			};

			userData.getUser(function(user) {
				u.user = user;
			});
		}

		return {
			restrict: 'EA',
			controller: userCtrl,
			controllerAs: 'u',
			template: '<div ng-if="u.isAuthenticated() && !!u.user"><img ng-if="!!u.user.picture" ng-src="{{u.user.picture}}" class="img-userPicture" /> {{u.user.displayName}}</div>'
		};
	}
})();