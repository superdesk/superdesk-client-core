TransmissionDetailsDirective.$inject = ['api'];
export function TransmissionDetailsDirective(api) {
    return {
        templateUrl: 'scripts/apps/authoring/versioning/history/views/publish_queue.html',
        scope: {
            item: '=',
            type: '=',
        },
        link: function(scope) {
            scope.transmitted_item = null;
            scope.show_transmission_details = false;

            /**
             * Sets the model to be displayed in the modal-body.
             */
            scope.showFormattedItem = function(item) {
                scope.transmitted_item = item.formatted_item;
            };

            /**
             * Sets the model of the modal to null when and is hidden.
             */
            scope.hideFormattedItem = function() {
                scope.transmitted_item = null;
            };

            /**
             * Triggered when user clicks on +/- symbol in the Item History.
             *
             * When user clicks on + symbol, it hits the API to bring the transmission details from publish queue.
             */
            scope.showOrHideTransmissionDetails = function() {
                scope.show_transmission_details = !scope.show_transmission_details;

                if (scope.show_transmission_details) {
                    var criteria = {max_results: 20};

                    criteria.where = JSON.stringify({
                        $and: [{item_id: scope.item.item_id}, {item_version: scope.item.version}],
                    });

                    var promise;

                    if (scope.type === 'legal_archive') {
                        promise = api.legal_publish_queue.query(criteria);
                    } else {
                        promise = api.publish_queue.query(criteria);
                    }

                    promise.then((response) => {
                        _.each(response._items, (item) => {
                            if (angular.isUndefined(item.completed_at)) {
                                item.completed_at = item._updated;
                            }
                        });

                        scope.queuedItems = response._items;
                    });
                }
            };
        },
    };
}