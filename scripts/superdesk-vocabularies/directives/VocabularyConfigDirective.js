export function VocabularyConfigDirective() {
    return {
        scope: {
            vocabulary: '=',
        },
        controller: 'VocabularyConfig',
        templateUrl: 'scripts/superdesk-vocabularies/views/vocabulary-config.html'
    };
}
