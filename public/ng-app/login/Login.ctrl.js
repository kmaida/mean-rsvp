(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('LoginCtrl', LoginCtrl);

	LoginCtrl.$inject = ['$auth'];

	function LoginCtrl($auth) {
		// controllerAs ViewModel
		var login = this;

		/**
		 * Authenticate the user via Oauth with the specified provider
		 *
		 * @param {string} provider - (twitter, facebook, github, google)
		 */
		login.authenticate = function(provider) {
			$auth.authenticate(provider)
				.then(function(response) {
					// signed in
				})
				.catch(function(response) {
					console.log(response.data);
				});
		}
	}
})();