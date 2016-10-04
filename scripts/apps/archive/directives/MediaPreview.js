MediaPreview.$inject = ['api', '$rootScope', 'desks', 'superdesk'];

export function MediaPreview(api, $rootScope, desks, superdesk) {
    return {
        templateUrl: 'scripts/apps/archive/views/preview.html',
        link: function(scope) {
            scope.previewRewriteStory = function () {
                return api.find('archive', scope.item.rewrite_id).then(function(item) {
                    $rootScope.$broadcast('broadcast:preview', {'item': item});
                });
            };

            scope.preview = function(item) {
                superdesk.intent('preview', 'item', item);
            };

            scope.getCompanyCodes = function() {
                return _.map(scope.item.company_codes, 'qcode').join(', ');
            };

            desks.initialize().then(function() {
                scope.userLookup = desks.userLookup;
            });
        }
    };
}

export function MediaPreviewWidget() {
    return {
        scope: {item: '='},
        templateUrl: 'scripts/apps/archive/views/item-preview.html'
    };
}
