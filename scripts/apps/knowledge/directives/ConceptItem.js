ConceptItem.$inject = ['$location', 'asset', 'api', 'notify', 'gettext'];

/**
 * Opens and manages concept item panel
 */
export function ConceptItem($location, asset, api, notify, gettext) {
    return {
        templateUrl: asset.templateUrl('apps/knowledge/views/concept-item.html'),
        link: function(scope, elem) {
            scope.edit = null;
            scope.activatePane = false;

            scope.$on('edit:concept-item', (event, args) => {
                scope.activatePane = false;
                scope.editing = args;
                scope.edit = _.create(scope.editing) || {};
            });

            scope.editItem = function() {
                scope.activatePane = true;
                scope.edit = _.create(scope.editing) || {};
            };

            scope.cancel = function() {
                scope.editing = false;
                scope.edit = null;
                scope.activatePane = false;
            };

            scope.clear = function() {
                scope.editing = false;
                scope.edit = null;
            };

            /**
             * Patches or posts the given concept item
             */
            scope.save = function(edit) {
                function onSuccess() {
                    notify.success(gettext('The concept item was saved successfully'));
                    scope.cancel();
                }

                function onFail(error) {
                    scope.edit = null;
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error saving the concept item.'));
                    }
                }

                var original = {};

                if (edit._id) {
                    original = scope.editing;
                }

                api('concept_items')
                    .save(original, edit)
                    .then(onSuccess, onFail);
            };
        }
    };
}
