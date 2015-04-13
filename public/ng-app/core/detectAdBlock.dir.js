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

			$scope.ab.host = $location.host();

			/**
			 * Check if ads are blocked - called in $timeout to let AdBlockers run
			 *
			 * @private
			 */
			function _areAdsBlocked() {
				$scope.ab.blocked = angular.element('[class*="facebook"]').height() <= 0 || angular.element('[class*="twitter"]').height() <= 0;
			}

			$timeout(_areAdsBlocked, 200);
		}

		return {
			restrict: 'EA',
			link: _detectAdblockLink,
			template: '<div ng-if="ab.blocked" class="alert alert-danger"><i class="fa fa-warning"></i> Disable AdBlocking on <strong>{{ab.host}}</strong> to access additional login options.</div>'
		}
	}

})();