import _ from 'lodash';

export const getDateFilters = (gettext) => [
    {
        labelBlock: gettext('Date created'),
        labelFrom: gettext('Created from'),
        labelTo: gettext('Created to'),
        fieldname: 'firstcreated',
        predefinedFilters: [
            {
                key: 'Last Day',
                label: gettext('Last Day'),
            },
            {
                key: 'Last Week',
                label: gettext('Last Week'),
            },
            {
                key: 'Last Month',
                label: gettext('Last Month'),
            },
        ],
        isEnabled: () => true,
    },
    {
        labelBlock: gettext('Date modified'),
        labelFrom: gettext('Modified from'),
        labelTo: gettext('Modified to'),
        fieldname: 'versioncreated',
        predefinedFilters: [
            {
                key: 'Last Day',
                label: gettext('Last Day'),
            },
            {
                key: 'Last Week',
                label: gettext('Last Week'),
            },
            {
                key: 'Last Month',
                label: gettext('Last Month'),
            },
        ],
        isEnabled: () => true,
    },
    {
        labelBlock: gettext('Date published'),
        labelFrom: gettext('Published from'),
        labelTo: gettext('Published to'),
        fieldname: 'firstpublished',
        predefinedFilters: [
            {
                key: 'Last Day',
                label: gettext('Last Day'),
            },
            {
                key: 'Last Week',
                label: gettext('Last Week'),
            },
            {
                key: 'Last Month',
                label: gettext('Last Month'),
            },
        ],
        isEnabled: () => true,
    },
    {
        labelBlock: gettext('Date scheduled'),
        labelFrom: null,
        labelTo: null,
        fieldname: 'schedule_settings.utc_publish_schedule',
        predefinedFilters: [
            {
                key: 'Last 24 Hours',
                label: gettext('Last 24 Hours'),
            },
            {
                key: 'Last 8 Hours',
                label: gettext('Last 8 Hours'),
            },
        ],
        isEnabled: (searchConfig) => searchConfig.scheduled,
    },
    {
        labelBlock: gettext('Compliant lifetime'),
        labelFrom: null,
        labelTo: gettext('Need review before'),
        fieldname: 'extra.compliantlifetime',
        predefinedFilters: [
            {
                key: 'Next month',
                label: gettext('Month'),
            },
            {
                key: 'Next 3 months',
                label: gettext('3 Months'),
            },
        ],
        isEnabled: () => false,
    },
];

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
            if (bucketCount.key === 'T' && bucketCount.doc_count > 0) {
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
            date: {},
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
    toggleFilter(type, key, fieldname) {
        if (this.hasFilter(type, key)) {
            this.removeFilter(type, key);
        } else if (type === 'date') {
            this.setDateFilter(key, fieldname);
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
     * @name sdSearchFilters#setDateFilter
     * @public
     * @description Set location url for date filters
     * @param {string} key Date key
     */
    setDateFilter(key, fieldname) {
        // Clean other date filters

        if (fieldname != null) {
            this.$location.search(fieldname, null);
            this.$location.search(fieldname + 'from', null);
            this.$location.search(fieldname + 'to', null);

            if (key === 'Last 8 Hours') {
                this.$location.search(fieldname, 'now-8H');
            } else if (key === 'Last 24 Hours') {
                this.$location.search(fieldname, 'now-24H');
            } else if (key === 'Last Day') {
                this.$location.search(fieldname, 'last_day');
            } else if (key === 'Last Week') {
                this.$location.search(fieldname, 'last_week');
            } else if (key === 'Last Month') {
                this.$location.search(fieldname, 'last_month');
            }
        } else {
            this.$location.search(fieldname, null);
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
