/**
 * @ngdoc controller
 * @module superdesk.apps.authoring.compare_versions
 * @name CompareVersionsController
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires compareVersions
 * @requires lock
 * @description CompareVersionsController provides boards to display item's versions and
 * provides set of convenience functions used by compare-versions screen.
 */
export default class CompareVersionsController {
    compareVersions: any;
    lock: any;
    $scope: any;

    constructor($scope, compareVersions, lock) {
        this.compareVersions = compareVersions;
        this.lock = lock;
        this.$scope = $scope;

        this.init();
    }

    /**
     * @ngdoc method
     * @name CompareVersionsController#init
     * @description Initializes the controller with default values for the scope
     * and with necessary watcher.
     */
    init() {
        this.$scope.minBoards = this.compareVersions.minBoards();

        this.$scope.$watch(() => this.compareVersions.items, (items) => {
            this.$scope.boards = items;
        }, true);

        this.$scope.closeBoard = this.closeBoard.bind(this);
        this.$scope.closeScreen = this.closeScreen.bind(this);
    }

    /**
     * @ngdoc method
     * @name CompareVersionsController#closeBoard
     * @param {Integer} board - The board index.
     * @description Closes the board panel at provided board index.
     */
    closeBoard(board) {
        this.compareVersions.close(board);
    }

    /**
     * @ngdoc method
     * @name CompareVersionsController#closeScreen
     * @description Closes the compare-versions screen.
     */
    closeScreen() {
        this.compareVersions.exit();
    }
}

CompareVersionsController.$inject = ['$scope', 'compareVersions', 'lock'];
