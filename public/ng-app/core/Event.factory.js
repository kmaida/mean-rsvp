// Event functions
(function() {
	'use strict';

	angular
		.module('myApp')
		.factory('Event', Event);

	function Event() {

		/**
		 * Generate a pretty date for UI display from the start and end datetimes
		 *
		 * @param eventObj {object} the event object
		 * @returns {Array}
		 */
		function getPrettyDatetime(eventObj) {
			var startDate = eventObj.startDate,
				startTime = eventObj.startTime,
				endDate = eventObj.endDate,
				endTime = eventObj.endTime,
				prettyDatetime;

			if (startDate === endDate) {
				// event starts and ends on the same day
				// April 29 2015, 12:00 PM - 5:00 PM
				prettyDatetime = startDate + ', ' + startTime + ' - ' + endTime;
			} else {
				// event starts and ends on different days
				// April 29 2015, 12:00 PM - April 30 2015, 5:00 PM
				prettyDatetime = startDate + ', ' + startTime + ' - ' + endDate + ', ' + endTime;
			}

			return prettyDatetime;
		}

		return {
			getPrettyDatetime: getPrettyDatetime
		};
	}
})();