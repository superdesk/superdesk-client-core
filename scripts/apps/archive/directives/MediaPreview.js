MediaPreview.$inject = ['api', '$rootScope', 'desks', 'superdesk', 'content'];

export function MediaPreview(api, $rootScope, desks, superdesk, content) {
    return {
        template: require('../views/preview.html'),
        link: function(scope) {
            if (scope.selected.preview.profile) {
                content.getType(scope.selected.preview.profile)
                    .then((type) => {
                        scope.editor = content.editor(type);
                        scope.fields = content.fields(type);
                    });
            } else {
                scope.editor = content.editor();
            }

            scope.previewRewriteStory = function() {
                return api.find('archive', scope.item.rewrite_id).then((item) => {
                    $rootScope.$broadcast('broadcast:preview', {item: item});
                });
            };

            scope.preview = function(item) {
                superdesk.intent('preview', 'item', item);
            };

            scope.getCompanyCodes = function() {
                return _.map(scope.item.company_codes, 'qcode').join(', ');
            };

            desks.initialize().then(() => {
                scope.userLookup = desks.userLookup;
            });
        },
    };
}

export function MediaPreviewWidget() {
    return {
        scope: {item: '='},
        templateUrl: 'scripts/apps/archive/views/item-preview.html',
    };
}
