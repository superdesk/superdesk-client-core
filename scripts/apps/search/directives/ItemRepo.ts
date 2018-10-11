ItemRepo.$inject = [];
export function ItemRepo() {
    return {
        scope: {
            repo: '=',
            context: '=',
            toggleRepo: '=',
        },
        template: require('../views/item-repo.html'),
    };
}
