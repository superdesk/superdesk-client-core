export function DictionaryConfigModal() {
    return {
        controller: 'DictionaryEdit',
        require: '^sdDictionaryConfig',
        templateUrl: 'scripts/superdesk-dictionaries/views/dictionary-config-modal.html'
    };
}
