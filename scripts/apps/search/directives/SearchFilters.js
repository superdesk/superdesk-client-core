import _ from 'lodash';
import {getDateFilters} from './DateFilters';

class LinkFunction {
    constructor(desks, tags, $location, scope, elem, metadata, gettext) {
        this.scope = scope;
        this.elem = elem;
        this.tags = tags;
        this.$location = $location;
        this.desks = desks;
        this.scope.excludeFacet = this.excludeFacet.bind(this);
        this.scope.hasFilter = this.hasFilter.bind(this);
        this.scope.toggleFilter = this.toggleFilter.bind(this);
        this.scope.removeFilter = this.removeFilter.bind(this);
        this.scope.setFilter = this.setFilter.bind(this);
        this.scope.isEmpty = this.isEmpty.bind(this);
        this.scope.dateFilters = getDateFilters(gettext);
        this.scope.clearPredefinedFilters = this.clearPredefinedFilters.bind(this);
        this.scope.togglePredefinedDateFilter = this.togglePredefinedDateFilter.bind(this);
        this.scope.hasPredefinedDateFilter = this.hasPredefinedDateFilter.bind(this);
        this.aggregationsMapper = {
            genre: this._categoryMapper.bind(this),
            category: this._categoryMapper.bind(this),
            credit: this._creditMapper.bind(this),
            legal: this._legalMapper.bind(this),
            sms: this._legalMapper.bind(this),
            desk: this._deskMapper.bind(this),
            defaultMapper: this._defaultMapper.bind(this),
        };
        this.init();
        // fetch available languages
        metadata.initialize()
            .then(() => {
                if (metadata.values.languages) {
                    scope.languageLabel = {};
                    metadata.values.languages.forEach((language) => {
                        scope.languageLabel[language.qcode] = language.name;
                    });
                }
            });
    }

    hasPredefinedDateFilter(fieldname, filterValue) {
        return this.$location.search()[fieldname] === filterValue;
    }

    clearPredefinedFilters(fieldname) {
        this.$location.search(fieldname, null);
    }

    togglePredefinedDateFilter(fieldname, filterValue) {
        // clear exact range filters
        this.$location.search(fieldname + 'from', null);
        this.$location.search(fieldname + 'to', null);

        if (this.hasPredefinedDateFilter(fieldname, filterValue)) {
            this.clearPredefinedFilters(fieldname);
        } else {
            this.$location.search(fieldname, filterValue);
        }
    }


    /**
     * @ngdoc method
     * @public
     * @name sdSearchFilters#init
     * @description initialize directives
     */
    init() {
        this._initAggregations();

        this.scope.$watch('tags.currentSearch', (currentSearch) => {
            this.scope.showSaveSearch = !_.isEmpty(currentSearch);
        }, true);

        this.scope.$watch('items', () => {
            this.tags.initSelectedFacets().then((currentTags) => {
                this.scope.tags = currentTags;

                if (!this.scope.items || this.scope.items._aggregations === undefined) {
                    return;
                }

                this._initAggregations();

                let aggregationsKeys = ['type', 'category', 'genre', 'urgency',
                    'priority', 'source', 'credit', 'desk', 'legal', 'sms', 'language'];

                _.each(aggregationsKeys, (key) => {
                    if (_.get(this.scope.items._aggregations, key)) {
                        if (key in this.aggregationsMapper) {
                            this.aggregationsMapper[key](key);
                        } else {
                            this.aggregationsMapper.defaultMapper(key);
                        }
                    }
                });
            });
        });
    }

    /**
     * @ngdoc method
     * @private
     * @name sdSearchFilters#_categoryMapper
     * @description maps aggregations for category and genre
     */
    _categoryMapper(key) {
        _.each(this.scope.items._aggregations[key].buckets, (bucketCount) => {
            if (bucketCount.key !== '') {
                this.scope.aggregations[key][bucketCount.key] = bucketCount.doc_count;
            }
        });
    }

    /**
     * @ngdoc method
     * @private
     * @name sdSearchFilters#_creditMapper
     * @description maps aggregations for credit
     */
    _creditMapper(key) {
        _.each(this.scope.items._aggregations[key].buckets, (bucketCount) => {
            this.scope.aggregations[key][bucketCount.key] = {
                count: bucketCount.doc_count,
                qcode: bucketCount.qcode,
            };
        });
    }

    /**
     * @ngdoc method
     * @private
     * @name sdSearchFilters#_legalMapper
     * @description maps aggregations for legal
     */
    _legalMapper(key) {
        _.each(this.scope.items._aggregations[key].buckets, (bucketCount) => {
            if ((bucketCount.key === 'T' || bucketCount.key === 1) && bucketCount.doc_count > 0) {
                this.scope.aggregations[key] = {count: bucketCount.doc_count};
            }
        });
    }

    /**
     * @ngdoc method
     * @private
     * @name sdSearchFilters#_defaultMapper
     * @description maps aggregations for source, urgency, type
     */
    _defaultMapper(key) {
        _.each(this.scope.items._aggregations[key].buckets, (bucketCount) => {
            this.scope.aggregations[key][bucketCount.key] = bucketCount.doc_count;
        });
    }

