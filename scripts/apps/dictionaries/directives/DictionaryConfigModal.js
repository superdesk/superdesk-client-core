export function DictionaryConfigModal() {
    return {
        controller: 'DictionaryEdit',
        require: '^sdDictionaryConfig',
        templateUrl: 'scripts/apps/dictionaries/views/dictionary-config-modal.html',
    };
}
