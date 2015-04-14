(function() {

	angular
		.module('myApp')
		.directive('detectAdblock', detectAdblock);

	detectAdblock.$inject = ['$timeout', '$location'];

	function detectAdblock($timeout, $location) {

		_detectAdblockLink.$inject = ['$scope', '$elem', '$attrs'];

		function _detectAdblockLink($scope, $elem, $attrs) {
			// data object
			$scope.ab = {};

			// hostname for messaging
			$scope.ab.host = $location.host();

			/**
			 * Check if ads are blocked - called in $timeout to let AdBlockers run
			 *
			 * @private
			 */
			function _areAdsBlocked() {
				var _a = $elem.find('.ad');

				$scope.ab.blocked = _a.height() <= 0 || !$elem.find('.ad:visible').length;
			}

			$timeout(_areAdsBlocked, 200);
		}

		return {
			restrict: 'EA',
			link: _detectAdblockLink,
			template:   '<span class="ad facebook twitter" style="height:1px;position:absolute;left:-9999px;"></span>' +
						'<div ng-if="ab.blocked" class="alert alert-danger"><i class="fa fa-warning"></i> Disable AdBlocking on <strong>{{ab.host}}</strong> to access additional login options.</div>'
		}
	}

})();