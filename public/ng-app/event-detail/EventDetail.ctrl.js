(function() {
	'use strict';

	angular
		.module('myApp')
		.controller('EventDetailCtrl', EventDetailCtrl);

	EventDetailCtrl.$inject = ['$routeParams', '$auth', 'userData', 'eventData', 'rsvpData'];

	function EventDetailCtrl($routeParams, $auth, userData, eventData, rsvpData) {
		var event = this,
			_eventId = $routeParams.eventId;

		/**
		 * Determines if the user is authenticated
		 *
		 * @returns {boolean}
		 */
		event.isAuthenticated = function() {
			return $auth.isAuthenticated();
		};

		event.showModal = false;

		event.openRsvpModal = function() {
			event.showModal = true;
		};

		/**
		 * Function for successful API call retrieving user data
		 * Then calls RSVP data and determines if user has RSVPed to this event
		 *
		 * @param data {object} promise provided by $http success
		 * @private
		 */
		function _userSuccess(data) {
			event.user = data;

			/**
			 * Function for successful API call retrieving RSVP data for user
			 *
			 * @param data {object} promise provided by $http success
			 * @private
			 */
			function _rsvpSuccess(data) {
				var _rsvps = data;

				for (var i = 0; i < _rsvps.length; i++) {
					var thisRsvp = _rsvps[i];

					if (thisRsvp.eventId === _eventId) {
						event.rsvpObj = thisRsvp;
						break;
					}
				}

				event.rsvpBtnText = !event.rsvpObj ? 'RSVP for event' : 'Update my RSVP';
				event.rsvpReady = true;
			}

			rsvpData.getRsvps(event.user._id).then(_rsvpSuccess);
		}

		userData.getUser().then(_userSuccess);

		/**
		 * Function for successful API call getting single event detail
		 *
		 * @param data {object} promise provided by $http success
		 * @private
		 */
		function _eventSuccess(data) {
			event.detail = data;
		}

		eventData.getEvent(_eventId).then(_eventSuccess);
	}
})();