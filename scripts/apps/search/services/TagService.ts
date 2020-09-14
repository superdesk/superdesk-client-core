import _ from 'lodash';
import {getParameters, getExcludeFacets} from 'apps/search/constants';
import {getDateFilters, getDateRangesByKey} from '../directives/DateFilters';
import {gettext} from 'core/utils';
import {getUserInterfaceLanguage} from 'appConfig';

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
 * @requires subscribersService
 * @requires $q
 *
 * @description Provides set of methods to manipulate with tags in search bar
 */
TagService.$inject = ['$location', 'desks', 'userList', 'metadata', 'search',
    'ingestSources', 'subscribersService', '$q'];
export function TagService($location, desks, userList, metadata, search,
    ingestSources, subscribersService, $q) {
    const PARAMETERS = getParameters();
    const EXCLUDE_FACETS = getExcludeFacets();
    var tags: any = {};

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

    function tag(label: string, value: string) {
        return {
            label: label,
            value: value,
        };
    }

    function getParamObject(paramArray: Array<string>) {
        const key = paramArray[0].trim();
        // remove parentheses ex: "(two)" becomes "two"
        const value = paramArray[1].replace(/^\(|\)$/g, '');

        return {[key]: value};
    }

    /**
    * @param params search parameters
    * @param objectOnly A boolean to decide what needs to be returned
    */
    function initSelectedParameters(params, objectOnly?: boolean) {
        let parameters = params;

        let selectedParameters = [];
        const paramObject = {};

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
                        const tagValue = cv.id + '.name:(' + name + ')';

                        selectedParameters.push(tag(tagValue, tagValue));
                        added = true;
                    }
                }
            });

            if (!added) {
                var paramArr = parameter.split(':');

                Object.assign(paramObject, getParamObject(paramArr));
                var parameterTranslated = gettext(paramArr[0]) + ':' + paramArr[1];

                selectedParameters.push(tag(parameterTranslated, paramArr.join(':')));
            }

            parameters = parameters.replace(parameter, '');
        }

        if (objectOnly) {
            return paramObject;
        } else {
            tags.selectedParameters = selectedParameters;
            return parameters;
        }
    }

    /*
     * function to parse search input from the search bar.
     */
    function initSelectedKeywords(keywords) {
        tags.selectedKeywords = keywords ? keywords.split(' ') : [];
    }

    function processFromToDesk(index, value) {
        const tagValue = value + ':' + desks.deskLookup[index.split('-')[0]].name;

        tags.selectedParameters.push(tag(tagValue, tagValue));
    }

    function processMetadataFields(index, value, key) {
        var processSelectedItems = (selectedItems, codeList) => {
            _.forEach(selectedItems, (selecteditem) => {
                const vocabularyItem = codeList.find(({qcode}) => qcode === selecteditem);

                if (vocabularyItem?.name) {
                    const vocabularyNameTranslated = metadata.getLocaleName(vocabularyItem, {});
                    const tagLabel = `${value}:(${vocabularyNameTranslated})`;
                    const tagValue = `${value}:(${vocabularyItem.name})`;

                    tags.selectedParameters.push(tag(tagLabel, tagValue));
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

    function getDatePublishedFilter(index, key) {
        let label = Object.keys(PARAMETERS).includes(key) ? PARAMETERS[key] : null;
        let dateFilterLabel = getDateFilters().find((dateFilter) => dateFilter.labelBlock === label);
        let predefinedLabel = dateFilterLabel?.predefinedFilters
            .find((predefinedFilter) => predefinedFilter.key === index);

        return label && predefinedLabel
            ? (() => {
                const tagValue = label + ': ' + predefinedLabel.label;

                return tag(tagValue, tagValue);
            })()
            : (() => {
                const tagValue = label + ': ' + index;

                return tag(tagValue, tagValue);
            })();
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
                const tagValue = value + ':' + user.display_name;

                tags.selectedParameters.push(tag(tagValue, tagValue));
            }, (error) => {
                const tagValue = value + ':Unknown';

                tags.selectedParameters.push(tag(tagValue, tagValue));
            });
        },
        from_desk: processFromToDesk,
        to_desk: processFromToDesk,
        marked_desks: (index, value) => {
            JSON.parse(index).forEach((id) => {
                const tagValue = value + ':' + desks.deskLookup[id].name;

                tags.selectedParameters.push(tag(tagValue, tagValue));
            });
        },
        company_codes: processMetadataFields,
        subject: processMetadataFields,
        spike: (index, value) => {
            const tagValue = value + ':' + index;

            return index !== 'exclude' ? tags.selectedParameters.push(tag(tagValue, tagValue)) : null;
        },
        featuremedia: processBooleanTags,
        ingest_provider: (index, value) => {
            const tagValue = value + ':' + ingestSources.providersLookup[index].name;

            return tags.selectedParameters.push(tag(tagValue, tagValue));
        },
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
            const tagValue = label;

            tags.selectedParameters.push(tag(tagValue, tagValue));
        }
    }

    /**
     * Parse $location.search and initialise tags for fields defined in the PARAMETERS.
     * @param {object} params - $location.search
     */
    function initParameters(params, urlParams, dateFilters) {
        const parameters = urlParams || PARAMETERS;
        let dateFilterTags = [];

        dateFilters.forEach((dateFilter) => {
            dateFilterTags.push(dateFilter.fieldname);
            dateFilterTags.push(dateFilter.fieldname + 'to');
            dateFilterTags.push(dateFilter.fieldname + 'from');
        });

        _.each(parameters, (value, key) => {
            if (!angular.isDefined(params[key])) {
                return;
            }

            if (key in fieldProcessors) {
                fieldProcessors[key](params[key], value, key);
            } else if (dateFilterTags.includes(key)) {
                if (metadata.search_config[key]
                    || metadata.search_config[key.split('from')[0]]
                    || metadata.search_config[key.split('to')[0]]) {
                    tags.selectedParameters.push(getDatePublishedFilter(params[key], key));
                }
            } else {
                const tagValue = value + ':' + params[key];

                tags.selectedParameters.push(tag(tagValue, tagValue));
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
        const dateFilter = getDateFilters().find(
            ({labelBlock, labelFrom, labelTo}) => [labelBlock, labelFrom, labelTo].includes(type),
        );

        if (dateFilter != null) {
            removeDateFacet(type, dateFilter);
        } else {
            var _search = $location.search();

            if (_search[type]) {
                var keys = JSON.parse(_search[type]);

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
    function initSelectedFacets(urlParams) {
        let promises = $q.all([desks.initialize(), subscribersService.initialize()]);

        return promises.then((result) => {
            tags.selectedFacets = {};
            tags.selectedParameters = [];
            tags.selectedKeywords = [];
            tags.removedFacets = {};
            tags.currentSearch = $location.search();
            tags.commonTags = [];

            var parameters = tags.currentSearch.q;

            if (parameters) {
                var keywords = initSelectedParameters(parameters);

                initSelectedKeywords(keywords);
            }

            const dateFilters = getDateFilters();

            initParameters(tags.currentSearch, urlParams, dateFilters);
            initExcludedFacets(tags.currentSearch);

            dateFilters.forEach((dateFilter) => {
                if (metadata.search_config && metadata.search_config[dateFilter.fieldname]) {
                    if (!tags.commonTags.includes(dateFilter.labelBlock)) {
                        tags.commonTags.push(dateFilter.fieldname);
                    }
                    if (!tags.commonTags.includes(dateFilter.labelFrom)) {
                        tags.commonTags.push(dateFilter.fieldname + 'from');
                    }
                    if (!tags.commonTags.includes(dateFilter.labelTo)) {
                        tags.commonTags.push(dateFilter.fieldname + 'to');
                    }
                }
            });

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
                    const dateFilter = dateFilters.find(({fieldname}) => fieldname === key);

                    if (!tags.commonTags.includes(key)) {
                        tags.selectedFacets[dateFilter.labelBlock] = [getDateRangesByKey()[type].label];
                    }
                } else if (key === 'creditqcode') {
                    tags.selectedFacets.credit = JSON.parse(type);
                } else {
                    const dateFilter = dateFilters.find(
                        ({fieldname}) => key === fieldname + 'from' || key === fieldname + 'to',
                    );

                    if (dateFilter != null && !tags.commonTags.includes(key)) {
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
        initSelectedParameters: initSelectedParameters,
    };
}
