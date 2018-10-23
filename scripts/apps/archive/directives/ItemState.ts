export function ItemState() {
    return {
        templateUrl: 'scripts/apps/archive/views/item-state.html',
        scope: {
            state: '=',
            embargo: '=',
        },
    };
}
