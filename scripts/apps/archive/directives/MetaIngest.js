MetaIngest.$inject = ['ingestSources'];

export function MetaIngest(ingestSources) {
    return {
        scope: {
            item: '=',
        },
        template: '{{ name }}',
        link: function(scope) {
            scope.$watch('item', renderIngest);
            function renderIngest() {
                ingestSources.initialize().then(() => {
                    if (scope.item && scope.item.ingest_provider in ingestSources.providersLookup) {
                        scope.name = ingestSources.providersLookup[scope.item.ingest_provider].name ||
                        ingestSources.providersLookup[scope.item.ingest_provider].search_provider;
                    } else {
                        scope.name = '';
                    }
                });
            }
        },
    };
}
