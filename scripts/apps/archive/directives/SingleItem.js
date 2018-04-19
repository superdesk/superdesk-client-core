export function SingleItem() {
    return {
        templateUrl: 'scripts/apps/archive/views/single-item-preview.html',
        scope: {
            item: '=',
            contents: '=',
            setitem: '&',
        },
    };
}
