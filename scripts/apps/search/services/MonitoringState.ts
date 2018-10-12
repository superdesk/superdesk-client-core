/**
 * Monitoring state - keeps information required to render lists.
 */
MonitoringState.$inject = ['$q', '$rootScope', 'ingestSources', 'desks', 'highlightsService', 'content', 'metadata'];
export function MonitoringState($q, $rootScope, ingestSources, desks, highlightsService, content, metadata) {
    this.init = init;
    this.state = {};
    this.setState = setState;
    this.moveActiveGroup = moveActiveGroup;

    // reset state on every page change
    $rootScope.$on('$routeChangeSuccess', reset);

    var self = this;
    var ready;

    /**
     * Update state
     *
     * @param {Object} updates
     */
    function setState(updates) {
        self.state = angular.extend({}, self.state, updates);
    }

    /**
     * Reset monitoring state
     */
    function reset() {
        self.state = {};
        ready = null;
    }

    /**
     * Init state for react rendering
     */
    function init() {
        if (!ready) {
            ready = $q.all({
                ingestProvidersById: ingestSources.initialize().then(() => {
                    setState({ingestProvidersById: ingestSources.providersLookup});
                }),
                desksById: desks.initialize().then(() => {
                    setState({desksById: desks.deskLookup});
                }),
                usersById: setState({usersById: desks.userLookup}),
                highlightsById: highlightsService.get().then((result) => {
                    var highlightsById = {};

                    result._items.forEach((item) => {
                        highlightsById[item._id] = item;
                    });
                    setState({highlightsById: highlightsById});
                }),
                markedDesksById: desks.fetchDesks().then((result) => {
                    var markedDesksById = {};

                    result._items.forEach((item) => {
                        markedDesksById[item._id] = item;
                    });
                    setState({markedDesksById: markedDesksById});
                }),
                profilesById: content.getTypesLookup().then((profilesLookup) => {
                    setState({profilesById: profilesLookup});
                }),

                // populates cache for mark for highlights activity dropdown
                deskHighlights: highlightsService.get(desks.getCurrentDeskId()),

                metadata: metadata.initialize(),
            });
        }

        return ready;
    }

    /**
     * Move active group up/down
     *
     * @param {Integer} diff
     */
    function moveActiveGroup(diff) {
        var groups = self.state.groups;
        var next = groups.indexOf(self.state.activeGroup) + diff;

        if (next >= groups.length) {
            next = 0;
        } else if (next < 0) {
            next = groups.length - 1;
        }

        setState({activeGroup: groups[next]});
    }
}
