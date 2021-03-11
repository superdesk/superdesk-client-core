import {IElasticSearchApi} from 'superdesk-api';

export const elasticsearchApi: IElasticSearchApi = {
    exists: (params) => ({
        exists: {
            field: params.field,
        },
    }),
    term: (params) => ({
        term: {
            [params.field]: {
                value: params.value,
                boost: params.boost,
            },
        },
    }),
    terms: (params) => ({
        terms: {
            [params.field]: params.value,
            boost: params.boost,
        },
    }),
    matchPhrase: (params) => ({
        match_phrase: {
            [params.field]: {
                query: params.query,
                analyzer: params.analyzer,
            },
        },
    }),
    match: (params) => ({
        match: {
            [params.field]: {
                query: params.query,
                analyzer: params.analyzer,
                auto_generate_synonyms_phrase_query: params.auto_generate_synonyms_phrase_query,
                fuzziness: params.fuzziness,
                max_expansions: params.max_expansions,
                prefix_length: params.prefix_length,
                fuzzy_transpositions: params.fuzzy_transpositions,
                fuzzy_rewrite: params.fuzzy_rewrite,
                lenient: params.lenient,
                operator: params.operator,
                minimum_should_match: params.minimum_should_match,
                zero_terms_query: params.zero_terms_query,
            },
        },
    }),
    range: (params) => ({
        range: {
            [params.field]: {
                gt: params.gt,
                gte: params.gte,
                lt: params.lt,
                lte: params.lte,
                format: params.format,
                relation: params.relation,
                time_zone: params.time_zone,
                boost: params.boost,
            },
        },
    }),
    queryString: (params) => ({
        query_string: {
            query: params.query,
            default_field: params.default_field,
            allow_leading_wildcard: params.allow_leading_wildcard,
            analyze_wildcard: params.analyze_wildcard,
            analyzer: params.analyzer,
            auto_generate_synonyms_phrase_query: params.auto_generate_synonyms_phrase_query,
            boost: params.boost,
            default_operator: params.default_operator,
            enable_position_increments: params.enable_position_increments,
            fields: params.fields,
            fuzziness: params.fuzziness,
            fuzzy_max_expansions: params.fuzzy_max_expansions,
            fuzzy_prefix_length: params.fuzzy_prefix_length,
            fuzzy_transpositions: params.fuzzy_transpositions,
            lenient: params.lenient,
            max_determinized_states: params.max_determinized_states,
            minimum_should_match: params.minimum_should_match,
            quote_analyzer: params.quote_analyzer,
            phrase_slop: params.phrase_slop,
            quote_field_suffix: params.quote_field_suffix,
            rewrite: params.rewrite,
            time_zone: params.time_zone,
        },
    }),
    bool: (params) => ({
        bool: {
            must: params.must,
            must_not: params.must_not,
            filter: params.filter,
            should: params.should,
            minimum_should_match: params.minimum_should_match,
            boost: params.boost,
        },
    }),
};
