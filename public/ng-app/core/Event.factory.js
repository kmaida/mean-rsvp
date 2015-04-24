// Event functions
(function() {
	'use strict';

	angular
		.module('myApp')
		.factory('Event', Event);

	Event.$inject = ['Utils'];

	function Event(Utils) {

		/**
		 * Get pretty (longer form) date from mm/dd/yyyy string
		 *
		 * @param dateStr {string} the date string to prettify
		 * @returns {string} longer form date: mon [d]d yyyy
		 */
		function getPrettyDate(dateStr) {
			var d = new Date(dateStr),
				monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
				month = monthsArr[d.getMonth()],
				day = d.getDate(),
				year = d.getFullYear(),
				prettyDate;

			prettyDate = month + ' ' + day + ' ' + year;

			return prettyDate;
		}

		/**
		 * Generate a pretty date for UI display from the start and end datetimes
		 *
		 * @param eventObj {object} the event object
		 * @returns {string} pretty start and end date / time string
		 */
		function getPrettyDatetime(eventObj) {
			var startDate = eventObj.startDate,
				startTime = eventObj.startTime,
				endDate = eventObj.endDate,
				endTime = eventObj.endTime,
				prettyStartDate = getPrettyDate(startDate),
				prettyEndDate = getPrettyDate(endDate),
				prettyDatetime;

			if (startDate === endDate) {
				// event starts and ends on the same day
				// Apr 29 2015, 12:00 PM - 5:00 PM
				prettyDatetime = prettyStartDate + ', ' + startTime + ' - ' + endTime;
			} else {
				// event starts and ends on different days
				// Dec 31 2014, 8:00 PM - Jan 1 2015, 11:00 AM
				prettyDatetime = prettyStartDate + ', ' + startTime + ' - ' + prettyEndDate + ', ' + endTime;
			}

			return prettyDatetime;
		}

		return {
			getPrettyDate: getPrettyDate,
			getPrettyDatetime: getPrettyDatetime
		};
	}
})();