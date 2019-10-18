import _ from 'lodash';
import {setFilters} from 'apps/search/services/SearchService';
import {PUBLISHED_STATES} from 'apps/archive/constants';
import {ITEM_STATE} from 'apps/archive/constants';
import {
    DESK_OUTPUT,
    SENT_OUTPUT,
    SCHEDULED_OUTPUT,
} from 'apps/desks/constants';
import {appConfig} from 'core/config';

CardsService.$inject = ['api', 'search', 'session', 'desks', 'config'];
export function CardsService(api, search, session, desks, config) {
    this.criteria = getCriteria;
    this.shouldUpdate = shouldUpdate;

    function getCriteriaParams(card) {
        let params: any = {};

        if (card.type === 'search' && card.search && card.search.filter.query) {
            angular.copy(card.search.filter.query, params);
            if (card.query) {
                if (card.search.filter.query.q) {
                    params.q = '(' + card.query + ') ' + card.search.filter.query.q;
                } else {
                    params.q = '(' + card.query + ') ';
                }
            }
        } else {
            params.q = card.query;
        }

        if (card.type === 'spike' || card.type === 'spike-personal') {
            params.spike = 'only';
        }

        return params;
    }

    function filterQueryByCardType(query, queryParam, card) {
        let deskId;

        switch (card.type) {
        case 'search':
            break;

        case 'spike-personal':
        case 'personal':
            if (card.sent) {
                query.filter({bool: {
                    must: [
                        {term: {original_creator: session.identity._id}},
                        {exists: {field: 'task.desk'}},
                    ],
                }});
            } else {
                query.filter({bool: {
                    must: {term: {original_creator: session.identity._id}},
                    must_not: {exists: {field: 'task.desk'}},
                }});
            }
            break;

        case 'spike':
            query.filter({term: {'task.desk': card._id}});
            break;

        case 'highlights':
            query.filter({and: [
                {term: {highlights: queryParam.highlight}},
            ]});
            break;

        case DESK_OUTPUT:
            filterQueryByDeskType(query, card);
            break;

        case SENT_OUTPUT:
            deskId = card._id.substring(0, card._id.indexOf(':'));
            query.filter({bool: {
                filter: {term: {'task.desk_history': deskId}},
                must_not: {term: {'task.desk': deskId}},
            }});
            break;

        case SCHEDULED_OUTPUT:
            deskId = card._id.substring(0, card._id.indexOf(':'));
            query.filter({and: [
                {term: {'task.desk': deskId}},
                {term: {state: 'scheduled'}},
            ]});
            break;

        default:
            if (!_.isNil(card.singleViewType) && card.singleViewType === 'desk') {
                query.filter({term: {'task.desk': card.deskId}});
            } else {
                query.filter({term: {'task.stage': card._id}});
            }
            break;
        }
    }

    function filterQueryByDeskType(query, card) {
        var deskId = card._id.substring(0, card._id.indexOf(':'));
        var desk = desks.deskLookup ? desks.deskLookup[deskId] : null;
        var states = PUBLISHED_STATES;

        if (config.monitoring && config.monitoring.scheduled) {
            states = PUBLISHED_STATES.filter((state) => state !== ITEM_STATE.SCHEDULED);
        }

        if (desk) {
            const must: Array<{}> = [
                {term: {'task.desk': deskId}},
                {terms: {state: states}},
            ];

            if (desk.desk_type === 'authoring') {
                query.filter({bool: {should: [
                    {term: {'task.last_authoring_desk': deskId}},
                    {bool: {must}},
                ]}});
            } else if (desk.desk_type === 'production') {
                query.filter({bool: {must}});
            }
        }

        if (appConfig.features.nestedItemsInOutputStage) {
            query.setOption('hidePreviousVersions', true);
        }
    }

    function filterQueryByCardFileType(query, card) {
        if (card.fileType) {
            var termsHighlightsPackage = {and: [
                {bool: {must: {exists: {field: 'highlight'}}}},
                {term: {type: 'composite'}},
            ]};

            var termsFileType: any = {terms: {type: JSON.parse(card.fileType)}};

            // Normal package
            if (_.includes(JSON.parse(card.fileType), 'composite')) {
                termsFileType = {and: [
                    {bool: {must_not: {exists: {field: 'highlight'}}}},
                    {terms: {type: JSON.parse(card.fileType)}},
                ]};
            }

            if (_.includes(JSON.parse(card.fileType), 'highlightsPackage')) {
                query.filter({or: [
                    termsHighlightsPackage,
                    termsFileType,
                ]});
            } else {
                query.filter(termsFileType);
            }
        }
    }

    /**
     * Get items criteria for given card
     *
     * Card can be stage/personal/saved search.
     * There can be also extra string search query
     *
     * @param {Object} card
     * @param {string} queryString
     */
    function getCriteria(card, queryString, queryParam) {
        var params = getCriteriaParams(card);
        var query = search.query(setFilters(params));
        var criteria: any = {es_highlight: card.query ? search.getElasticHighlight() : 0};

        filterQueryByCardType(query, queryParam, card);
        filterQueryByCardFileType(query, card);

        if (queryString) {
            query.filter({query: {query_string: {query: queryString, lenient: false}}});
            criteria.es_highlight = search.getElasticHighlight();
        }

        criteria.source = query.getCriteria();
        if (card.type === 'search' && card.search && card.search.filter.query.repo) {
            criteria.repo = card.search.filter.query.repo;
        } else if (desks.isPublishType(card.type)) {
            criteria.repo = 'archive,published';
        }

        criteria.source.from = 0;
        criteria.source.size = card.max_items || 25;
        return criteria;
    }

    function shouldUpdate(card, data) {
        switch (card.type) {
        case 'stage':
            // refresh stage if it matches updated stage
            return data.stages && !!data.stages[card._id];
        case 'personal':
            return data.user === session.identity._id;
        case DESK_OUTPUT:
        case SENT_OUTPUT:
        case SCHEDULED_OUTPUT:
            var deskId = card._id.substring(0, card._id.indexOf(':'));

            if (deskId) {
                return data.desks && !!data.desks[deskId];
            }
            return false;
        default:
            // no way to determine if item should be visible, refresh
            return true;
        }
    }
}
