/**
 * @module superdesk.apps.archive
 * @ngdoc directive
 * @name sdAssociatedItemMetadata
 * @description This directive is used to display associated item metadata.
 */
export function AssociatedItemMetadata() {
    return {
        templateUrl: 'scripts/apps/archive/views/metadata-associateditem-view.html',
        scope: {
            association: '=',
            title: '@',
        },
    };
}
