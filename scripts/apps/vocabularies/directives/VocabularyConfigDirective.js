export function VocabularyConfigDirective() {
    return {
        scope: {
            vocabulary: '=',
        },
        controller: 'VocabularyConfig',
        templateUrl: 'scripts/apps/vocabularies/views/vocabulary-config.html'
    };
}
