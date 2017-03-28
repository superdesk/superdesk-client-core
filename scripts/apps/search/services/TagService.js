import {PARAMETERS, EXCLUDE_FACETS} from 'apps/search/constants';
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
 *
 * @description Provides set of methods to manipulate with tags in search bar
 */
TagService.$inject = ['$location', 'desks', 'userList', 'metadata', 'search', 'ingestSources', 'gettextCatalog'];
export function TagService($location, desks, userList, metadata, search, ingestSources, gettextCatalog) {
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
        sms: 1
    };

    var cvs = search.cvs;

    function tag(label, value) {
        return {
            label: label,
            value: value || label
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
    function initSelectedKeywords(kwds) {
        let keywords = kwds;

        tags.selectedKeywords = [];
        while (keywords.indexOf('(') >= 0 && keywords.indexOf(')') > 0) {
            var closeIndex = keywords.indexOf('(');
            var counter = 1;

            while (counter > 0 && closeIndex < keywords.length) {
                var c = keywords[++closeIndex];

                if (c === '(') {
                    counter++;
                } else if (c === ')') {
                    counter--;
                }
            }
            var keyword = keywords.substring(keywords.indexOf('('), closeIndex + 1);

            tags.selectedKeywords.push(keyword);
            keywords = keywords.replace(keyword, '');
        }
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
            ingestSources.providersLookup[index].name))
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
                    value: facet
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
        if (String(key).indexOf('Last') >= 0 || String(key).indexOf('after') >= 0
            || String(key).indexOf('before') >= 0) {
            removeDateFacet();
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
     * @description Removes the date search related tags by modifying the $location.search
     */
    function removeDateFacet() {
        var search = $location.search();

        if (search.after || search.afterfirstcreated || search.beforefirstcreated ||
                search.afterversioncreated || search.beforeversioncreated) {
            $location.search('after', null);
            $location.search('afterfirstcreated', null);
            $location.search('beforefirstcreated', null);
            $location.search('afterversioncreated', null);
            $location.search('beforeversioncreated', null);
        } else if (search.scheduled_after) {
            $location.search('scheduled_after', null);
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
        return desks.initialize().then((result) => {
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

            _.forEach(tags.currentSearch, (type, key) => {
                if (key === 'q' || EXCLUDE_FACETS[key]) {
                    return;
                }

                tags.selectedFacets[key] = [];

                switch (key) {
                case 'desk':
                    var selectedDesks = JSON.parse(type);

                    _.forEach(selectedDesks, (selectedDesk) => {
                        tags.selectedFacets[key].push({
                            label: desks.deskLookup[selectedDesk].name,
                            value: selectedDesk});
                    });
                    break;

                case 'after':
                    var dateForType = {
                        'now-24H': 'Last Day',
                        'now-1w': 'Last Week',
                        'now-1M': 'Last Month'
                    };

                    tags.selectedFacets.date = [dateForType[type]];
                    break;

                case 'scheduled_after':
                    tags.selectedFacets.date = ['Scheduled in the Last Day'];

                    if (type === 'now-8H') {
                        tags.selectedFacets.date = ['Scheduled in the Last 8 Hours'];
                    }
                    break;
                case 'creditqcode':
                    tags.selectedFacets.credit = JSON.parse(type);
                    break;
                default: {
                    const prefixForType = {
                        afterfirstcreated: 'Created after',
                        beforefirstcreated: 'Created before',
                        afterversioncreated: 'Modified before',
                        beforeversioncreated: 'Modified before'
                    };

                    const createdOrModified = (t) => Object.keys(prefixForType).indexOf(t) !== -1;

                    if (createdOrModified(type)) {
                        $location.search('after', null);
                        tags.selectedFacets.date = [`${prefixForType[type]} ${type}`];
                    } else if (FacetKeys[key]) {
                        tags.selectedFacets[key] = JSON.parse(type);
                    }
                }
                }
            });

            return tags;
        });
    }

    return {
        initSelectedFacets: initSelectedFacets,
        removeFacet: removeFacet
    };
}
