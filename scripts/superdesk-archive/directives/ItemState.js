export function ItemState() {
    return {
        templateUrl: 'scripts/superdesk-archive/views/item-state.html',
        scope: {
            'state': '=',
            'embargo': '='
        }
    };
}
