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
        'type': 1,
        'category': 1,
        'urgency': 1,
        'priority': 1,
        'source': 1,
        'credit': 1,
        'desk': 1,
        'genre': 1,
        'legal': 1,
        'sms': 1
    };

    var cvs = search.cvs;

    function tag(label, value) {
        return {
            label: label,
            value: value || label
        };
    }

    function initSelectedParameters(parameters) {
        tags.selectedParameters = [];
        while (parameters.indexOf(':') > 0 &&
               parameters.indexOf(':') < parameters.indexOf('(', parameters.indexOf(':')) &&
               parameters.indexOf(':') < parameters.indexOf(')', parameters.indexOf(':'))) {

            var colonIndex = parameters.indexOf(':');
            var parameter = parameters.substring(parameters.lastIndexOf(' ', colonIndex),
                parameters.indexOf(')', colonIndex) + 1);
            var added = false;

            cvs.forEach(cv => {
                if (parameter.indexOf(cv.id + '.qcode') !== -1) {
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

    /**
     * Parse $location.search and initialise tags for fields defined in the PARAMETERS.
     * @param {object} params - $location.search
     */
    function initParameters(params) {
        var selecteditems = [];

        _.each(PARAMETERS, function(value, key) {
            if (!angular.isDefined(params[key])) {
                return;
            }

            switch (key) {
            case 'original_creator':
                userList.getUser(params[key]).then(function(user) {
                    tags.selectedParameters.push(tag(value + ':' + user.display_name));
                }, function(error) {
                    tags.selectedParameters.push(tag(value + ':Unknown'));
                });
                break;
            case 'from_desk':
            case 'to_desk':
                tags.selectedParameters.push(tag(value + ':' +
                        desks.deskLookup[params[key].split('-')[0]].name));
                break;
            case 'company_codes':
            case 'subject':
                var processSelectedItems = function(selectedItems, codeList) {
                    _.forEach(selecteditems, function(selecteditem) {
                        var name = _.result(_.find(codeList, {qcode: selecteditem}), 'name');
                        if (name) {
                            tags.selectedParameters.push(tag(value + ':(' + name + ')'));
                        }
                    });
                };
                for (var i = 0; i < cvs.length; i++) {
                    var cv = cvs[i];
                    if (cv.field === key) {
                        var codeList = metadata.values[cv.list];
                        selecteditems = JSON.parse(params[key]);
                        processSelectedItems(selecteditems, codeList);
                    }
                }
                break;
            case 'spike':
                if (params[key]) {
                    tags.selectedParameters.push(tag(value));
                }
                break;
            case 'ingest_provider':
                tags.selectedParameters.push(tag(value + ':' + ingestSources.providersLookup[params[key]].name));
                break;
            default:
                tags.selectedParameters.push(tag(value + ':' + params[key]));
            }
        });
    }

    /**
     * Parses search parameters object and initialise tags for fields defined in the EXCLUDE_FACETS.
     * @param {object} params - $location.search
     */
    function initExcludedFacets(params) {
        _.each(EXCLUDE_FACETS, function(label, key) {
            if (!angular.isDefined(params[key])) {
                return;
            }

            tags.removedFacets[key] = [];
            var removedFacets = JSON.parse(params[key]);
            _.each(removedFacets, function(facet) {
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

                // Used by aap multimedia datalayer.
                if (type === 'credit') {
                    $location.search('creditqcode', null);
                }
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
        return desks.initialize().then(function(result) {
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

            _.forEach(tags.currentSearch, function(type, key) {
                if (key !== 'q' && !EXCLUDE_FACETS[key]) {
                    tags.selectedFacets[key] = [];

                    switch (key) {
                    case 'desk':
                        var selectedDesks = JSON.parse(type);
                        _.forEach(selectedDesks, function(selectedDesk) {
                            tags.selectedFacets[key].push({
                                label: desks.deskLookup[selectedDesk].name,
                                value: selectedDesk});
                        });
                        break;

                    case 'after':
                        if (type === 'now-24H') {
                            tags.selectedFacets.date = ['Last Day'];
                        } else if (type === 'now-1w') {
                            tags.selectedFacets.date = ['Last Week'];
                        } else if (type === 'now-1M') {
                            tags.selectedFacets.date = ['Last Month'];
                        }
                        break;

                    case 'scheduled_after':
                        if (type === 'now-8H') {
                            tags.selectedFacets.date = ['Scheduled in the Last 8 Hours'];
                        } else {
                            tags.selectedFacets.date = ['Scheduled in the Last Day'];
                        }
                        break;

                    case 'afterfirstcreated':
                        $location.search('after', null);
                        tags.selectedFacets.date = ['Created after ' + type];
                        break;

                    case 'beforefirstcreated':
                        $location.search('after', null);
                        tags.selectedFacets.date = ['Created before ' + type];
                        break;

                    case 'afterversioncreated':
                        $location.search('after', null);
                        tags.selectedFacets.date = ['Modified before ' + type];
                        break;

                    case 'beforeversioncreated':
                        $location.search('after', null);
                        tags.selectedFacets.date = ['Modified before ' + type];
                        break;

                    default:
                        if (FacetKeys[key]) {
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
