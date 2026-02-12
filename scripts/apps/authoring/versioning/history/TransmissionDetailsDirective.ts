import {sdApi} from 'api';

export function TransmissionDetailsDirective() {
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
                    sdApi.article.getPublishQueueEntriesForItem(
                        scope.item.item_id,
                        scope.item.version,
                        scope.type === 'legal_archive',
                    ).then((queueItems) => {
                        scope.queuedItems = queueItems;
                    });
                }
            };
        },
    };
}
