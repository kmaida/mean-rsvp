(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('LoginCtrl', LoginCtrl);

	LoginCtrl.$inject = ['GlobalObj', '$auth'];

	function LoginCtrl(GlobalObj, $auth) {
		// controllerAs ViewModel
		var login = this;

		// put global variables in scope
		login.global = GlobalObj;

		/***
		 * Authenticate the user via Oauth with the provider
		 * (Twitter, Facebook, etc.)
		 *
		 * @param {String} provider
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