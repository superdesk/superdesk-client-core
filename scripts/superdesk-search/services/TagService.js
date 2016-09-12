import { PARAMETERS } from 'superdesk-search/constants';

TagService.$inject = ['$location', 'desks', 'userList', 'metadata', 'search', 'ingestSources', 'gettextCatalog'];
export function TagService($location, desks, userList, metadata, search, ingestSources, gettextCatalog) {
    var tags = {};
    tags.selectedFacets = {};
    tags.selectedParameters = [];
    tags.selectedKeywords = [];
    tags.currentSearch = {};

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

    function initSelectedParameters (parameters) {
        tags.selectedParameters = [];
        while (parameters.indexOf(':') > 0 &&
               parameters.indexOf(':') < parameters.indexOf('(', parameters.indexOf(':')) &&
               parameters.indexOf(':') < parameters.indexOf(')', parameters.indexOf(':'))) {

            var colonIndex = parameters.indexOf(':');
            var parameter = parameters.substring(parameters.lastIndexOf(' ', colonIndex), parameters.indexOf(')', colonIndex) + 1);
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
    function initSelectedKeywords (keywords) {
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

    function initParameters(params) {
        _.each(PARAMETERS, function(value, key) {
            if (angular.isDefined(params[key])) {
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
                        var processSelectedItems = function (selectedItems, codeList) {
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
                                var selecteditems = JSON.parse(params[key]);
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
                        tags.selectedParameters.push(value + ':' + ingestSources.providersLookup[params[key]].name);
                        break;
                    default:
                        tags.selectedParameters.push(tag(value + ':' + params[key]));
                }
            }
        });
    }

    function removeFacet (type, key) {
        if (String(key).indexOf('Last') >= 0) {
            removeDateFacet();
        } else {
            var search = $location.search();
            if (search[type]) {
                var keys = JSON.parse(search[type]);
                keys.splice(keys.indexOf(key), 1);
                if (keys.length > 0)
                {
                    $location.search(type, JSON.stringify(keys));
                } else {
                    $location.search(type, null);
                }
                if (type === 'credit') {
                    $location.search('creditqcode', null);
                }
            }
        }
    }

    function removeDateFacet () {
        var search = $location.search();
        if (search.after) {
            $location.search('after', null);
        } else if (search.scheduled_after) {
            $location.search('scheduled_after', null);
        }
    }

    function initSelectedFacets () {
        return desks.initialize().then(function(result) {
            tags.selectedFacets = {};
            tags.selectedParameters = [];
            tags.selectedKeywords = [];
            tags.currentSearch = $location.search();

            var parameters = tags.currentSearch.q;
            if (parameters) {
                var keywords = initSelectedParameters(parameters);
                initSelectedKeywords(keywords);
            }

            initParameters(tags.currentSearch);

            _.forEach(tags.currentSearch, function(type, key) {
                if (key !== 'q') {
                    tags.selectedFacets[key] = [];

                    if (key === 'desk') {
                        var selectedDesks = JSON.parse(type);
                        _.forEach(selectedDesks, function(selectedDesk) {
                            tags.selectedFacets[key].push(desks.deskLookup[selectedDesk].name);
                        });
                    } else if (key === 'after') {

                        if (type === 'now-24H') {
                            tags.selectedFacets.date = ['Last Day'];
                        } else if (type === 'now-1w'){
                            tags.selectedFacets.date = ['Last Week'];
                        } else if (type === 'now-1M'){
                            tags.selectedFacets.date = ['Last Month'];
                        }
                    } else if (key === 'scheduled_after') {
                        if (type === 'now-8H') {
                            tags.selectedFacets.date = ['Scheduled in the Last 8 Hours'];
                        } else {
                            tags.selectedFacets.date = ['Scheduled in the Last Day'];
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
        removeFacet: removeFacet
    };
}
