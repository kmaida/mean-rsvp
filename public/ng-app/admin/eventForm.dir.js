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
			var _isCreate = jQuery.isEmptyObject(ef.prefillModel),
				_isEdit = ef.prefillModel;

			ef.dateRegex = /^((0?[13578]|10|12)(-|\/)(([1-9])|(0[1-9])|([12])([0-9]?)|(3[01]?))(-|\/)((19)([2-9])(\d{1})|(20)([01])(\d{1})|([8901])(\d{1}))|(0?[2469]|11)(-|\/)(([1-9])|(0[1-9])|([12])([0-9]?)|(3[0]?))(-|\/)((19)([2-9])(\d{1})|(20)([01])(\d{1})|([8901])(\d{1})))$/;
			ef.timeRegex = /^(([0-1]?[0-9])|([2][0-3])):([0-5]?[0-9])(:([0-5]?[0-9]))?$/;

			if (_isEdit) {
				ef.formModel = ef.prefillModel;
			}

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
				prefillModel: '='
			},
			templateUrl: '/ng-app/admin/eventForm.tpl.html',
			controller: eventFormCtrl,
			controllerAs: 'ef',
			bindToController: true
		}
	}
})();