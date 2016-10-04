export function VocabularyConfigModal() {
    return {
        scope: {
            vocabulary: '=',
        },
        controller: 'VocabularyEdit',
        templateUrl: 'scripts/apps/vocabularies/views/vocabulary-config-modal.html'
    };
}
