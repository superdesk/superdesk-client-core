export function SingleItem() {
    return {
        templateUrl: 'scripts/superdesk-archive/views/single-item-preview.html',
        scope: {
            item: '=',
            contents: '=',
            setitem: '&'
        }
    };
}
