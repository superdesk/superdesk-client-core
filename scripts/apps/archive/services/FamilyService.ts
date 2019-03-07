import _, {get} from 'lodash';

/**
 * @ngdoc service
 * @module superdesk.apps.archive
 * @name family
 * @requires api
 * @requires desks
 * @description Family Service is responsible for returning related items of a given story
 */
FamilyService.$inject = ['api', 'desks'];

export function FamilyService(api, desks) {
    const repo = 'archive,published';


    /**
     * @ngdoc method
     * @name family#fetchItems
     * @public
     * @description Returns duplicates of a given story
     * @param {string} familyId
     * @param {Object} excludeItem
     * @returns {Object}
     */
    this.fetchItems = (familyId, excludeItem) => {
        let filter: Array<any> = [
            {not: {term: {state: 'spiked'}}},
            {term: {family_id: familyId}},
        ];

        if (excludeItem) {
            filter.push({not: {term: {unique_id: excludeItem.unique_id}}});
        }

        return query(filter, 'versioncreated', 'desc');
    };

    /**
     * @ngdoc method
     * @name family#fetchMediaUsedItems
     * @public
     * @description Returns stories which have used a media item
     * @param {string} mediaUniqueId
     * @returns {Array}
     */
    this.fetchMediaUsedItems = (mediaUniqueId) => {
        let filter = [
            {not: {term: {state: 'spiked'}}},
            {term: {'associations.featuremedia.unique_id': mediaUniqueId}},
        ];

        return query(filter, 'versioncreated', 'desc');
    };

    /**
     * @ngdoc method
     * @name family#query
     * @private
     * @description Creates the query object and performs the query
     * @param {Object} filter
     * @param {string} sortField
     * @param {string} order
     * @param {Object} queryString
     * @returns {Object}
     */
    const query = (filter: any, sortField: string, order: string, queryString?: string) => {
        let params: any = {
            repo: repo,
            source: {
                query: {filtered: {filter: {
                    and: filter,
                }}},
                size: 200,
                from: 0,
            },
        };

        if (queryString) {
            params.source.query.filtered.query = queryString;
        }

        params.source.sort = {};
        params.source.sort[sortField] = order;
        return api.query('search', params);
    };

    /**
     * @ngdoc method
     * @name family#fetchRelatedItems
     * @public
     * @description Returns takes, updates, corrections and kills of a given event_id
     * @param {Object} item - story to get related items of
     * @returns {Object}
     */
    this.fetchRelatedItems = (item) => {
        let filter = [
            {not: {term: {state: 'spiked'}}},
            {term: {event_id: item.event_id}},
            {not: {term: {type: 'composite'}}},
        ];

        return query(filter, 'versioncreated', 'asc');
    };

    /**
     * @ngdoc method
     * @name family#fetchRelatableItems
     * @public
     * @description Returns any story potentially linkable
     * @param {string} keyword - slugline to be matched
     * @param {string} sluglineMatch - type of matching rule for slugline
     * @param {item} item - authoring item that the user is trying to link
     * @param {string} modificationDateAfter - filter for versioncreated
     * @returns {Object}
     */
    this.fetchRelatableItems = (keyword, sluglineMatch, item, modificationDateAfter) => {
        let filter: Array<any> = [
            {not: {term: {state: 'spiked'}}},
            {not: {term: {event_id: item.event_id}}},
            {not: {term: {type: 'composite'}}},
            {not: {term: {last_published_version: 'false'}}},
            {term: {type: item.type}},
        ];

        if (get(item, 'genre[0].qcode')) {
            filter.push({term: {'genre.qcode': get(item, 'genre[0].qcode')}});
        }

        let queryString = null;
        let queryRelatedItem = [];
        let sanitizedKeyword = keyword.replace(/[\\:]/g, '').replace(/\//g, '\\/');
        let queryWords = sanitizedKeyword.split(' ');

        const addSlugs = function(list, words) {
            words.forEach((w) => {
                if (w) {
                    list.push('slugline:(' + w + ')');
                }
            });
        };

        // process creation date
        if (modificationDateAfter) {
            let dateQuery: any = {};

            dateQuery.versioncreated = {
                gte: modificationDateAfter,
            };
            filter.push({range: dateQuery});
        }

        switch (sluglineMatch) {
        case 'ANY': // any words in the slugline
            if (keyword.indexOf(' ') >= 0) {
                queryRelatedItem.push('slugline:("' + sanitizedKeyword + '")');
            }

            addSlugs(queryRelatedItem, queryWords);

            if (queryRelatedItem.length) {
                queryString = {
                    query_string: {
                        query: queryRelatedItem.join(' '),
                        lenient: false,
                        default_operator: 'OR',
                    },
                };
            }

            break;
        case 'PREFIX': // phrase prefix
            queryString = {
                match_phrase_prefix: {
                    'slugline.phrase': sanitizedKeyword,
                },
            };
            break;
        default:
            // exact match on slugline
            queryString = {
                query_string: {
                    query: 'slugline.phrase:("' + sanitizedKeyword + '")',
                    lenient: false,
                },
            };
        }

        return query(filter, 'firstcreated', 'asc', queryString);
    };

    /**
     * @ngdoc method
     * @name family#fetchDesks
     * @public
     * @description Returns the fetched desk list of a given story
     * @param {Object} item - story
     * @param {bookean} excludeSelf
     * @returns {Object}
     */
    this.fetchDesks = (item, excludeSelf) => this.fetchItems(item.state === 'ingested' ?
        item._id : item.family_id, excludeSelf ? item : undefined)
        .then((items) => {
            let deskList = [];
            let deskIdList = [];

            _.each(items._items, (i) => {
                if (i.task && i.task.desk && desks.deskLookup[i.task.desk]) {
                    if (deskIdList.indexOf(i.task.desk) < 0) {
                        var _isMember = !_.isEmpty(_.find(desks.userDesks, {_id: i.task.desk}));

                        deskList.push(
                            {
                                desk: desks.deskLookup[i.task.desk],
                                count: 1,
                                itemId: i._id,
                                isUserDeskMember: _isMember,
                                item: i,
                            });
                        deskIdList.push(i.task.desk);
                    } else {
                        deskList[deskIdList.indexOf(i.task.desk)].count += 1;
                    }
                }
            });
            return deskList;
        });
}
