import _ from 'lodash';

CardsService.$inject = ['api', 'search', 'session', 'desks', 'config'];
export function CardsService(api, search, session, desks, config) {
    this.criteria = getCriteria;
    this.shouldUpdate = shouldUpdate;

    function getCriteriaParams(card) {
        let params = {};

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
            query.filter({bool: {
                must: {term: {original_creator: session.identity._id}},
                must_not: {exists: {field: 'task.desk'}},
            }});
            break;

        case 'spike':
            query.filter({term: {'task.desk': card._id}});
            break;

        case 'highlights':
            query.filter({and: [
                {term: {highlights: queryParam.highlight}},
            ]});
            break;

        case 'deskOutput':
            filterQueryByDeskType(query, card);
            break;

        case 'scheduledDeskOutput':
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
        var states = ['scheduled', 'published', 'corrected', 'killed', 'recalled'];

        if (config.monitoring && config.monitoring.scheduled) {
            states = ['published', 'corrected', 'killed', 'recalled'];
        }
        if (desk) {
            if (desk.desk_type === 'authoring') {
                query.filter({or: [
                    {term: {'task.last_authoring_desk': deskId}},
                    {and: [
                        {term: {'task.desk': deskId}},
                        {terms: {state: states}},
                    ]},
                ]});
            } else if (desk.desk_type === 'production') {
                query.filter({and: [
                    {term: {'task.desk': deskId}},
                    {terms: {state: states}}]});
            }
        }
    }

    function filterQueryByCardFileType(query, card) {
        if (card.fileType) {
            var termsHighlightsPackage = {and: [
                {bool: {must: {exists: {field: 'highlight'}}}},
                {term: {type: 'composite'}},
            ]};

            var termsFileType = {terms: {type: JSON.parse(card.fileType)}};

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
        var query = search.query(search.setFilters(params));
        var criteria = {es_highlight: card.query ? search.getElasticHighlight() : 0};

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
        case 'deskOutput':
        case 'scheduledDeskOutput':
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
