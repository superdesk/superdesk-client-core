export function VocabularyConfigModal() {
    return {
        scope: {
            vocabulary: '=',
        },
        controller: 'VocabularyEdit',
        templateUrl: 'scripts/superdesk-vocabularies/views/vocabulary-config-modal.html'
    };
}
