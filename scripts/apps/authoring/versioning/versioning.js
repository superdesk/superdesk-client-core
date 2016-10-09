angular.module('superdesk.apps.authoring.versioning', [])
    .config(['authoringWidgetsProvider', function(authoringWidgetsProvider) {
        authoringWidgetsProvider
            .widget('versioning', {
                icon: 'revision',
                label: gettext('Versioning'),
                removeHeader: true,
                template: 'scripts/apps/authoring/versioning/views/versioning.html',
                order: 4,
                side: 'right',
                display: {authoring: true, packages: true, killedItem: true, legalArchive: true, archived: false},
                afterClose: function(scope) {
                    if (scope && typeof scope.closePreview === 'function' && !scope._editable) {
                        scope.closePreview();
                    }
                }
            });
    }]);
