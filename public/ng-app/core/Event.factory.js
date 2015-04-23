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
			var dStart = eventObj.datetimeStart,
				dEnd = eventObj.datetimeEnd,
				startDate,
				endDate,
				fullDate,
				startTime,
				endTime,
				fullTime,
				prettyDatetime;

			function _prettyDate(d) {
				var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
					m = months[d.getMonth()],
					day = d.getDate(),
					year = d.getFullYear();

				return m + ' ' + day + ' ' + year;
			}

			function _prettyTime(d) {
				var hh = d.getHours(),
					h = hh,
					min = ('0' + d.getMinutes()).slice(-2),
					ampm = 'AM';

				if (hh > 12) {
					h = hh - 12;
					ampm = 'PM';
				} else if (hh === 12) {
					h = 12;
					ampm = 'PM';
				} else if (hh == 0) {
					h = 12;
				}

				return h + ':' + min + ' ' + ampm;
			}

			function _compileDatetime() {
				if (startDate === endDate) {
					// event starts and ends on the same day
					// April 29 2015, 12:00 PM - 5:00 PM
					return startDate + ', ' + startTime + ' - ' + endTime;
				} else {
					// event starts and ends on different days
					// April 29 2015, 12:00 PM - April 30 2015, 5:00 PM
					return startDate + ', ' + startTime + ' - ' + endDate + ', ' + endTime;
				}
			}

			startDate = _prettyDate(dStart);
			endDate = _prettyDate(dEnd);
			startTime = _prettyTime(dStart);
			endTime = _prettyTime(dEnd);

			prettyDatetime = _compileDatetime();

			return prettyDatetime;
		}

		return {
			getPrettyDatetime: getPrettyDatetime
		};
	}
})();