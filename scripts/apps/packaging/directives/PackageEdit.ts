import {isPublished} from 'apps/archive/utils';

PackageEdit.$inject = ['authoring'];
export function PackageEdit(authoring) {
    return {
        templateUrl: 'scripts/apps/packaging/views/sd-package-edit.html',
        link: function(scope) {
            scope.limits = authoring.limits;
            scope._editable = scope.origItem._editable;
            scope._isInPublishedStates = isPublished(scope.origItem);
        },
    };
}
