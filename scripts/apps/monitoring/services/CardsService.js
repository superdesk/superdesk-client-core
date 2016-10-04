CardsService.$inject = ['api', 'search', 'session', 'desks', 'config'];
export function CardsService(api, search, session, desks, config) {
    this.criteria = getCriteria;
    this.shouldUpdate = shouldUpdate;

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
        var params = {};
        var criteria = {};

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

        criteria.es_highlight = card.query ? search.getElasticHighlight() : 0;

        params.spike = (card.type === 'spike' || card.type === 'spike-personal' ||
            (card.type === 'search' && params.spike === true));

        var query = search.query(search.setFilters(params));

        switch (card.type) {
        case 'search':
            break;

        case 'spike-personal':
        case 'personal':
            query.filter({bool: {
                must: {term: {original_creator: session.identity._id}},
                must_not: {exists: {field: 'task.desk'}}
            }});
            break;

        case 'spike':
            query.filter({term: {'task.desk': card._id}});
            break;

        case 'highlights':
            query.filter({and: [
                {term: {'highlights': queryParam.highlight}}
            ]});
            break;

        case 'deskOutput':
            var desk_id = card._id.substring(0, card._id.indexOf(':'));
            var desk = desks.deskLookup ? desks.deskLookup[desk_id] : null;
            var states = ['scheduled', 'published', 'corrected', 'killed'];
            if (config.monitoring && config.monitoring.scheduled) {
                states = ['published', 'corrected', 'killed'];
            }
            if (desk) {
                if (desk.desk_type === 'authoring') {
                    query.filter({or: [
                        {term: {'task.last_authoring_desk': desk_id}},
                        {and: [
                            {term: {'task.desk': desk_id}},
                            {terms: {state: states}}
                        ]}
                    ]});
                } else if (desk.desk_type === 'production') {
                    query.filter({and: [
                        {term: {'task.desk': desk_id}},
                        {terms: {state: states}}
                    ]});
                }
            }
            break;

        case 'scheduledDeskOutput':
            desk_id = card._id.substring(0, card._id.indexOf(':'));
            query.filter({and: [
                {term: {'task.desk': desk_id}},
                {term: {state: 'scheduled'}}
            ]});
            break;

        default:
            if (card.singleViewType != null && card.singleViewType === 'desk') {
                query.filter({term: {'task.desk': card.deskId}});
            } else {
                query.filter({term: {'task.stage': card._id}});
            }
            break;
        }

        if (card.fileType) {
            var termsHighlightsPackage = {and: [
                {bool: {must: {'exists':{'field': 'highlight'}}}},
                {terms: {'type': ['composite']}}
            ]};

            var termsTakesPackage = {and: [
                {term: {'package_type': 'takes'}},
                {term: {'type': ['composite']}}
            ]};

            var termsFileType = {terms: {'type': JSON.parse(card.fileType)}};

            // Normal package
            if (_.includes(JSON.parse(card.fileType), 'composite')) {
                termsFileType = {and: [
                    {bool: {must_not: {'exists':{'field': 'highlight'}}}},
                    {bool: {must_not: {term: {'package_type': 'takes'}}}},
                    {terms: {'type': JSON.parse(card.fileType)}}
                ]};
            }

            if (_.includes(JSON.parse(card.fileType), 'highlightsPackage') &&
                _.includes(JSON.parse(card.fileType), 'takesPackage')) {
                query.filter({or: [
                    termsHighlightsPackage,
                    termsTakesPackage,
                    termsFileType
                ]});
            } else if (_.includes(JSON.parse(card.fileType), 'takesPackage')) {
                query.filter({or: [
                    termsTakesPackage,
                    termsFileType
                ]});
            } else if (_.includes(JSON.parse(card.fileType), 'highlightsPackage')) {
                query.filter({or: [
                    termsHighlightsPackage,
                    termsFileType
                ]});
            } else {
                query.filter(termsFileType);
            }
        }

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
            var desk_id = card._id.substring(0, card._id.indexOf(':'));
            if (desk_id) {
                return data.desks && !!data.desks[desk_id];
            }
            return false;
        default:
            // no way to determine if item should be visible, refresh
            return true;
        }
    }
}
