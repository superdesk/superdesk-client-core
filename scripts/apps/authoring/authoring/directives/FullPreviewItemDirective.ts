import _ from 'lodash';

FullPreviewItemDirective.$inject = ['content', '$sce'];
export function FullPreviewItemDirective(content, $sce) {
    return {
        scope: {
            item: '=',
            hideMedia: '=',
        },
        templateUrl: 'scripts/apps/authoring/views/full-preview-item.html',
        link: function(scope, elem, attr, ctrl) {
            // Prevent external code from modifying this scope directly.
            const fakeScope: any = {};

            content.setupAuthoring(scope.item.profile, fakeScope, scope.item).then(() => {
                scope.editor = fakeScope.editor;
                scope.fields = fakeScope.fields;
            });
        },
    };
}
