DeskConfigModal.$inject = ['metadata', 'content'];
export function DeskConfigModal(metadata, content) {
    return {
        scope: {
            modalActive: '=active',
            desk: '=',
            step: '=',
            desks: '=',
            cancel: '&'
        },
        require: '^sdDeskConfig',
        templateUrl: 'scripts/superdesk-desks/views/desk-config-modal.html',
        link: function(scope, elem, attrs, ctrl) {
            metadata.initialize().then(function() {
                scope.metadata = metadata.values;
            });

            content.getTypes().then(function(profiles) {
                scope.profiles = profiles;
            });
        }
    };
}
