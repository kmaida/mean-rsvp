(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('inputDatetime', inputDatetime);

	function inputDatetime() {

		templateFn.$inject = ['tElm', 'tAttrs'];

		function templateFn(tAttrs, tElem) {

		}

		inputDatetimeLink.$inject = ['$scope', '$elm', '$attrs'];

		function inputDatetimeLink($scope, $elm, $attrs) {

		}

		return {
			restrict: 'EA',
			scope: {
				model: '=',
				required: '&'
			},
			template: templateFn
		}
	}
})();