type IComparisonOptions =
    {$eq: any}
    | {$ne: any}
    | {$gt: any}
    | {$gte: any}
    | {$lt: any}
    | {$lte: any};

export type IComparison = {[field: string]: IComparisonOptions};
export type IAndOperator = {$and: Array<IComparison | ILogicalOperator>};
export type IOrOperator = {$or: Array<IComparison | ILogicalOperator>};
export type ILogicalOperator = IAndOperator | IOrOperator;

function isLogicalOperator(x: ILogicalOperator | IComparison): x is ILogicalOperator {
    return x['$and'] != null || x['$or'] != null;
}

export interface ISuperdeskQuery {
    filter: ILogicalOperator;
    fullTextSearch?: string;
    sort: Array<{[field: string]: 'asc' | 'desc'}>;
    page: number;
    max_results: number;
}

function toElasticFilter(q: ILogicalOperator | IComparison) {
    if (isLogicalOperator(q)) {
        const r = {};

        if (q['$and'] != null) {
            r['and'] = q['$and'].map((_q) => toElasticFilter(_q));
        }
        if (q['$or'] != null) {
            r['or'] = q['$or'].map((_q) => toElasticFilter(_q));
        }

        return r;
    } else {
        return Object.keys(q).reduce((acc, field) => {
            const comparisonOptions = q[field];

            const operator = Object.keys(comparisonOptions)[0];
            const value = comparisonOptions[operator];

            switch (operator) {
            case '$eq':
                return {term: {[field]: value}};
            case '$ne':
                return {not: {term: {[field]: value}}};
            case '$gt':
                return {range: {[field]: {'gt': value}}};
            case '$gte':
                return {range: {[field]: {'gte': value}}};
            case '$lt':
                return {range: {[field]: {'lt': value}}};
            case '$lte':
                return {range: {[field]: {'lte': value}}};
            }

            throw new Error(`Conversion for operator ${operator} is not defined.`);
        }, {});
    }
}

export function getQueryFieldsRecursive(q: ILogicalOperator | IComparison): Set<string> {
    var fields = new Set<string>();

    if (isLogicalOperator(q)) {
        if (q['$and'] != null) {
            q['$and'].forEach((q1: ILogicalOperator | IComparison) => {
                getQueryFieldsRecursive(q1).forEach((field) => {
                    fields.add(field);
                });
            });
        }
        if (q['$or'] != null) {
            q['$or'].forEach((q1: ILogicalOperator | IComparison) => {
                getQueryFieldsRecursive(q1).forEach((field) => {
                    fields.add(field);
                });
            });
        }

        return fields;
    } else {
        return new Set<string>(Object.keys(q));
    }
}

export function toElasticQuery(q: ISuperdeskQuery) {
    const filtered = {filter: toElasticFilter(q.filter)};

    if (q.fullTextSearch != null) {
        filtered['query'] = {
            query_string: {
                query: q.fullTextSearch,
                lenient: true,
                default_operator: 'AND',
            },
        };
    }

    const query = {
        query: {
            filtered: filtered,
        },
        sort: q.sort,
        size: q.max_results,
        from: q.page * q.max_results,
    };

    return query;
}
