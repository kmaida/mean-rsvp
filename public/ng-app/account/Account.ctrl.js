(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AccountCtrl', AccountCtrl);

	AccountCtrl.$inject = ['$auth', '$rootScope', 'userData', '$timeout'];

	function AccountCtrl($auth, $rootScope, userData, $timeout) {
		// controllerAs ViewModel
		var account = this;

		account.logins = [
			{
				account: 'google',
				name: 'Google',
				url: 'http://accounts.google.com'
			}, {
				account: 'twitter',
				name: 'Twitter',
				url: 'http://twitter.com'
			}, {
				account: 'facebook',
				name: 'Facebook',
				url: 'http://facebook.com'
			}, {
				account: 'github',
				name: 'GitHub',
				url: 'http://github.com'
			}
		];

		/***
		 * Get user's profile information
		 */
		account.getProfile = function() {

			userData.getUser(function(data) {
				account.user = data;
				account.administrator = account.user.isAdmin;
				account.linkedAccounts = [];

				angular.forEach(account.logins, function(actObj) {
					var act = actObj.account;

					if (account.user[act]) {
						account.linkedAccounts.push(act);
					}
				});
			});
		};

		/***
		 * Reset profile save button to initial state
		 */
		function btnSaveReset() {
			account.btnSaved = false;
			account.btnSaveText = 'Save';
		}

		btnSaveReset();

		/***
		 * Update user's profile information.
		 */
		account.updateProfile = function() {
			var profileData = { displayName: account.user.displayName };

			userData.updateUser(profileData, function() {
				account.btnSaved = true;
				account.btnSaveText = 'Saved!';

				$timeout(btnSaveReset, 2500);
			});
		};

		/***
		 * Link third-party provider.
		 *
		 * @param {String} provider
		 */
		account.link = function(provider) {
			$auth.link(provider)
				.then(function() {
					account.getProfile();
				})
				.catch(function(response) {
					alert(response.data.message);
				});
		};

		/***
		 * Unlink third-party provider.
		 *
		 * @param {String} provider
		 */
		account.unlink = function(provider) {
			$auth.unlink(provider)
				.then(function() {
					account.getProfile();
				})
				.catch(function(response) {
					alert(response.data ? response.data.message : 'Could not unlink ' + provider + ' account');
				});
		};

		account.getProfile();
	}
})();