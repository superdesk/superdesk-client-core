/**
 * @ngdoc controller
 * @module superdesk.apps.web_publisher
 * @name WebPublisherContentListsController
 * @requires publisher
 * @requires modal
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @description WebPublisherContentListsController holds a set of functions used for web publisher content listis
 */
WebPublisherContentListsController.$inject = ['$scope', 'publisher', 'modal'];
export function WebPublisherContentListsController($scope, publisher, modal) {
    class WebPublisherContentLists {
        constructor() {
            this.TEMPLATES_DIR = 'scripts/apps/web-publisher/views';
            publisher.setToken()
                .then(publisher.querySites)
                .then((sites) => {
                    this.sites = sites;
                    this.activeView = 'content-lists';
                    this.selectedTenant = '';
                    this.changeListFilter('');
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#changeTab
         * @param {String} newViewName - name of the active view
         * @description Sets the active view name to the given value
         */
        changeView(newViewName) {
            this.activeView = newViewName;
            if (newViewName === 'content-lists') {
                this.changeListFilter('');
                this._refreshLists();
            }
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#changeListFilter
         * @param {String} type - type of content lists
         * @description Sets type for content lists
         */
        changeListFilter(type) {
            this.listType = type;
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#setTenant
         * @param {Object} site
         * @description Sets tenant
         */
        setTenant(site) {
            publisher.setTenant(site);
            this.selectedTenant = site;
            this.changeListFilter('');
            this._refreshLists();
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#createListCard
         * @param {String} listType - type of content list
         * @description Creates a new unsaved content list card
         */
        createListCard(listType) {
            this.selectedList = {};
            $scope.newList = {type: listType, cacheLifeTime: 0};
            $scope.lists.push($scope.newList);
            this.listAdd = true;
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#editListCard
         * @param {Object} list - content list card which is edited
         * @description Edit content list card
         */
        editListCard(list) {
            this.selectedList = list;
            $scope.newList = angular.extend({}, list);
            this.listAdd = true;
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#cancelEditListCard
         * @description Canceling update of content list card
         */
        cancelEditListCard() {
            $scope.newList = angular.extend({}, this.selectedList);
            this.listAdd = false;
            if (!this.selectedList.id) {
                $scope.lists.pop();
            }
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#editListCardSettings
         * @param {Object} list - list for editing
         * @description Opens modal window for editing settings
         */
        editListCardSettings(list) {
            this.selectedList = list;
            $scope.newList = angular.extend({}, list);
            this.settingsModal = true;
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#cancelListCardSettings
         * @description Cancels editing settings for list
         */
        cancelListCardSettings() {
            this.selectedList = {};
            $scope.newList = {};
            this.settingsModal = false;
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#saveList
         * @description Creates content list
         */
        saveList() {
            let updatedKeys = this._updatedKeys($scope.newList, this.selectedList);

            publisher.manageList({content_list: _.pick($scope.newList, updatedKeys)}, this.selectedList.id)
                .then(this._refreshLists.bind(this));
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#saveManualList
         * @description Clears and saves state of manual content list
         */
        saveManualList() {
            publisher.saveManualList(
                {content_list: {items: $scope.newList.updatedItems, updated_at: $scope.newList.updatedAt}},
                $scope.newList.id).then((savedList) => {
                    $scope.newList.updatedAt = savedList.updatedAt;
                    $scope.newList.updatedItems = [];
                    this.listChangeFlag = false;
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#deleteList
         * @param {String} id - id of content list which is deleted
         * @description Deleting content list
         */
        deleteList(id) {
            modal.confirm(gettext('Please confirm you want to delete list.'))
                .then(() => {
                    publisher.removeList(id).then(this._refreshLists.bind(this));
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#openListCriteria
         * @param {Object} list - list for editing
         * @description Opens list criteria page
         */
        openListCriteria(list) {
            this.selectedList = list;
            $scope.newList = angular.extend({}, list);
            this.metadataList = [];
            this.selectedRoutes = [];
            if (!$scope.newList.filters) {
                $scope.newList.filters = {};
            }

            if ($scope.newList.filters.metadata) {
                angular.forEach($scope.newList.filters.metadata, (value, key) => {
                    this.metadataList.push({metaName: key, metaValue: value});
                });
            }

            publisher.queryRoutes().then((routes) => {
                $scope.routes = routes;

                if ($scope.newList.filters.route && $scope.newList.filters.route.length > 0) {
                    routes.forEach((item) => {
                        if ($scope.newList.filters.route.indexOf(item.id + '') !== -1) {
                            this.selectedRoutes.push(item);
                        }
                    });
                }
            });

            this.changeView(list.type === 'automatic' ? 'content-list-automatic' : 'content-list-manual');
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#saveListCriteria
         * @description Update criteria for content list
         */
        saveListCriteria() {
            var updatedFilters = _.pickBy($scope.newList.filters, _.identity);

            updatedFilters.metadata = {};
            this.metadataList.forEach((item) => {
                if (item.metaName) {
                    updatedFilters.metadata[item.metaName] = item.metaValue;
                }
            });

            delete updatedFilters.route;
            if (this.selectedRoutes.length > 0) {
                updatedFilters.route = [];
                this.selectedRoutes.forEach((item) => {
                    updatedFilters.route.push(item.id);
                });
            }

            /**
             * @ngdoc event
             * @name WebPublisherContentListsController#refreshListArticles
             * @eventType broadcast on $scope
             * @param {Object} $scope.newList - list which will refresf articles
             * @description event is thrown when criteria is updated
             */
            publisher.manageList({content_list: {filters: updatedFilters}}, this.selectedList.id)
                .then(() => $scope.$broadcast('refreshListArticles', $scope.newList));
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#filterArticles
         * @description
         */
        filterArticles() {
            let filters = _.pickBy($scope.newList.filters, _.identity);

            this.metadataList.forEach((item) => {
                if (item.metaName && item.metaValue) {
                    if (!filters['metadata[' + item.metaName + ']']) {
                        filters['metadata[' + item.metaName + ']'] = [];
                    }

                    filters['metadata[' + item.metaName + ']'].push(item.metaValue);
                }
            });

            delete filters.route;
            if (this.selectedRoutes.length > 0) {
                filters.route = [];
                this.selectedRoutes.forEach((item) => {
                    filters.route.push(item.id);
                });
            }
            /**
             * @ngdoc event
             * @name WebPublisherContentListsController#refreshArticles
             * @eventType broadcast on $scope
             * @param {Object} this.selectedRoutes - list of routes
             * @description event is thrown when filter criteria is updated
             */
            $scope.$broadcast('refreshArticles', filters);
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#addAuthor
         * @description Adds author in criteria filters list
         */
        addAuthor() {
            if (!$scope.newList.filters.author) {
                $scope.newList.filters.author = [];
            }

            $scope.newList.filters.author.push('');
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#removeAuthor
         * @param {Number} itemIdx - index of the item to remove
         * @description Removes author from criteria filters list
         */
        removeAuthor(itemIdx) {
            $scope.newList.filters.author.splice(itemIdx, 1);
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#addMetadata
         * @description Adds metadata in criteria filters list
         */
        addMetadata() {
            this.metadataList.push({metaName: '', metaValue: ''});
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#removeMetadata
         * @param {Number} itemIdx - index of the item to remove
         * @description Removes metadata from criteria filters list
         */
        removeMetadata(itemIdx) {
            this.metadataList.splice(itemIdx, 1);
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#_editMode
         * @private
         * @param {Object} card - card for which to check mode
         * @param {Object} selected - selected card(for edit)
         * @param {Boolean} addFlag - is card added
         * @returns {Boolean}
         * @description Checking if card is in edit mode
         */
        _editMode(card, selected, addFlag) {
            return !card.id || selected && card.id === selected.id && addFlag;
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#_updatedKeys
         * @private
         * @param {Object} a
         * @param {Object} b
         * @returns {Array}
         * @description Compares 2 objects and returns keys of fields that are updated
         */
        _updatedKeys(a, b) {
            return _.reduce(a, (result, value, key) => _.isEqual(value, b[key]) ? result : result.concat(key), []);
        }

        /**
         * @ngdoc method
         * @name WebPublisherContentListsController#_refreshLists
         * @private
         * @description Loads list of content lists
         */
        _refreshLists() {
            this.listAdd = false;
            this.listPaneOpen = false;
            this.settingsModal = false;
            publisher.queryLists().then((lists) => {
                $scope.lists = lists;
            });
        }
    }

    return new WebPublisherContentLists();
}
