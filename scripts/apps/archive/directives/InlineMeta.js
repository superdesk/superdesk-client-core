export function InlineMeta() {
    return {
        templateUrl: 'scripts/apps/archive/views/inline-meta.html',
        scope: {
            placeholder: '@',
            showmeta: '=',
            item: '=',
            setmeta: '&',
        },
    };
}
