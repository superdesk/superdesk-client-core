export class BaseSortBar {
    scope: any;
    sortService: any;

    constructor(scope, elem, sortService) {
        this.scope = scope;
        this.sortService = sortService;
        this.scope.toggleDir = this.toggleDir.bind(this);
        this.scope.sort = this.sort.bind(this);
        this.scope.getActive = this.getActive.bind(this);
        this.scope.$on('$routeUpdate', this.scope.getActive);
    }

    getActive() {
        this.scope.active = this.sortService.getSort(this.scope.sortOptions);
    }

    toggleDir($event) {
        this.sortService.toggleSortDir(this.scope.sortOptions);
    }

    sort(field) {
        this.sortService.setSort(field, this.scope.sortOptions);
    }

    canSort() {
        return true;
    }
}
