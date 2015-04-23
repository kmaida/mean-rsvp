(function() {
	'use strict';

	angular
		.module('myApp')
		.directive('eventForm', eventForm);

	eventForm.$inject = ['eventData', '$timeout'];

	function eventForm(eventData, $timeout) {

		eventFormCtrl.$inject = ['$scope'];

		function eventFormCtrl($scope) {
			// controllerAs syntax
			var ef = this;

			// check if form is create or edit
			var _isCreate = jQuery.isEmptyObject(ef.formModel),
				_isEdit = ef.formModel;

			/**
			 * Watch start date and when all characters are filled out, populate end date
			 * Deregister watch
			 *
			 * @type {*|function()}
			 * @private
			 */
			var _watchStartdate = $scope.$watch('ef.formModel.startDate', function(newVal, oldVal) {
				if (newVal && newVal.length === 10) {
					ef.formModel.endDate = newVal;
					_watchStartdate();
				}
			});

			/**
			 * Reset the state of the form Submit button
			 *
			 * @private
			 */
			function _btnSubmitReset() {
				ef.btnSaved = false;
				ef.btnSubmitText = _isCreate ? 'Submit' : 'Update';
			}

			_btnSubmitReset();

			/**
			 * Function for event API call succeeded
			 *
			 * @private
			 */
			function _eventSuccess() {
				ef.btnSaved = true;
				ef.btnSubmitText = _isCreate ? 'Saved!' : 'Updated!';

				if (_isCreate) {
					ef.formModel = {};
				}

				$timeout(_btnSubmitReset, 3000);
			}

			/**
			 * Function for event API call error
			 *
			 * @private
			 */
			function _eventError() {
				ef.btnSaved = 'error';
				ef.btnSubmitText = _isCreate ? 'Error saving!' : 'Error updating!';

				$timeout(_btnSubmitReset, 3000);
			}

			/**
			 * Click submit button
			 * Submit new event to API
			 * Form @ eventForm.tpl.html
			 */
			ef.submitEvent = function() {
				ef.btnSubmitText = 'Saving...';

				if (_isCreate) {
					eventData.createEvent(ef.formModel).then(_eventSuccess, _eventError);

				} else if (_isEdit) {
					eventData.updateEvent(ef.formModel._id, ef.formModel).then(_eventSuccess, _eventError);
				}
			};
		}

		return {
			restrict: 'EA',
			scope: {
				formModel: '='
			},
			templateUrl: '/ng-app/admin/eventForm.tpl.html',
			controller: eventFormCtrl,
			controllerAs: 'ef',
			bindToController: true
		}
	}
})();