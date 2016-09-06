ItemAssociationDirective.$inject = ['superdesk', 'renditions', '$timeout', 'api', '$q', 'config'];
export function ItemAssociationDirective(superdesk, renditions, $timeout, api, $q, config) {
    return {
        scope: {
            rel: '=',
            item: '=',
            editable: '=',
            allowVideo: '@',
            onchange: '&'
        },
        templateUrl: 'scripts/superdesk-authoring/views/item-association.html',
        link: function(scope, elem) {
            var MEDIA_TYPES = ['application/superdesk.item.picture'];
            if (scope.allowVideo === 'true') {
                MEDIA_TYPES.push('application/superdesk.item.video');
            }
            /**
             * Get superdesk item from event
             *
             * @param {Event} event
             * @param {string} dataType
             * @return {Object}
             */
            function getItem(event, dataType) {
                return angular.fromJson(event.originalEvent.dataTransfer.getData(dataType));
            }

            // it should prevent default as long as this is valid image
            elem.on('dragover', function(event) {
                if (MEDIA_TYPES.indexOf(event.originalEvent.dataTransfer.types[0]) > -1) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });

            // update item associations on drop
            elem.on('drop dragdrop', function(event) {
                event.preventDefault();
                event.stopPropagation();
                var item = getItem(event, event.originalEvent.dataTransfer.types[0]);
                // ingest picture if it comes from an external source (create renditions)
                if (scope.isEditable()) {
                    scope.loading = true;
                    renditions.ingest(item)
                    .then(scope.edit)
                    .finally(function() {
                        scope.loading = false;
                    });
                } else {
                    var data = updateItemAssociation(item);
                    scope.onchange({item: scope.item, data: data});
                }
            });

            function updateItemAssociation(updated) {
                var data = {};
                data[scope.rel] = updated;
                scope.item.associations = angular.extend(
                    {},
                    scope.item.associations,
                    data
                );
                scope.$apply();
                return data;
            }

            // init associated item for preview
            scope.$watch('item.associations[rel]', function(related) {
                scope.related = related;
            });

            renditions.get();

            scope.edit = function(item) {
                scope.loading = true;
                return renditions.crop(item).then(function(updatedItem) {
                    var data = updateItemAssociation(updatedItem);
                    scope.onchange({item: scope.item, data: data});
                })
                .finally(function() {
                    scope.loading = false;
                });
            };

            scope.isVideo = function(rendition) {
                return _.some(['.mp4', '.webm', '.ogv'], function(ext) {
                    return _.endsWith(rendition.href, ext);
                });
            };

            scope.isEditable = function() {
                if (config.features && 'editFeaturedImage' in config.features &&
                        !config.features.editFeaturedImage) {
                    return false;
                } else {
                    return true;
                }
            };

            scope.remove = function(item) {
                var data = updateItemAssociation(null);
                scope.onchange({item: scope.item, data: data});
            };

            scope.upload = function() {
                if (scope.editable) {
                    superdesk.intent('upload', 'media', {uniqueUpload: true}).then(function(images) {
                        // open the view to edit the PoI and the cropping areas
                        if (images) {
                            $timeout(function() {
                                scope.edit(images[0]);
                            }, 0, false);
                        }
                    });
                }
            };
        }
    };
}
