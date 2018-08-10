import {PARAMETERS, EXCLUDE_FACETS} from 'apps/search/constants';
import {getDateFilters} from '../directives/SearchFilters';
/**
 * @ngdoc service
 * @module superdesk.apps.search
 * @name tags
 *
 * @requires $location
 * @requires desks
 * @requires userList
 * @requires metadata
 * @requires search
 * @requires ingestSources
 * @requires gettextCatalog
 * @requires subscribersService
 * @requires $q
 *
 * @description Provides set of methods to manipulate with tags in search bar
 */
TagService.$inject = ['$location', 'desks', 'userList', 'metadata', 'search',
    'ingestSources', 'gettextCatalog', 'subscribersService', '$q', 'gettext'];
export function TagService($location, desks, userList, metadata, search,
    ingestSources, gettextCatalog, subscribersService, $q, gettext) {
    var tags = {};

    tags.selectedFacets = {};
    tags.selectedParameters = [];
    tags.selectedKeywords = [];
    tags.currentSearch = {};
    tags.removedFacets = {};

    var FacetKeys = {
        type: 1,
        category: 1,
        urgency: 1,
        priority: 1,
        source: 1,
        credit: 1,
        desk: 1,
        genre: 1,
        legal: 1,
        sms: 1,
        language: 1,
    };

    var cvs = search.cvs;

    function tag(label, value) {
        return {
            label: label,
            value: value || label,
        };
    }

    function initSelectedParameters(params) {
        let parameters = params;

        tags.selectedParameters = [];
        while (parameters.indexOf(':') > 0 &&
               parameters.indexOf(':') < parameters.indexOf('(', parameters.indexOf(':')) &&
               parameters.indexOf(':') < parameters.indexOf(')', parameters.indexOf(':'))) {
            var colonIndex = parameters.indexOf(':');
            var parameter = parameters.substring(parameters.lastIndexOf(' ', colonIndex),
                parameters.indexOf(')', colonIndex) + 1);
            var added = false;

            cvs.forEach((cv) => {
                if (parameter.indexOf(cv.id) !== -1) {
                    var value = parameter.substring(parameter.indexOf('(') + 1, parameter.lastIndexOf(')')),
                        codeList = metadata.values[cv.list],
                        name = _.result(_.find(codeList, {qcode: value}), 'name');

                    if (name) {
                        tags.selectedParameters.push(tag(cv.id + '.name:(' + name + ')'));
                        added = true;
                    }
                }
            });

            if (!added) {
                var paramArr = parameter.split(':');
                var parameterTranslated = gettextCatalog.getString(paramArr[0]) + ':' + paramArr[1];

                tags.selectedParameters.push(tag(parameterTranslated, paramArr.join(':')));
            }

            parameters = parameters.replace(parameter, '');
        }

        return parameters;
    }

    /*
     * function to parse search input from the search bar.
     */
    function initSelectedKeywords(keywords) {
        tags.selectedKeywords = keywords ? keywords.split(' ') : [];
    }

    function processFromToDesk(index, value) {
        tags.selectedParameters.push(tag(value + ':' +
            desks.deskLookup[index.split('-')[0]].name));
    }

    function processMetadataFields(index, value, key) {
        var processSelectedItems = (selectedItems, codeList) => {
            _.forEach(selectedItems, (selecteditem) => {
                var name = _.result(_.find(codeList, {qcode: selecteditem}), 'name');

                if (name) {
                    tags.selectedParameters.push(tag(value + ':(' + name + ')'));
                }
            });
        };

        cvs.forEach((cv) => {
            if (cv.id !== key) {
                return;
            }

            var codeList = metadata.values[cv.list];
            var selecteditems = JSON.parse(index);

            processSelectedItems(selecteditems, codeList);
        });
    }

    /**
     * @ngdoc object
     * @name tags#fieldProcessors
     * @private
     * @description field:action mapper for parsing fields used in parameters
     */
    var fieldProcessors = {
        original_creator: (index, value) => {
            userList.getUser(index).then((user) => {
                tags.selectedParameters.push(tag(value + ':' + user.display_name));
            }, (error) => {
                tags.selectedParameters.push(tag(value + ':Unknown'));
            });
        },
        from_desk: processFromToDesk,
        to_desk: processFromToDesk,
        marked_desks: (index, value) => {
            JSON.parse(index).forEach((id) => {
                tags.selectedParameters.push(tag(value + ':' + desks.deskLookup[id].name));
            });
        },
        company_codes: processMetadataFields,
        subject: processMetadataFields,
        spike: (index, value) => index !== 'exclude' ? tags.selectedParameters.push(tag(value + ':' + index)) : null,
        featuremedia: processBooleanTags,
        ingest_provider: (index, value) => tags.selectedParameters.push(tag(value + ':' +
            ingestSources.providersLookup[index].name)),
        subscriber: (index, value) => {
            let subscriberName = _.get(subscribersService, 'subscribersLookup.' + index + '.name', ':Unknown');

            tags.selectedParameters.push(tag(value + ':' + subscriberName, value));
        },
    };

    /**
     * @ngdoc method
     * @name tags#processBooleanTags
     * @private
     * @param: {boolean} value
     * @param: {string} label Value to be displayed for the tag
     * @description Add boolean tags to selected parameters.
     */
    function processBooleanTags(value, label) {
        if (value) {
            tags.selectedParameters.push(tag(label));
        }
    }

    /**
     * Parse $location.search and initialise tags for fields defined in the PARAMETERS.
     * @param {object} params - $location.search
     */
    function initParameters(params) {
        _.each(PARAMETERS, (value, key) => {
            if (!angular.isDefined(params[key])) {
                return;
            }

            if (key in fieldProcessors) {
                fieldProcessors[key](params[key], value, key);
            } else {
                tags.selectedParameters.push(tag(value + ':' + params[key]));
            }
        });

        angular.forEach(cvs, (cv) => {
            if (params[cv.id] && cv.field !== cv.id) {
                processMetadataFields(params[cv.id], cv.name, cv.id);
            }
        });
    }

    /**
     * Parses search parameters object and initialise tags for fields defined in the EXCLUDE_FACETS.
     * @param {object} params - $location.search
     */
    function initExcludedFacets(params) {
        _.each(EXCLUDE_FACETS, (label, key) => {
            if (!angular.isDefined(params[key])) {
                return;
            }

            tags.removedFacets[key] = [];
            var removedFacets = JSON.parse(params[key]);

            _.each(removedFacets, (facet) => {
                // Tags will display the desk name but the $location.search object has desk id.
                var displayValue = key === 'notdesk' ? desks.deskLookup[facet].name : facet;

                tags.removedFacets[key].push({
                    label: label,
                    displayValue: displayValue,
                    value: facet,
                });
            });
        });
    }

    /**
     * Removes the tags by modifying the $location.search
     * @param {String} type
     * @param {String} key
     */
    function removeFacet(type, key) {
        const dateFilter = getDateFilters(gettext).find(
            ({labelBlock, labelFrom, labelTo}) => [labelBlock, labelFrom, labelTo].includes(type)
        );

        if (dateFilter != null) {
            removeDateFacet(type, dateFilter);
        } else {
            var search = $location.search();

            if (search[type]) {
                var keys = JSON.parse(search[type]);

                keys.splice(keys.indexOf(key), 1);
                if (keys.length > 0) {
                    $location.search(type, JSON.stringify(keys));
                } else {
                    $location.search(type, null);
                }
            }

            // Used by aap multimedia datalayer.
            if (type === 'credit') {
                $location.search('creditqcode', null);
            }
        }
    }

    /**
     * @ngdoc method
     * @name tags#initSelectedFacets
     * @private
     * @param {String} key
     * @param {Object} dateFilter
     * @description Removes the date search related tags by modifying the $location.search
     */
    function removeDateFacet(key, dateFilter) {
        if (dateFilter != null) {
            const {fieldname} = dateFilter;

            if (key === dateFilter.labelFrom) {
                $location.search(fieldname + 'from', null);
            } else if (key === dateFilter.labelTo) {
                $location.search(fieldname + 'to', null);
            } else {
                $location.search(fieldname, null);
            }
        } else if (search[key]) {
            $location.search(key, null);
        }
    }

    /**
     * @ngdoc method
     * @name tags#initSelectedFacets
     * @private
     * @description Parses search parameters object and create tags
     * @return {Promise} List of items
     */
    function initSelectedFacets() {
        let promises = $q.all([desks.initialize(), subscribersService.initialize()]);

        return promises.then((result) => {
            tags.selectedFacets = {};
            tags.selectedParameters = [];
            tags.selectedKeywords = [];
            tags.removedFacets = {};
            tags.currentSearch = $location.search();

            var parameters = tags.currentSearch.q;

            if (parameters) {
                var keywords = initSelectedParameters(parameters);

                initSelectedKeywords(keywords);
            }

            initParameters(tags.currentSearch);
            initExcludedFacets(tags.currentSearch);

            const dateFilters = getDateFilters(gettext);

            /* eslint-disable complexity */
            _.forEach(tags.currentSearch, (type, key) => {
                if (key === 'q' || EXCLUDE_FACETS[key]) {
                    return;
                }

                if (key === 'desk') {
                    tags.selectedFacets[key] = [];

                    var selectedDesks = JSON.parse(type);

                    _.forEach(selectedDesks, (selectedDesk) => {
                        tags.selectedFacets[key].push({
                            label: desks.deskLookup[selectedDesk].name,
                            value: selectedDesk});
                    });
                } else if (key === 'language') {
                    tags.selectedFacets[key] = [];

                    const selected = JSON.parse(type);
                    const languages = metadata.values.languages || [];

                    selected.forEach((code) => {
                        tags.selectedFacets[key].push({
                            label: (languages.find((l) => l.qcode === code) || {}).name || code,
                            value: code,
                        });
                    });
                } else if (dateFilters.some(({fieldname}) => fieldname === key)) {
                    var dateForType = {
                        'now-8H': 'Last 8 Hours',
                        'now-24H': 'Last 24 hours',
                        last_day: 'Last Day',
                        last_week: 'Last Week',
                        last_month: 'Last Month',
                    };

                    const dateFilter = dateFilters.find(({fieldname}) => fieldname === key);

                    tags.selectedFacets[dateFilter.labelBlock] = [dateForType[type]];
                } else if (key === 'creditqcode') {
                    tags.selectedFacets.credit = JSON.parse(type);
                } else {
                    const dateFilter = dateFilters.find(
                        ({fieldname}) => key === fieldname + 'from' || key === fieldname + 'to'
                    );

                    if (dateFilter != null) {
                        // remove predefined filters like 'last day', 'last week'
                        $location.search(dateFilter.fieldname, null);

                        if (key === dateFilter.fieldname + 'to') {
                            tags.selectedFacets[dateFilter.labelTo] = [type];
                        } else {
                            tags.selectedFacets[dateFilter.labelFrom] = [type];
                        }
                    } else if (FacetKeys[key]) {
                        tags.selectedFacets[key] = JSON.parse(type);
                    }
                }
            });

            return tags;
        });
    }

    return {
        initSelectedFacets: initSelectedFacets,
        removeFacet: removeFacet,
    };
}
