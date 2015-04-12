(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('AccountCtrl', AccountCtrl);

	AccountCtrl.$inject = ['$auth', 'userData', '$timeout', 'OAUTH', 'User'];

	function AccountCtrl($auth, userData, $timeout, OAUTH, User) {
		// controllerAs ViewModel
		var account = this;

		// array of all available login services
		account.logins = OAUTH.LOGINS;

		/**
		 * Get user's profile information
		 */
		account.getProfile = function() {
			/**
			 * Success callback for API call getting user's profile data
			 *
			 * @param data {object} provided by $http success
			 */
			function getUserSuccess(data) {
				account.user = data;
				account.administrator = account.user.isAdmin;
				account.linkedAccounts = User.getLinkedAccounts(account.user, 'account');
			}

			userData.getUser(getUserSuccess);
		};

		/**
		 * Reset profile save button to initial state
		 */
		function btnSaveReset() {
			account.btnSaved = false;
			account.btnSaveText = 'Save';
		}

		btnSaveReset();

		/**
		 * Update user's profile information
		 * Called on submission of update form
		 */
		account.updateProfile = function() {
			var profileData = { displayName: account.user.displayName };

			// Set status to saving... to update upon success or error in callbacks
			account.btnSaveText = 'Saving...';

			/**
			 * Success callback when profile has been updated
			 */
			function updateSuccess() {
				account.btnSaved = true;
				account.btnSaveText = 'Saved!';

				$timeout(btnSaveReset, 2500);
			}

			/**
			 * Error callback when profile update has failed
			 */
			function updateError() {
				account.btnSaved = 'error';
				account.btnSaveText = 'Error saving!';

				$timeout(btnSaveReset, 3000);
			}

			// Update the user, passing profile data, success callback function, and error callback function
			userData.updateUser(profileData, updateSuccess, updateError);
		};

		/**
		 * Link third-party provider
		 *
		 * @param {string} provider
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

		/**
		 * Unlink third-party provider
		 *
		 * @param {string} provider
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