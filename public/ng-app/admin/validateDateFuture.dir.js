(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('validateDateFuture', validateDateFuture);

	validateDateFuture.$inject = ['eventData', '$timeout', '$location', '$filter', 'Event'];

	function validateDateFuture() {

		validateDateFutureLink.$inject = ['$scope', '$elem', '$attrs', 'ngModel'];

		function validateDateFutureLink($scope, $elem, $attrs, ngModel) {

			// TODO: this will not accept today as a valid date. Today should be valid.

			var _now = new Date();

			ngModel.$parsers.unshift(function(value) {
				var _d = Date.parse(value),
					_valid = _now - _d < 0;

				ngModel.$setValidity('future', _valid);

				return _valid ? value : undefined;
			});

			ngModel.$formatters.unshift(function(value) {
				var _d = Date.parse(value),
					_valid = _now - _d > 0;

				ngModel.$setValidity('future', _valid);
				return value;
			});
		}

		return {
			restrict: 'A',
			require: 'ngModel',
			link: validateDateFutureLink
		}
	}
})();