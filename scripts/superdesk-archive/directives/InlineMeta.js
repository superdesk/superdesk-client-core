export function InlineMeta() {
    return {
        templateUrl: 'scripts/superdesk-archive/views/inline-meta.html',
        scope: {
            'placeholder': '@',
            'showmeta': '=',
            'item': '=',
            'setmeta': '&'
        }
    };
}
