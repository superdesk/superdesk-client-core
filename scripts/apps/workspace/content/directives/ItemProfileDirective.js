ItemProfileDirective.$inject = ['content'];
export function ItemProfileDirective(content) {
    return {
        scope: {profileId: '=profile'},
        template: '{{ profile }}',
        link: function(scope) {
            content.getTypesLookup().then((lookup) => {
                scope.profile = lookup[scope.profileId] ?
                    lookup[scope.profileId].label :
                    scope.profileId;
            });
        },
    };
}