    /**
     * @ngdoc method
     * @private
     * @name sdSearchFilters#_deskMapper
     * @description map desk aggregations
     */
    _deskMapper(key) {
        _.each(this.scope.items._aggregations[key].buckets, (bucketCount) => {
            let lookedUpDesk = this.desks.deskLookup[bucketCount.key];

            if (typeof lookedUpDesk === 'undefined') {
                var msg = [
                    'Desk (key: ', bucketCount.key, ') not found in ',
                    'deskLookup, probable storage inconsistency.',
                ].join('');

                console.warn(msg);
                return;
            }

            this.scope.aggregations[key][lookedUpDesk.name] = {
                count: bucketCount.doc_count,
                id: bucketCount.key,
            };
        });
    }

    /**
     * @ngdoc method
     * @private
     * @name sdSearchFilters#_initAggregations
     * @description initialize aggregations
     */
    _initAggregations() {
        this.scope.aggregations = {
            type: {},
            desk: {},
            source: {},
            credit: {},
            category: {},
            urgency: {},
            priority: {},
            genre: {},
            legal: {},
            sms: {},
            language: {},
        };
    }

    /**
     * @ngdoc method
     * @public
     * @name sdSearchFilters#toggleFilter
     * @param {String} type - facet type
     * @param {String} key - facet value
     * @param {String?} fieldname
     */
    toggleFilter(type, key) {
        if (this.hasFilter(type, key)) {
            this.removeFilter(type, key);
        } else {
            this.setFilter(type, key);
        }
    }

    /**
     * @ngdoc method
     * @public
     * @name sdSearchFilters#excludeFacet
     * @description Removes the facets from the list of facets by changing the url
     * It adds the parameters to the url as: notdesk=['123','456']&nottype=['type','composite']
     * Change in location triggers request to 'search' endpoint.
     * @param {String} type - facet type
     * @param {String} key - facet value
     * @param {object} evt - click event
     */
    excludeFacet(type, key, evt) {
        if (this.hasFilter(type, key)) {
            // If the filter is selected then the filter is unselected and filter is removed.
            this.removeFilter(type, key);
        }

        this.setUrlParameter('not' + type, key);
        evt.stopPropagation();
    }

    /**
     * @ngdoc method
     * @public
     * @name sdSearchFilters#removeFilter
     * @description Removes the tags
     * @param type - facet type
     * @param key - facet value
     */
    removeFilter(type, key) {
        this.tags.removeFacet(type, key);
    }

    /**
     * @ngdoc method
     * @public
     * @name sdSearchFilters#setFilter
     * @description Filter the results further using the facets.
     * It changes the url based on the facet selected: desk=['123,'456']&type=['type','composite']
     * Change in location triggers request to 'search' endpoint.
     * @param {String} type - facet type
     * @param {String} key - facet value
     */
    setFilter(type, key) {
        if (!this.isEmpty(type) && key) {
            this.setUrlParameter(type, key);
        } else {
            this.$location.search(type, null);
        }
    }

    /**
     * @ngdoc method
     * @public
     * @name sdSearchFilters#setUrlParameter
     * @description Add parameter to the url.
     * @param {String} type - facet type
     * @param {String} key - facet value
     */
    setUrlParameter(type, key) {
        var currentKeys = this.$location.search()[type];

        if (currentKeys) {
            currentKeys = JSON.parse(currentKeys);
            currentKeys.push(key);
            this.$location.search(type, JSON.stringify(currentKeys));
        } else if (type === 'credit') {
            this.$location.search('creditqcode',
                JSON.stringify([{label: key, value: this.scope.aggregations.credit[key].qcode}]));
        } else {
            this.$location.search(type, JSON.stringify([key]));
        }
    }

    /**
     * @ngdoc method
     * @name sdSearchFilters#isEmpty
     * @public
     * @description check if aggregations are returned in the response
     * @param {string} type Aggregations type
     */
    isEmpty(type) {
        return _.isEmpty(this.scope.aggregations[type]);
    }

    /**
     * @ngdoc method
     * @public
     * @name sdSearchFilters#format
     * @description formats the date
     */
    format(date) {
        return date ? moment(date).format('YYYY-MM-DD') : null; // jshint ignore:line
    }

    /**
     * @ngdoc method
     * @name sdSearchFilters#hasFilter
     * @public
     * @description check if has filter defined.
     * @param {string} type Aggregations type
     * @param {string} key Aggregations key
     * @return {boolean}
     */
    hasFilter(type, key) {
        if (!this.scope.tags || !this.scope.tags.selectedFacets[type]) {
            return false;
        }

        const facet = this.scope.tags.selectedFacets[type];
        const isValue = _.find(facet, (f) => f.value === key);
        const isLabel = _.find(facet, (f) => f.label === key);

        return isValue || isLabel || facet.indexOf(key) >= 0;
    }
}


/**
 * @ngdoc directive
 * @module superdesk.apps.content-api
 * @name sdSearchFilters
 * @requires desks
 * @requires tags
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @description sd-search-filters handles filtering using aggregates in the
 * left hand side panel of Global search page, archive search page and content api search.
 */
export function SearchFilters(desks, tags, $location, metadata, gettext) {
    return {
        template: require('scripts/apps/search/views/search-filters.html'),
        link: (scope, elem) => new LinkFunction(desks, tags, $location, scope, elem, metadata, gettext),
    };
}

SearchFilters.$inject = ['desks', 'tags', '$location', 'metadata', 'gettext'];
